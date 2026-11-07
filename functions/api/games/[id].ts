import { body, denied, isAdmin, json, type Ctx } from '../../_lib';
import { parse } from './index';

/** PUT = create or update the row for this id (overrides a built-in game, or edits a custom one). */
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  const v = parse(await body(request));
  await env.DB.prepare(
    'INSERT INTO games (id,genre,name_en,name_ar,tagline_en,tagline_ar,image,hidden,custom) VALUES (?,?,?,?,?,?,?,?,?) ' +
    'ON CONFLICT(id) DO UPDATE SET genre=excluded.genre,name_en=excluded.name_en,name_ar=excluded.name_ar,tagline_en=excluded.tagline_en,tagline_ar=excluded.tagline_ar,image=excluded.image,hidden=excluded.hidden',
  ).bind(params.id, v.genre, v.name.en, v.name.ar, v.tagline.en, v.tagline.ar, v.image, v.hidden, v.custom).run();
  return json({ ok: true });
};

/** DELETE removes a custom game, or resets a built-in game back to its defaults. */
export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  await env.DB.prepare('DELETE FROM games WHERE id=?').bind(params.id).run();
  return json({ ok: true });
};
