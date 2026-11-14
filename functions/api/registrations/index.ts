import { body, json, str, type Ctx } from '../../_lib';
import { guard } from '../../_admin';

/** Public: register for a tournament. Admin: list all registrations. */
export const onRequestPost = async ({ request, env }: Ctx) => {
  const b = await body(request);
  if (str(b.hp, 50)) return json({ ok: true }); // honeypot: pretend success to bots
  const tid = str(b.tournamentId, 80), plato = str(b.platoId, 80), team = b.mode === 'team';
  const teamName = str(b.teamName, 80), members = str(b.members, 600);
  if (!tid || !plato || (team && (!teamName || !members))) return json({ ok: false, error: 'required' }, 400);
  const t = await env.DB.prepare('SELECT name_en, filled, total, starts_at FROM tournaments WHERE id=? AND published=1').bind(tid).first<{ name_en: string; filled: number; total: number; starts_at: string }>();
  if (!t) return json({ ok: false, error: 'unknown' }, 404);
  if (tid.startsWith('u-') && Date.now() >= Date.parse(t.starts_at)) return json({ ok: false, error: 'closed' }, 409); // community tournaments close when they start
  if (t.total > 0 && t.filled >= t.total) return json({ ok: false, error: 'full' }, 409);
  if (team && await env.DB.prepare("SELECT 1 AS x FROM registrations WHERE tournament_id=? AND mode='team' AND lower(trim(team_name))=lower(trim(?))").bind(tid, teamName).first()) return json({ ok: false, error: 'duplicate_team' }, 409);
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
