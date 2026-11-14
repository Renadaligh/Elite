import { currentUser, sameOrigin } from '../../../_auth';
import { denied, json, type Ctx } from '../../../_lib';

/** The people who registered through the site for a community tournament: only its owner sees them. */
async function owns(ctx: Ctx, uid: string) {
  try { return !!(await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ? AND owner_id = ?').bind(`u-${ctx.params.id}`, uid).first()); } catch { return false; }
}

export const onRequestGet = async (ctx: Ctx) => {
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  if (!(await owns(ctx, u.id))) return json({ error: 'not_found' }, 404);
  const { results } = await ctx.env.DB.prepare('SELECT id, mode, plato_id, team_name, members, created_at FROM registrations WHERE tournament_id = ? ORDER BY id ASC').bind(`u-${ctx.params.id}`).all();
  return json(results);
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  if (!(await owns(ctx, u.id))) return json({ error: 'not_found' }, 404);
  const rid = Number(new URL(ctx.request.url).searchParams.get('rid'));
  if (!Number.isInteger(rid)) return json({ error: 'invalid' }, 400);
  const tid = `u-${ctx.params.id}`;
  await ctx.env.DB.prepare('DELETE FROM registrations WHERE id = ? AND tournament_id = ?').bind(rid, tid).run();
  await ctx.env.DB.prepare('UPDATE tournaments SET filled = MAX(0, filled - 1) WHERE id = ?').bind(tid).run();
  return json({ ok: true });
};
