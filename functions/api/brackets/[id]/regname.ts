import { currentUser, sameOrigin } from '../../../_auth';
import { applyRename, applyReplace } from '../../../_join';
import { body, denied, json, type Ctx } from '../../../_lib';

/** Owner: change the name a registrant is shown with (list + bracket). The registered ID stays as it was. */
export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  let mine = false;
  try { mine = !!(await ctx.env.DB.prepare('SELECT 1 AS x FROM user_brackets WHERE id = ? AND user_id = ?').bind(ctx.params.id, u.id).first()); } catch { /* none */ }
  if (!mine) return json({ error: 'not_found' }, 404);
  const b = await body(ctx.request);
  const r = b.op === 'replace' || b.op === 'edit' ? await applyReplace(ctx.env, ctx.params.id, `u-${ctx.params.id}`, b) : await applyRename(ctx.env, ctx.params.id, `u-${ctx.params.id}`, b);
  return json(r.ok ? { ok: true, ...('name' in r && r.name ? { name: r.name } : {}) } : { error: r.error }, r.status);
};
