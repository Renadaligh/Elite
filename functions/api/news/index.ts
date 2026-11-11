import { announceNews } from '../../_discord';
import { body, json, newId, safeUrl, str, type Ctx } from '../../_lib';
import { guard, seesAll } from '../../_admin';

type Row = { id: string; date: string; tag: string; title_en: string; title_ar: string; summary_en: string; summary_ar: string; image: string; link: string; published: number };
const out = (r: Row) => ({
  id: r.id, date: r.date, tag: r.tag, title: { en: r.title_en, ar: r.title_ar }, summary: { en: r.summary_en, ar: r.summary_ar },
  image: r.image || undefined, href: r.link || undefined, published: !!r.published,
});

export const TAGS = ['update', 'tournament', 'community', 'event'];
export function parse(b: Record<string, unknown>) {
  const t = (b.title ?? {}) as Record<string, unknown>, s = (b.summary ?? {}) as Record<string, unknown>;
  const date = str(b.date, 10);
  const title_en = str(t.en, 200), title_ar = str(t.ar, 200);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (!title_en && !title_ar)) return null;
  return {
    date, tag: TAGS.includes(str(b.tag, 20)) ? str(b.tag, 20) : 'update',
    title_en: title_en || title_ar, title_ar: title_ar || title_en,
    summary_en: str(s.en, 600) || str(s.ar, 600), summary_ar: str(s.ar, 600) || str(s.en, 600),
    image: safeUrl(b.image), link: safeUrl(b.href), published: b.published === false ? 0 : 1,
  };
}

export const onRequestGet = async ({ request, env }: Ctx) => {
  const all = await seesAll(request, env, 'news');
  const { results } = await env.DB.prepare(`SELECT * FROM news ${all ? '' : 'WHERE published = 1'} ORDER BY date DESC`).all<Row>();
  return json(results.map(out));
};

export const onRequestPost = async ({ request, env }: Ctx) => {
  const a = await guard(request, env, 'news', 'add'); if (a instanceof Response) return a;
  const v = parse(await body(request));
  if (!v) return json({ error: 'invalid' }, 400);
  const id = newId();
  await env.DB.prepare('INSERT INTO news (id,date,tag,title_en,title_ar,summary_en,summary_ar,image,link,published) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(id, v.date, v.tag, v.title_en, v.title_ar, v.summary_en, v.summary_ar, v.image, v.link, v.published).run();
  if (v.published) await announceNews(env, request, id, v);
  return json({ ok: true, id });
};
