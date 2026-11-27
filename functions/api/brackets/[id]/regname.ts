import { allows, bracketAccess } from '../../../_access';
import { currentUser, sameOrigin } from '../../../_auth';
import { applyRename, applyReplace } from '../../../_join';
import { body, denied, json, type Ctx } from '../../../_lib';

/** Owner (or a co-editor with the registrants permission): change the name a registrant is shown with (list + bracket). The registered ID stays as it was. */
export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const acc = await bracketAccess(ctx.env, ctx.params.id, u.id);
  if (!acc || !allows(acc, 'regs')) return json({ error: 'not_found' }, 404);
  const b = await body(ctx.request);
  const tid = acc.site ? ctx.params.id : `u-${ctx.params.id}`; // a site tournament's registrations carry its own id
  const r = b.op === 'replace' || b.op === 'edit' ? await applyReplace(ctx.env, ctx.params.id, tid, b) : await applyRename(ctx.env, ctx.params.id, tid, b);
  return json(r.ok ? { ok: true, ...('name' in r && r.name ? { name: r.name } : {}) } : { error: r.error }, r.status);
};
