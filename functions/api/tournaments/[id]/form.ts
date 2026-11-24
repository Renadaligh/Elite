import { joinForm } from '../../../_join';
import { json, type Ctx } from '../../../_lib';
import { dataId } from '../../../_tid';

/** Public: the organiser's own questions (and chosen colour) for the site's registration form of a published tournament. No questions = an empty list. */
export const onRequestGet = async ({ env, params }: Ctx) => {
  const t = await env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ? AND published = 1').bind(params.id).first().catch(() => null);
  if (!t) return json({ hue: null, qs: [] });
  return json(await joinForm(env, await dataId(env, params.id)));
};
