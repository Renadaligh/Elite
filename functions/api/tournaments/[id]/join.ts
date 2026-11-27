import { guardTournament } from '../../../_share';
import { sameOrigin } from '../../../_auth';
import { answersMap, cleanForm, deleteAnswers, namesMap, withNames, joinCount, joinDescPair, joinForm, packDesc, joinDoneMsgPair, joinTitleEn, joinExtra, siteLook, joinReason, joinRow, saveForm } from '../../../_join';
import { body, json, type Ctx } from '../../../_lib';
import { dataId } from '../../../_tid';

async function exists(ctx: Ctx) {
  try { return !!(await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ?').bind(ctx.params.id).first()); } catch { return false; }
}

/** Site tournament (admin): settings of the registration link + everyone who signed up through it. */
export const onRequestGet = async (ctx: Ctx) => {
  const u = await guardTournament(ctx.request, ctx.env, ctx.params.id, 'join', 'regs', 'info'); if (u instanceof Response) return u;
  if (!(await exists(ctx))) return json({ error: 'not_found' }, 404);
  const did = await dataId(ctx.env, ctx.params.id);
  const r = await joinRow(ctx.env, did);
  let signups: unknown[] = [];
  try { signups = (await ctx.env.DB.prepare('SELECT id, mode, plato_id, team_name, members, created_at FROM bracket_signups WHERE bracket_id = ? ORDER BY id ASC LIMIT 5000').bind(did).all()).results ?? []; } catch { return json({ error: 'migrate' }, 500); }
  const count = signups.length;
  const ans = await answersMap(ctx.env, did, 'j');
  signups = withNames((signups as { id: number }[]).map((s) => (ans[s.id] ? { ...s, answers: ans[s.id] } : s)), await namesMap(ctx.env, did, 'j'));
  if (!u.full && !u.perms.includes('regs')) signups = []; // the people who signed up are only for who was given the registrants
  const ex = await joinExtra(ctx.env, did);
  const look = await siteLook(ctx.env, ctx.params.id); // picture and date of the registration page = the ones of the tournament's info card
  return json({ form: await joinForm(ctx.env, did), titleEn: await joinTitleEn(ctx.env, did), ...(await (async () => { const d = await joinDescPair(ctx.env, did); return { description: d.ar, descriptionEn: d.en }; })()), ...(await (async () => { const d = await joinDoneMsgPair(ctx.env, did); return { doneMsg: d.ar, doneMsgEn: d.en }; })()), cover: look?.image || ex.cover, coverPos: look?.image ? look.pos : '', startsAt: ex.startsAt, enabled: !!r?.enabled, mode: r?.mode === 'team' ? 'team' : 'solo', cap: r?.cap ?? 0, closesAt: r?.closes_at ?? 0, closed: !!r?.closed, reason: r ? joinReason(r, count) : '', count, signups });
};

/** Site tournament (admin): turn the link on/off, solo/team, cap, auto-close time (epoch ms, 0 = none), close now / reopen. */
export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await guardTournament(ctx.request, ctx.env, ctx.params.id, 'join', 'info'); if (u instanceof Response) return u;
  if (!(await exists(ctx))) return json({ error: 'not_found' }, 404);
  const did = await dataId(ctx.env, ctx.params.id);
  const sent = await body(ctx.request);
  // without the link permission only the details shared with the tournament's info card can change
  const b: Record<string, unknown> = u.full || u.perms.includes('join') ? sent : Object.fromEntries(['cover', 'startsAt', 'mode', 'cap', 'titleEn'].filter((k) => k in sent).map((k) => [k, sent[k]]));
  const old = await joinRow(ctx.env, did);
  const enabled = typeof b.enabled === 'boolean' ? b.enabled : !!old?.enabled;
  const mode = b.mode === 'team' ? 'team' : b.mode === 'solo' ? 'solo' : old?.mode === 'team' ? 'team' : 'solo';
  const cap = typeof b.cap === 'number' && Number.isFinite(b.cap) ? Math.max(0, Math.min(1000, Math.floor(b.cap))) : old?.cap ?? 0;
  const closesAt = typeof b.closesAt === 'number' && Number.isFinite(b.closesAt) ? Math.max(0, Math.floor(b.closesAt)) : old?.closes_at ?? 0;
  const closed = typeof b.closed === 'boolean' ? (b.closed ? 1 : 0) : old?.closed ?? 0;
  // reopening after the closing time passed: the old time would close it again at once, so it is cleared
  const closesFinal = b.closed === false && closesAt > 0 && closesAt <= Date.now() && b.closesAt === undefined ? 0 : closesAt;
  try {
    await ctx.env.DB.prepare('INSERT INTO bracket_join (bracket_id, user_id, enabled, mode, cap, closes_at, closed) VALUES (?,?,?,?,?,?,?) ON CONFLICT(bracket_id) DO UPDATE SET enabled=excluded.enabled, mode=excluded.mode, cap=excluded.cap, closes_at=excluded.closes_at, closed=excluded.closed')
      .bind(did, u.admin.username, enabled ? 1 : 0, mode, cap, closesFinal, closed).run();
  } catch { return json({ error: 'migrate' }, 500); }
  // cover picture (our own R2 url only) and start date of the registration page; two extra columns, see schema.sql
  const hasCover = typeof b.cover === 'string', hasStart = typeof b.startsAt === 'string';
  if (hasCover || hasStart) {
    const cover = hasCover && /^\/api\/img\/[0-9a-f-]{36}\.[a-z0-9]{3,4}$/.test(String(b.cover)) ? String(b.cover) : '';
    const sa = hasStart && !Number.isNaN(Date.parse(String(b.startsAt))) ? String(b.startsAt).slice(0, 40) : '';
    try {
      if (hasCover) await ctx.env.DB.prepare('UPDATE bracket_join SET cover = ? WHERE bracket_id = ?').bind(cover, did).run();
      if (hasCover) { // the registration page's picture IS the tournament's picture: changed here, it changes on the site card too (a new picture starts centred)
        const t = ctx.env.DB.prepare('UPDATE tournaments SET image = ?, image_pos = ? WHERE id = ?').bind(cover, '', ctx.params.id);
        await t.run().catch(() => ctx.env.DB.prepare('UPDATE tournaments SET image = ? WHERE id = ?').bind(cover, ctx.params.id).run().catch(() => undefined));
      }
      if (hasStart) await ctx.env.DB.prepare('UPDATE bracket_join SET starts_at = ? WHERE bracket_id = ?').bind(sa, did).run();
    } catch { return json({ error: 'migrate' }, 500); }
  }
  if (typeof b.titleEn === 'string') {
    try { await ctx.env.DB.prepare('UPDATE bracket_join SET title_en = ? WHERE bracket_id = ?').bind(String(b.titleEn).trim().slice(0, 80), did).run(); } catch { return json({ error: 'migrate' }, 500); }
  }
  if (typeof b.description === 'string' || typeof b.descriptionEn === 'string') {
    const was = await joinDescPair(ctx.env, did);
    const ar = typeof b.description === 'string' ? String(b.description).trim().slice(0, 600) : was.ar;
    const en = typeof b.descriptionEn === 'string' ? String(b.descriptionEn).trim().slice(0, 600) : was.en;
    try { await ctx.env.DB.prepare('UPDATE bracket_join SET description = ? WHERE bracket_id = ?').bind(packDesc(ar, en), did).run(); } catch { return json({ error: 'migrate' }, 500); }
  }
  if (b.form !== undefined) {
    const f = cleanForm(b.form);
    if (!f) return json({ error: 'invalid' }, 400);
    try { await saveForm(ctx.env, did, f); } catch { return json({ error: 'migrate' }, 500); }
  }
  if (typeof b.doneMsg === 'string' || typeof b.doneMsgEn === 'string') {
    const was = await joinDoneMsgPair(ctx.env, did);
    const ar = typeof b.doneMsg === 'string' ? String(b.doneMsg).trim().slice(0, 400) : was.ar;
    const en = typeof b.doneMsgEn === 'string' ? String(b.doneMsgEn).trim().slice(0, 400) : was.en;
    try { await ctx.env.DB.prepare('UPDATE bracket_join SET done_msg = ? WHERE bracket_id = ?').bind(packDesc(ar, en), did).run(); } catch { return json({ error: 'migrate' }, 500); }
  }
  return json({ ok: true, count: await joinCount(ctx.env, did) });
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await guardTournament(ctx.request, ctx.env, ctx.params.id, 'regs'); if (u instanceof Response) return u;
  if (!(await exists(ctx))) return json({ error: 'not_found' }, 404);
  const did = await dataId(ctx.env, ctx.params.id);
  const rid = Number(new URL(ctx.request.url).searchParams.get('rid'));
  if (!Number.isInteger(rid)) return json({ error: 'invalid' }, 400);
  await ctx.env.DB.prepare('DELETE FROM bracket_signups WHERE id = ? AND bracket_id = ?').bind(rid, did).run();
  await deleteAnswers(ctx.env, 'j', rid);
  await ctx.env.DB.prepare('UPDATE tournaments SET filled = MAX(0, filled - 1) WHERE id = ?').bind(ctx.params.id).run().catch(() => undefined);
  return json({ ok: true });
};
