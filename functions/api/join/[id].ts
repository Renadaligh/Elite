import { body, json, str, type Ctx } from '../../_lib';
import { joinCount, joinExtra, joinReason, joinRow } from '../../_join';

const key = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const idsOf = (s: string) => s.split(/[\n,،;]+/).map(key).filter(Boolean);

/** Public registration page data: only the title, group name and how full it is. Never names, never the bracket. */
export const onRequestGet = async ({ env, params }: Ctx) => {
  const r = await joinRow(env, params.id);
  if (!r || !r.enabled) return json({ error: 'not_found' }, 404);
  const row = await env.DB.prepare('SELECT title, data FROM user_brackets WHERE id = ?').bind(params.id).first<{ title: string; data: string }>().catch(() => null);
  if (!row) return json({ error: 'not_found' }, 404);
  let org = ''; try { const d = JSON.parse(row.data) as { org?: unknown }; if (typeof d.org === 'string') org = d.org.slice(0, 60); } catch { /* corrupt row */ }
  const count = await joinCount(env, params.id);
  const ex = await joinExtra(env, params.id);
  let startsAt = ex.startsAt;
  if (!startsAt) startsAt = (await env.DB.prepare('SELECT starts_at FROM tournaments WHERE id = ?').bind(`u-${params.id}`).first<{ starts_at: string }>().catch(() => null))?.starts_at ?? '';
  return json({ title: row.title, org, cover: ex.cover, startsAt, mode: r.mode === 'team' ? 'team' : 'solo', count, cap: r.cap, closesAt: r.closes_at, reason: joinReason(r, count) });
};

export const onRequestPost = async ({ request, env, params }: Ctx) => {
  const b = await body(request);
  if (str(b.hp, 50)) return json({ ok: true }); // honeypot
  const r = await joinRow(env, params.id);
  if (!r || !r.enabled) return json({ ok: false, error: 'unknown' }, 404);
  const team = r.mode === 'team';
  const plato = str(b.platoId, 80), teamName = str(b.teamName, 80), members = str(b.members, 600);
  if (!plato || (team && (!teamName || !members))) return json({ ok: false, error: 'required' }, 400);
  const why = joinReason(r, await joinCount(env, params.id));
  if (why) return json({ ok: false, error: why }, 409);
  const mine = [key(plato), ...(team ? idsOf(members) : [])];
  if (new Set(mine).size !== mine.length) return json({ ok: false, error: 'duplicate_members' }, 400);
  const { results: taken } = await env.DB.prepare('SELECT mode, plato_id, team_name, members FROM bracket_signups WHERE bracket_id = ? LIMIT 5000').bind(params.id).all<{ mode: string; plato_id: string; team_name: string; members: string }>();
  const used = new Set<string>();
  for (const t of taken ?? []) { used.add(key(t.plato_id)); idsOf(t.members ?? '').forEach((m) => used.add(m)); }
  if (team && (taken ?? []).some((t) => t.mode === 'team' && key(t.team_name) === key(teamName))) return json({ ok: false, error: 'duplicate_team' }, 409);
  if (mine.some((m) => used.has(m))) return json({ ok: false, error: 'duplicate' }, 409);
  await env.DB.prepare('INSERT INTO bracket_signups (bracket_id, mode, plato_id, team_name, members, created_at) VALUES (?,?,?,?,?,?)')
    .bind(params.id, team ? 'team' : 'solo', plato, team ? teamName : '', team ? members : '', new Date().toISOString()).run();
  return json({ ok: true });
};
