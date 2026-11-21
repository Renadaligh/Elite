import { validId, validIds, body, json, str, type Ctx } from '../../_lib';
import { guard } from '../../_admin';

const key = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const idsOf = (s: string) => s.split(/[\n,،;]+/).map(key).filter(Boolean);

/** Public: register for a tournament. Admin: list all registrations. */
export const onRequestPost = async ({ request, env }: Ctx) => {
  const b = await body(request);
  if (str(b.hp, 50)) return json({ ok: true }); // honeypot: pretend success to bots
  const tid = str(b.tournamentId, 80), plato = str(b.platoId, 80), team = b.mode === 'team';
  let teamName = str(b.teamName, 80); const members = str(b.members, 600);
  if (!tid || !plato || (team && !members)) return json({ ok: false, error: 'required' }, 400);
  if (team && !teamName) teamName = [plato, ...members.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)].join(' | ').slice(0, 80);
  if (!validId(plato) || (team && !validIds(members))) return json({ ok: false, error: 'bad_id' }, 400);
  const t = await env.DB.prepare('SELECT name_en, filled, total, starts_at FROM tournaments WHERE id=? AND published=1').bind(tid).first<{ name_en: string; filled: number; total: number; starts_at: string }>();
  if (!t) return json({ ok: false, error: 'unknown' }, 404);
  if (tid.startsWith('u-') && Date.now() >= Date.parse(t.starts_at)) return json({ ok: false, error: 'closed' }, 409); // community tournaments close when they start
  if (t.total > 0 && t.filled >= t.total) return json({ ok: false, error: 'full' }, 409);
  // Nobody may appear twice: not twice in this form, and not as someone already registered (as a solo player, a captain or a team member).
  const mine = [key(plato), ...(team ? idsOf(members) : [])];
  if (new Set(mine).size !== mine.length) return json({ ok: false, error: 'duplicate_members' }, 400);
  const { results: taken } = await env.DB.prepare('SELECT mode, plato_id, team_name, members FROM registrations WHERE tournament_id=? LIMIT 5000').bind(tid).all<{ mode: string; plato_id: string; team_name: string; members: string }>();
  const used = new Set<string>();
  for (const r of taken ?? []) { used.add(key(r.plato_id)); idsOf(r.members ?? '').forEach((m) => used.add(m)); }
  // the same people may not come in again through the tournament's registration link (/j/<id>) as well
  try {
    const { results: viaLink } = await env.DB.prepare('SELECT plato_id, members FROM bracket_signups WHERE bracket_id = ? LIMIT 5000').bind(tid.startsWith('u-') ? tid.slice(2) : tid).all<{ plato_id: string; members: string }>();
    for (const r of viaLink ?? []) { used.add(key(r.plato_id)); idsOf(r.members ?? '').forEach((m) => used.add(m)); }
  } catch { /* table not created yet */ }
  if (team && (taken ?? []).some((r) => r.mode === 'team' && key(r.team_name) === key(teamName))) return json({ ok: false, error: 'duplicate_team' }, 409);
  if (mine.some((m) => used.has(m))) return json({ ok: false, error: 'duplicate' }, 409);
  try {
    await env.DB.prepare('INSERT INTO registrations (tournament_id,tournament_name,mode,plato_id,team_name,members,lang) VALUES (?,?,?,?,?,?,?)')
      .bind(tid, t.name_en, team ? 'team' : 'solo', plato, teamName, members, b.lang === 'en' ? 'en' : 'ar').run();
  } catch {
    return json({ ok: false, error: 'duplicate' }, 409);
  }
  await env.DB.prepare('UPDATE tournaments SET filled = CASE WHEN total > 0 THEN MIN(total, filled + 1) ELSE filled + 1 END WHERE id=?').bind(tid).run();
  return json({ ok: true });
};

export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await guard(request, env, 'regs', 'view'); if (a instanceof Response) return a;
  const { results } = await env.DB.prepare("SELECT * FROM registrations WHERE tournament_id NOT LIKE 'u-%' ORDER BY id DESC").all();
  return json(results);
};
