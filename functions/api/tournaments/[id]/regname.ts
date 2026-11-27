import { guardTournament } from '../../../_share';
import { sameOrigin } from '../../../_auth';
import { applyRename, applyReplace } from '../../../_join';
import { body, json, type Ctx } from '../../../_lib';
import { dataId } from '../../../_tid';

/** Admin: change the name a registrant of a SITE tournament is shown with. Community tournaments belong to their organiser: not here. */
export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await guardTournament(ctx.request, ctx.env, ctx.params.id, 'regs'); if (u instanceof Response) return u;
  if (ctx.params.id.startsWith('u-')) return json({ error: 'forbidden' }, 403);
  const ok = await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ?').bind(ctx.params.id).first().catch(() => null);
  if (!ok) return json({ error: 'not_found' }, 404);
  const b = await body(ctx.request), did = await dataId(ctx.env, ctx.params.id);
  const r = b.op === 'replace' || b.op === 'edit' ? await applyReplace(ctx.env, did, ctx.params.id, b) : await applyRename(ctx.env, did, ctx.params.id, b);
  return json(r.ok ? { ok: true, ...('name' in r && r.name ? { name: r.name } : {}) } : { error: r.error }, r.status);
};
