import { body, denied, json, isAdmin, safeUrl, str, type Ctx } from '../../_lib';

type Row = { id: string; genre: string; name_en: string; name_ar: string; tagline_en: string; tagline_ar: string; image: string; hidden: number; custom: number; tournament_only?: number; details?: string };
const GENRES = ['Arcade', 'Board', 'Card', 'Social', 'Sports', 'Word'];
const out = (r: Row) => ({
  id: r.id, genre: r.genre, name: { en: r.name_en, ar: r.name_ar }, tagline: { en: r.tagline_en, ar: r.tagline_ar },
  image: r.image, hidden: !!r.hidden, custom: !!r.custom, tournamentOnly: !!r.tournament_only, details: readDetails(r.details),
});

const LEVELS = ['easy', 'medium', 'hard'];
const lines = (v: unknown) => String(typeof v === 'string' ? v : '').split(/\r?\n/).map((l) => l.trim().slice(0, 240)).filter(Boolean).slice(0, 12).join('\n');
/** Extra game-page content (how to play, tip, video, quick facts), stored as one JSON text column. */
export function cleanDetails(raw: unknown) {
  const d = (raw ?? {}) as Record<string, unknown>;
  const pair = (k: string, f: (v: unknown) => string) => { const o = (d[k] ?? {}) as Record<string, unknown>; return { en: f(o.en), ar: f(o.ar) }; };
  return {
    how: pair('how', lines), tip: pair('tip', (v) => str(v, 300)), video: str(d.video, 200),
    players: str(d.players, 20), minutes: str(d.minutes, 10), level: LEVELS.includes(str(d.level, 10)) ? str(d.level, 10) : '',
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
