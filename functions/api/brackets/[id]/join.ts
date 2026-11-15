import { currentUser, sameOrigin } from '../../../_auth';
import { joinCount, joinReason, joinRow } from '../../../_join';
import { body, denied, json, type Ctx } from '../../../_lib';

async function mine(ctx: Ctx, uid: string) {
  try { return !!(await ctx.env.DB.prepare('SELECT 1 AS x FROM user_brackets WHERE id = ? AND user_id = ?').bind(ctx.params.id, uid).first()); } catch { return false; }
}

/** Owner: settings of the registration link + everyone who signed up through it. */
export const onRequestGet = async (ctx: Ctx) => {
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  if (!(await mine(ctx, u.id))) return json({ error: 'not_found' }, 404);
  const r = await joinRow(ctx.env, ctx.params.id);
  let signups: unknown[] = [];
  try { signups = (await ctx.env.DB.prepare('SELECT id, mode, plato_id, team_name, members, created_at FROM bracket_signups WHERE bracket_id = ? ORDER BY id ASC LIMIT 5000').bind(ctx.params.id).all()).results ?? []; } catch { return json({ error: 'migrate' }, 500); }
  const count = signups.length;
  return json({ enabled: !!r?.enabled, mode: r?.mode === 'team' ? 'team' : 'solo', cap: r?.cap ?? 0, closesAt: r?.closes_at ?? 0, closed: !!r?.closed, reason: r ? joinReason(r, count) : '', count, signups });
};

/** Owner: turn the link on/off, solo/team, cap, auto-close time (epoch ms, 0 = none), close now / reopen. */
export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  if (!(await mine(ctx, u.id))) return json({ error: 'not_found' }, 404);
  const b = await body(ctx.request);
  const old = await joinRow(ctx.env, ctx.params.id);
  const enabled = typeof b.enabled === 'boolean' ? b.enabled : !!old?.enabled;
  const mode = b.mode === 'team' ? 'team' : b.mode === 'solo' ? 'solo' : old?.mode === 'team' ? 'team' : 'solo';
  const cap = typeof b.cap === 'number' && Number.isFinite(b.cap) ? Math.max(0, Math.min(1000, Math.floor(b.cap))) : old?.cap ?? 0;
  const closesAt = typeof b.closesAt === 'number' && Number.isFinite(b.closesAt) ? Math.max(0, Math.floor(b.closesAt)) : old?.closes_at ?? 0;
  const closed = typeof b.closed === 'boolean' ? (b.closed ? 1 : 0) : old?.closed ?? 0;
  // reopening after the closing time passed: the old time would close it again at once, so it is cleared
  const closesFinal = b.closed === false && closesAt > 0 && closesAt <= Date.now() && b.closesAt === undefined ? 0 : closesAt;
  try {
    await ctx.env.DB.prepare('INSERT INTO bracket_join (bracket_id, user_id, enabled, mode, cap, closes_at, closed) VALUES (?,?,?,?,?,?,?) ON CONFLICT(bracket_id) DO UPDATE SET enabled=excluded.enabled, mode=excluded.mode, cap=excluded.cap, closes_at=excluded.closes_at, closed=excluded.closed')
      .bind(ctx.params.id, u.id, enabled ? 1 : 0, mode, cap, closesFinal, closed).run();
  } catch { return json({ error: 'migrate' }, 500); }
  return json({ ok: true, count: await joinCount(ctx.env, ctx.params.id) });
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  if (!(await mine(ctx, u.id))) return json({ error: 'not_found' }, 404);
  const rid = Number(new URL(ctx.request.url).searchParams.get('rid'));
  if (!Number.isInteger(rid)) return json({ error: 'invalid' }, 400);
  await ctx.env.DB.prepare('DELETE FROM bracket_signups WHERE id = ? AND bracket_id = ?').bind(rid, ctx.params.id).run();
  return json({ ok: true });
};
