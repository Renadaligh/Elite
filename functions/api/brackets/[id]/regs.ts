import { allows, bracketAccess } from '../../../_access';
import { currentUser, sameOrigin } from '../../../_auth';
import { denied, json, type Ctx } from '../../../_lib';
import { answersMap, deleteAnswers, namesMap, withNames } from '../../../_join';

/** The people who registered through the site for a community tournament: its owner, or a co-editor who was given the registrants permission. For a site tournament the member was added to, its own id is the tournament's. Returns the tournament id of the registrations, or null. */
async function regTid(ctx: Ctx, uid: string): Promise<string | null> {
  const acc = await bracketAccess(ctx.env, ctx.params.id, uid);
  return acc && allows(acc, 'regs') ? (acc.site ? ctx.params.id : `u-${ctx.params.id}`) : null;
}

export const onRequestGet = async (ctx: Ctx) => {
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const tid = await regTid(ctx, u.id);
  if (!tid) return json({ error: 'not_found' }, 404);
  const { results } = await ctx.env.DB.prepare('SELECT id, mode, plato_id, team_name, members, created_at FROM registrations WHERE tournament_id = ? ORDER BY id ASC').bind(tid).all<{ id: number }>();
  const ans = await answersMap(ctx.env, ctx.params.id, 'r');
  const nm = await namesMap(ctx.env, tid, 'r');
  return json(withNames((results ?? []).map((r) => (ans[r.id] ? { ...r, answers: ans[r.id] } : r)), nm));
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const tid = await regTid(ctx, u.id);
  if (!tid) return json({ error: 'not_found' }, 404);
  const rid = Number(new URL(ctx.request.url).searchParams.get('rid'));
  if (!Number.isInteger(rid)) return json({ error: 'invalid' }, 400);
  await ctx.env.DB.prepare('DELETE FROM registrations WHERE id = ? AND tournament_id = ?').bind(rid, tid).run();
  await deleteAnswers(ctx.env, 'r', rid);
  await ctx.env.DB.prepare('UPDATE tournaments SET filled = MAX(0, filled - 1) WHERE id = ?').bind(tid).run();
  return json({ ok: true });
};
