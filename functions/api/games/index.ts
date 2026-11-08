import { body, denied, json, isAdmin, safeUrl, str, type Ctx } from '../../_lib';

type Row = { id: string; genre: string; name_en: string; name_ar: string; tagline_en: string; tagline_ar: string; image: string; hidden: number; custom: number; tournament_only?: number };
const GENRES = ['Arcade', 'Board', 'Card', 'Social', 'Sports', 'Word'];
const out = (r: Row) => ({
  id: r.id, genre: r.genre, name: { en: r.name_en, ar: r.name_ar }, tagline: { en: r.tagline_en, ar: r.tagline_ar },
  image: r.image, hidden: !!r.hidden, custom: !!r.custom, tournamentOnly: !!r.tournament_only,
});

export function parse(b: Record<string, unknown>) {
  const o = (k: string) => (b[k] ?? {}) as Record<string, unknown>;
  const name = { en: str(o('name').en, 80), ar: str(o('name').ar, 80) };
  const tagline = { en: str(o('tagline').en, 200), ar: str(o('tagline').ar, 200) };
  const genre = GENRES.includes(str(b.genre, 20)) ? str(b.genre, 20) : '';
  return { name, tagline, genre, image: safeUrl(b.image), hidden: b.hidden === true ? 1 : 0, custom: b.custom === true ? 1 : 0, tournamentOnly: b.tournamentOnly === true ? 1 : 0 };
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
  try {
    await env.DB.prepare('INSERT INTO games (id,genre,name_en,name_ar,tagline_en,tagline_ar,image,hidden,custom,tournament_only) VALUES (?,?,?,?,?,?,?,?,1,?)').bind(...vals, v.tournamentOnly).run();
  } catch {
    // Table not migrated yet (no "tournament_only" column): save without it.
    await env.DB.prepare('INSERT INTO games (id,genre,name_en,name_ar,tagline_en,tagline_ar,image,hidden,custom) VALUES (?,?,?,?,?,?,?,?,1)').bind(...vals).run();
  }
  return json({ ok: true, id });
};
