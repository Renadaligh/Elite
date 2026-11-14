import { json, type Ctx } from '../../_lib';
import { logAdmin } from '../../_audit';
import { guard } from '../../_admin';

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'regs', 'delete'); if (a instanceof Response) return a;
  const old = await env.DB.prepare('SELECT tournament_id, plato_id, team_name FROM registrations WHERE id=?').bind(params.id).first<Record<string, unknown>>().catch(() => null);
  const del = await env.DB.prepare('DELETE FROM registrations WHERE id=?').bind(params.id).run() as { meta?: { changes?: number } };
  if (old?.tournament_id && (del?.meta?.changes ?? 1) > 0) await env.DB.prepare('UPDATE tournaments SET filled = MAX(0, filled - 1) WHERE id=?').bind(old.tournament_id).run().catch(() => undefined); // free the seat
  await logAdmin(env, a.username, 'regs.delete', `${old?.plato_id ?? params.id}`, { tournament: old?.tournament_id, team: old?.team_name });
  return json({ ok: true });
};
