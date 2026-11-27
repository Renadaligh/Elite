import { allows, bracketAccess } from '../../../_access';
import { currentUser, sameOrigin } from '../../../_auth';
import { answersMap, cleanForm, deleteAnswers, namesMap, withNames, joinCount, joinDesc, joinDescPair, joinDoneMsg, joinDoneMsgPair, joinForm, joinTitleEn, joinExtra, joinReason, joinRow, packDesc, saveForm } from '../../../_join';
import { body, denied, json, type Ctx } from '../../../_lib';

/** Pick of the fields a co-editor who only has the tournament-info permission may send (the details that are kept in step with the link). */
const INFO_FIELDS = ['cover', 'startsAt', 'mode', 'cap', 'titleEn'];

/** Owner (or a co-editor with the link / registrants / info permission): settings of the registration link. The people who signed up are only for who may see the registrants. */
export const onRequestGet = async (ctx: Ctx) => {
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const acc = await bracketAccess(ctx.env, ctx.params.id, u.id);
  if (!allows(acc, 'join', 'regs', 'info')) return json({ error: 'not_found' }, 404);
  const seesRegs = allows(acc, 'regs');
  const r = await joinRow(ctx.env, ctx.params.id);
  let signups: unknown[] = [];
  try { signups = (await ctx.env.DB.prepare('SELECT id, mode, plato_id, team_name, members, created_at FROM bracket_signups WHERE bracket_id = ? ORDER BY id ASC LIMIT 5000').bind(ctx.params.id).all()).results ?? []; } catch { return json({ error: 'migrate' }, 500); }
  const count = signups.length;
  const ans = await answersMap(ctx.env, ctx.params.id);
  signups = seesRegs ? withNames((signups as { id: number }[]).map((s) => (ans[s.id] ? { ...s, answers: ans[s.id] } : s)), await namesMap(ctx.env, ctx.params.id, 'j')) : [];
  const ex = await joinExtra(ctx.env, ctx.params.id);
  return json({ form: await joinForm(ctx.env, ctx.params.id), titleEn: await joinTitleEn(ctx.env, ctx.params.id), description: await joinDesc(ctx.env, ctx.params.id), doneMsg: await joinDoneMsg(ctx.env, ctx.params.id), cover: ex.cover, startsAt: ex.startsAt, enabled: !!r?.enabled, mode: r?.mode === 'team' ? 'team' : 'solo', cap: r?.cap ?? 0, closesAt: r?.closes_at ?? 0, closed: !!r?.closed, reason: r ? joinReason(r, count) : '', count, signups });
};

/** Owner (or a co-editor with the link permission): turn the link on/off, solo/team, cap, auto-close time (epoch ms, 0 = none), close now / reopen. */
export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const acc = await bracketAccess(ctx.env, ctx.params.id, u.id);
  if (!allows(acc, 'join', 'info') || !acc) return json({ error: 'not_found' }, 404);
  const sent = await body(ctx.request);
  // without the link permission only the details shared with the tournament info can change
  const b: Record<string, unknown> = allows(acc, 'join') ? sent : Object.fromEntries(INFO_FIELDS.filter((k) => k in sent).map((k) => [k, sent[k]]));
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
      .bind(ctx.params.id, acc.ownerId || 'site', enabled ? 1 : 0, mode, cap, closesFinal, closed).run();
  } catch { return json({ error: 'migrate' }, 500); }
  // cover picture (our own R2 url only) and start date of the registration page; two extra columns, see schema.sql
  const hasCover = typeof b.cover === 'string', hasStart = typeof b.startsAt === 'string';
  if (hasCover || hasStart) {
    const cover = hasCover && /^\/api\/img\/[0-9a-f-]{36}\.[a-z0-9]{3,4}$/.test(String(b.cover)) ? String(b.cover) : '';
    const sa = hasStart && !Number.isNaN(Date.parse(String(b.startsAt))) ? String(b.startsAt).slice(0, 40) : '';
    try {
      if (hasCover) await ctx.env.DB.prepare('UPDATE bracket_join SET cover = ? WHERE bracket_id = ?').bind(cover, ctx.params.id).run();
      // a site tournament's registration picture IS its card's picture (a new one starts centred), like in the dashboard
      if (hasCover && acc.site) await ctx.env.DB.prepare('UPDATE tournaments SET image = ?, image_pos = ? WHERE id = ?').bind(cover, '', ctx.params.id).run().catch(() => ctx.env.DB.prepare('UPDATE tournaments SET image = ? WHERE id = ?').bind(cover, ctx.params.id).run().catch(() => undefined));
      if (hasStart) await ctx.env.DB.prepare('UPDATE bracket_join SET starts_at = ? WHERE bracket_id = ?').bind(sa, ctx.params.id).run();
    } catch { return json({ error: 'migrate' }, 500); }
  }
  if (typeof b.titleEn === 'string') {
    try { await ctx.env.DB.prepare('UPDATE bracket_join SET title_en = ? WHERE bracket_id = ?').bind(String(b.titleEn).trim().slice(0, 80), ctx.params.id).run(); } catch { return json({ error: 'migrate' }, 500); }
  }
  if (typeof b.description === 'string') {
    // a site tournament keeps its English text next to the Arabic one: only the Arabic changes here
    const text = String(b.description).trim().slice(0, 600);
    try { await ctx.env.DB.prepare('UPDATE bracket_join SET description = ? WHERE bracket_id = ?').bind(acc.site ? packDesc(text, (await joinDescPair(ctx.env, ctx.params.id)).en) : text, ctx.params.id).run(); } catch { return json({ error: 'migrate' }, 500); }
  }
  if (b.form !== undefined) {
    const f = cleanForm(b.form);
    if (!f) return json({ error: 'invalid' }, 400);
    try { await saveForm(ctx.env, ctx.params.id, f); } catch { return json({ error: 'migrate' }, 500); }
  }
  if (typeof b.doneMsg === 'string') {
    const text = String(b.doneMsg).trim().slice(0, 400);
    try { await ctx.env.DB.prepare('UPDATE bracket_join SET done_msg = ? WHERE bracket_id = ?').bind(acc.site ? packDesc(text, (await joinDoneMsgPair(ctx.env, ctx.params.id)).en) : text, ctx.params.id).run(); } catch { return json({ error: 'migrate' }, 500); }
  }
  return json({ ok: true, count: await joinCount(ctx.env, ctx.params.id) });
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  if (!allows(await bracketAccess(ctx.env, ctx.params.id, u.id), 'regs')) return json({ error: 'not_found' }, 404);
  const rid = Number(new URL(ctx.request.url).searchParams.get('rid'));
  if (!Number.isInteger(rid)) return json({ error: 'invalid' }, 400);
  await ctx.env.DB.prepare('DELETE FROM bracket_signups WHERE id = ? AND bracket_id = ?').bind(rid, ctx.params.id).run();
  await deleteAnswers(ctx.env, 'j', rid);
  return json({ ok: true });
};
