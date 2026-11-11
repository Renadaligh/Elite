import { body, denied, json, isAdmin, safeUrl, str, type Ctx } from '../../_lib';

type Row = { id: string; genre: string; name_en: string; name_ar: string; tagline_en: string; tagline_ar: string; image: string; hidden: number; custom: number; tournament_only?: number; details?: string };
/** Special row (not a game) that keeps the dashboard's display order and the list of deleted built-in games. */
export const META = '__meta';
const ids = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((i): i is string => typeof i === 'string' && i.length > 0 && i.length <= 60 && !i.startsWith('__')))].slice(0, 400) : []);
export function readMeta(j?: string) { try { const m = j ? JSON.parse(j) : {}; return { order: ids(m.order), deleted: ids(m.deleted) }; } catch { return { order: [] as string[], deleted: [] as string[] }; } }
export const cleanMeta = (m: { order?: unknown; deleted?: unknown }) => ({ order: ids(m.order), deleted: ids(m.deleted) });
const GENRES = ['Arcade', 'Board', 'Card', 'Social', 'Sports', 'Word'];
const out = (r: Row) => r.id === META ? { id: META, genre: '', name: { en: '', ar: '' }, tagline: { en: '', ar: '' }, image: '', hidden: true, custom: false, ...readMeta(r.details) } : ({
  id: r.id, genre: r.genre, name: { en: r.name_en, ar: r.name_ar }, tagline: { en: r.tagline_en, ar: r.tagline_ar },
  image: r.image, hidden: !!r.hidden, custom: !!r.custom, tournamentOnly: !!r.tournament_only, details: readDetails(r.details),
});

/** Game-page content edited in the dashboard, stored as one JSON text column: paragraphs (12), videos (8: YouTube links or uploaded files) and images (24). */
export function cleanDetails(raw: unknown) {
  const d = (raw ?? {}) as Record<string, unknown>;
  const arr = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max) : []) as Record<string, unknown>[];
  const pair = (o: unknown, max: number) => { const p = (o ?? {}) as Record<string, unknown>; return { en: str(p.en, max), ar: str(p.ar, max) }; };
  return {
    texts: arr(d.texts, 12).map((t) => ({ title: pair(t.title, 80), body: pair(t.body, 1200) })).filter((t) => t.title.en || t.title.ar || t.body.en || t.body.ar),
    videos: arr(d.videos, 8).map((v) => ({ title: pair(v.title, 80), url: str(v.url, 200) })).filter((v) => v.url),
    images: (Array.isArray(d.images) ? d.images.slice(0, 24) : []).map((u) => safeUrl(u)).filter(Boolean),
  };
}
function readDetails(j?: string) { try { return j ? cleanDetails(JSON.parse(j)) : undefined; } catch { return undefined; } }

export function parse(b: Record<string, unknown>) {
  const o = (k: string) => (b[k] ?? {}) as Record<string, unknown>;
  const name = { en: str(o('name').en, 80), ar: str(o('name').ar, 80) };
  const tagline = { en: str(o('tagline').en, 200), ar: str(o('tagline').ar, 200) };
  const genre = GENRES.includes(str(b.genre, 20)) ? str(b.genre, 20) : '';
  return { name, tagline, genre, image: safeUrl(b.image), hidden: b.hidden === true ? 1 : 0, custom: b.custom === true ? 1 : 0, tournamentOnly: b.tournamentOnly === true ? 1 : 0, details: JSON.stringify(cleanDetails(b.details)) };
}

/** Public list (the site merges it over the built-in games). Missing table → empty list, so the site keeps working. */
export const onRequestGet = async ({ env }: Ctx) => {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM games').all<Row>();
    return json(results.map(out));
  } catch { return json([]); }
};

export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  const v = parse(await body(request));
  if (!v.name.en && !v.name.ar) return json({ error: 'invalid' }, 400);
  const base = (v.name.en || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'game';
  const id = `${base}-${crypto.randomUUID().slice(0, 4)}`;
  const vals = [id, v.genre || 'Arcade', v.name.en || v.name.ar, v.name.ar || v.name.en, v.tagline.en, v.tagline.ar, v.image, v.hidden];
  const cols = 'id,genre,name_en,name_ar,tagline_en,tagline_ar,image,hidden,custom';
  const tries: [string, unknown[]][] = [
    [`INSERT INTO games (${cols},tournament_only,details) VALUES (?,?,?,?,?,?,?,?,1,?,?)`, [...vals, v.tournamentOnly, v.details]],
    [`INSERT INTO games (${cols},tournament_only) VALUES (?,?,?,?,?,?,?,?,1,?)`, [...vals, v.tournamentOnly]],
    [`INSERT INTO games (${cols}) VALUES (?,?,?,?,?,?,?,?,1)`, vals],
  ];
  // Older databases lack the newer columns: fall back to a plain insert instead of failing.
  for (let i = 0; i < tries.length; i++) {
    try { await env.DB.prepare(tries[i][0]).bind(...tries[i][1]).run(); break; } catch (e) { if (i === tries.length - 1) throw e; }
  }
  return json({ ok: true, id });
};
