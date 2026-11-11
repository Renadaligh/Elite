import { body, json, type Ctx } from '../../_lib';
import { guard } from '../../_admin';
import { announceNews } from '../../_discord';
import { parse } from './index';

export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'news', 'edit'); if (a instanceof Response) return a;
  const v = parse(await body(request));
  if (!v) return json({ error: 'invalid' }, 400);
  const was = await env.DB.prepare('SELECT published FROM news WHERE id=?').bind(params.id).first<{ published: number }>();
  await env.DB.prepare('UPDATE news SET date=?,tag=?,title_en=?,title_ar=?,summary_en=?,summary_ar=?,image=?,link=?,published=? WHERE id=?')
    .bind(v.date, v.tag, v.title_en, v.title_ar, v.summary_en, v.summary_ar, v.image, v.link, v.published, params.id).run();
  if (v.published && was && !was.published) await announceNews(env, request, params.id, v); // announced once: when it goes from draft to published
  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'news', 'delete'); if (a instanceof Response) return a;
  await env.DB.prepare('DELETE FROM news WHERE id=?').bind(params.id).run();
  return json({ ok: true });
};
