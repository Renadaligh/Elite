import { validId, validIds, body, json, str, type Ctx } from '../../_lib';
import { bracketOf, checkAnswers, joinCount, joinDescPair, joinDoneMsgPair, joinForm, joinTitleEn, joinExtra, joinShownCount, joinReason, joinRow, saveAnswers } from '../../_join';

const key = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const idsOf = (s: string) => s.split(/[\n,،;]+/).map(key).filter(Boolean);

/** Public registration page data: only the title, group name and how full it is. Never names, never the bracket. */
export const onRequestGet = async ({ env, params }: Ctx) => {
  const r = await joinRow(env, params.id);
  if (!r || !r.enabled) return json({ error: 'not_found' }, 404);
  const row = await bracketOf(env, params.id);
  if (!row) return json({ error: 'not_found' }, 404);
  let org = '', showCount = true; try { const d = JSON.parse(row.data) as { org?: unknown; info?: { showCount?: unknown } }; if (typeof d.org === 'string') org = d.org.slice(0, 60); if (d.info?.showCount === false) showCount = false; } catch { /* corrupt row */ }
  const count = await joinCount(env, params.id);
  const ex = await joinExtra(env, params.id);
  let startsAt = ex.startsAt;
  if (!startsAt) startsAt = (await env.DB.prepare('SELECT starts_at FROM tournaments WHERE id IN (?, ?) ORDER BY id DESC LIMIT 1').bind(`u-${params.id}`, params.id).first<{ starts_at: string }>().catch(() => null))?.starts_at ?? '';
  return json({ form: await joinForm(env, params.id), titleEn: await joinTitleEn(env, params.id), ...(await (async () => { const d = await joinDescPair(env, params.id); return { description: d.ar, descriptionEn: d.en }; })()), ...(await (async () => { const d = await joinDoneMsgPair(env, params.id); return { doneMsg: d.ar, doneMsgEn: d.en }; })()), title: row.title, org, showCount, cover: ex.cover, startsAt, mode: r.mode === 'team' ? 'team' : 'solo', count: await joinShownCount(env, params.id, count, row.data), cap: r.cap, closesAt: r.closes_at, reason: joinReason(r, count) });
};

export const onRequestPost = async ({ request, env, params }: Ctx) => {
  const b = await body(request);
  if (str(b.hp, 50)) return json({ ok: true }); // honeypot
  const r = await joinRow(env, params.id);
  if (!r || !r.enabled) return json({ ok: false, error: 'unknown' }, 404);
  const team = r.mode === 'team';
  const plato = str(b.platoId, 80), members = str(b.members, 600);
  let teamName = str(b.teamName, 80);
  if (!plato || (team && !members)) return json({ ok: false, error: 'required' }, 400);
  // no team name given: line the players up – captain | player | player
  if (team && !teamName) teamName = [plato, ...members.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)].join(' | ').slice(0, 80);
  if (!validId(plato) || (team && !validIds(members))) return json({ ok: false, error: 'bad_id' }, 400);
  const why = joinReason(r, await joinCount(env, params.id));
  if (why) return json({ ok: false, error: why }, 409);
  const chk = checkAnswers(await joinForm(env, params.id), b.answers); // the organiser's own questions
  if (!chk.ok) return json({ ok: false, error: 'required_q', q: chk.q }, 400);
  const mine = [key(plato), ...(team ? idsOf(members) : [])];
  if (new Set(mine).size !== mine.length) return json({ ok: false, error: 'duplicate_members' }, 400);
  const { results: taken } = await env.DB.prepare('SELECT mode, plato_id, team_name, members FROM bracket_signups WHERE bracket_id = ? LIMIT 5000').bind(params.id).all<{ mode: string; plato_id: string; team_name: string; members: string }>();
  const used = new Set<string>();
  for (const t of taken ?? []) { used.add(key(t.plato_id)); idsOf(t.members ?? '').forEach((m) => used.add(m)); }
  // ...and nobody who already registered through the site's own form (tournaments page) can register again here
  try {
    const { results: viaSite } = await env.DB.prepare('SELECT plato_id, members FROM registrations WHERE tournament_id IN (?, ?) LIMIT 5000').bind(params.id, `u-${params.id}`).all<{ plato_id: string; members: string }>();
    for (const t of viaSite ?? []) { used.add(key(t.plato_id)); idsOf(t.members ?? '').forEach((m) => used.add(m)); }
  } catch { /* table missing */ }
  if (team && (taken ?? []).some((t) => t.mode === 'team' && key(t.team_name) === key(teamName))) return json({ ok: false, error: 'duplicate_team' }, 409);
  if (mine.some((m) => used.has(m))) return json({ ok: false, error: 'duplicate' }, 409);
  const ins = await env.DB.prepare('INSERT INTO bracket_signups (bracket_id, mode, plato_id, team_name, members, created_at) VALUES (?,?,?,?,?,?)')
    .bind(params.id, team ? 'team' : 'solo', plato, team ? teamName : '', team ? members : '', new Date().toISOString()).run();
  const sid = Number((ins as { meta?: { last_row_id?: number } }).meta?.last_row_id);
  if (Number.isInteger(sid) && sid > 0) await saveAnswers(env, 'j', sid, params.id, chk.answers);
  // a tournament run by the site admins: its "registered" counter goes up like it does for the site form (no row = nothing happens)
  await env.DB.prepare('UPDATE tournaments SET filled = filled + 1 WHERE id = ?').bind(params.id).run().catch(() => undefined);
  return json({ ok: true });
};
