import { validId, validIds, body, json, str, type Ctx } from '../../_lib';
import { guard } from '../../_admin';
import { checkAnswers, joinForm, namesMap, qaPairs, saveAnswers, withNames, type RegForm } from '../../_join';
import { dataId } from '../../_tid';

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
  const fkey = await dataId(env, tid); // the organiser's own questions (same ones as on the registration link)
  const chk = checkAnswers(await joinForm(env, fkey), b.answers);
  if (!chk.ok) return json({ ok: false, error: 'required_q', q: chk.q }, 400);
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
    const ins = await env.DB.prepare('INSERT INTO registrations (tournament_id,tournament_name,mode,plato_id,team_name,members,lang) VALUES (?,?,?,?,?,?,?)')
      .bind(tid, t.name_en, team ? 'team' : 'solo', plato, teamName, members, b.lang === 'en' ? 'en' : 'ar').run();
    const rid = Number((ins as { meta?: { last_row_id?: number } }).meta?.last_row_id);
    if (Number.isInteger(rid) && rid > 0) await saveAnswers(env, 'r', rid, fkey, chk.answers);
  } catch {
    return json({ ok: false, error: 'duplicate' }, 409);
  }
  await env.DB.prepare('UPDATE tournaments SET filled = CASE WHEN total > 0 THEN MIN(total, filled + 1) ELSE filled + 1 END WHERE id=?').bind(tid).run();
  return json({ ok: true });
};

/** The site-form registrations with the answers to the organiser's questions: every site tournament's, or just one (`only`). Not checked here: the caller guards it. */
export async function regRows(env: Ctx['env'], only?: string) {
  const { results } = await (only ? env.DB.prepare('SELECT * FROM registrations WHERE tournament_id = ? ORDER BY id DESC').bind(only) : env.DB.prepare("SELECT * FROM registrations WHERE tournament_id NOT LIKE 'u-%' ORDER BY id DESC")).all<{ id: number; tournament_id: string }>();
  // answers to the organiser's own questions, written out with the question titles
  const byId: Record<number, Record<string, string | string[]>> = {};
  try {
    const { results: a } = await env.DB.prepare("SELECT signup_id, answers FROM bracket_answers WHERE src = 'r' LIMIT 20000").all<{ signup_id: number; answers: string }>();
    for (const r of a ?? []) { try { byId[r.signup_id] = JSON.parse(r.answers); } catch { /* skip */ } }
  } catch { /* no table yet */ }
  const nm = await namesMap(env, only ?? null, 'r');
  if (!Object.keys(byId).length) return withNames(results ?? [], nm);
  const forms = new Map<string, RegForm>();
  const out = [];
  for (const r of results ?? []) {
    if (!byId[r.id]) { out.push(nm[r.id] ? { ...r, rname: nm[r.id] } : r); continue; }
    if (!forms.has(r.tournament_id)) forms.set(r.tournament_id, await joinForm(env, await dataId(env, r.tournament_id)));
    out.push({ ...r, ...(nm[r.id] ? { rname: nm[r.id] } : {}), qa: qaPairs(forms.get(r.tournament_id) as RegForm, byId[r.id]) });
  }
  return out;
}

export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await guard(request, env, 'regs', 'view'); if (a instanceof Response) return a;
  return json(await regRows(env));
};
