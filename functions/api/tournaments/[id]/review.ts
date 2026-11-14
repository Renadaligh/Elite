import { body, json, str, type Ctx } from '../../../_lib';
import { guard } from '../../../_admin';
import { logAdmin } from '../../../_audit';

/** Team review of a community tournament: approved (shown on the site), rejected (with a reason the owner sees) or back to pending. */
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'tournaments', 'edit'); if (a instanceof Response) return a;
  const b = await body(request);
  const status = b.status === 'approved' || b.status === 'rejected' || b.status === 'pending' ? b.status : '';
  const note = status === 'rejected' ? str(b.note, 300) : '';
  if (!status || (status === 'rejected' && !note)) return json({ error: 'invalid' }, 400);
  try {
    const row = await env.DB.prepare("SELECT name_en FROM tournaments WHERE id = ? AND bracket_id != ''").bind(params.id).first<{ name_en: string }>();
    if (!row) return json({ error: 'not_found' }, 404);
    await env.DB.prepare('UPDATE tournaments SET review = ?, review_note = ? WHERE id = ?').bind(status, note, params.id).run();
    await logAdmin(env, a.username, `tournaments.review.${status}`, `${row.name_en} (${params.id})`, note ? { note } : undefined);
  } catch { return json({ error: 'migrate' }, 500); }
  return json({ ok: true });
};
