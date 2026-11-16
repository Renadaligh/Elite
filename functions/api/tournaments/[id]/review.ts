import { body, json, str, type Ctx } from '../../../_lib';
import { guard } from '../../../_admin';
import { logAdmin } from '../../../_audit';
import { organizerEmail, sendMail } from '../../../_mail';

/** Team review of a community tournament: approved (shown on the site), rejected (with a reason the owner sees) or back to pending. */
export const onRequestPut = async ({ request, env, params, waitUntil }: Ctx) => {
  const a = await guard(request, env, 'tournaments', 'edit'); if (a instanceof Response) return a;
  const b = await body(request);
  const status = b.status === 'approved' || b.status === 'rejected' || b.status === 'pending' ? b.status : '';
  const note = status === 'rejected' ? str(b.note, 300) : '';
  if (!status || (status === 'rejected' && !note)) return json({ error: 'invalid' }, 400);
  try {
    const row = await env.DB.prepare("SELECT name_en, owner_id FROM tournaments WHERE id = ? AND bracket_id != ''").bind(params.id).first<{ name_en: string; owner_id: string }>();
    if (!row) return json({ error: 'not_found' }, 404);
    await env.DB.prepare('UPDATE tournaments SET review = ?, review_note = ? WHERE id = ?').bind(status, note, params.id).run();
    await logAdmin(env, a.username, `tournaments.review.${status}`, `${row.name_en} (${params.id})`, note ? { note } : undefined);
    if ((status === 'approved' || status === 'rejected') && row.owner_id) {
      const origin = new URL(request.url).origin;
      const job = organizerEmail(env, row.owner_id).then((to) => (to ? (status === 'approved'
        ? sendMail(env, [to], `تم قبول بطولتك: ${row.name_en}`, 'تم قبول بطولتك 🎉', `بطولتك «${row.name_en}» انقبلت وصارت ظاهرة في الموقع، والناس يقدرون يسجّلون فيها.\n\nYour tournament "${row.name_en}" was approved and is now live on the site.`, { href: `${origin}/#/tournaments/${encodeURIComponent(params.id)}`, label: 'فتح البطولة' })
        : sendMail(env, [to], `بطولتك تحتاج تعديل: ${row.name_en}`, 'ما انقبلت بطولتك للحين', `بطولتك «${row.name_en}» ما انقبلت.\nالسبب: ${note}\n\nعدّل الاسم أو الصورة واضغط «نشر / حفظ» لإعادتها للمراجعة.\n\nYour tournament "${row.name_en}" was not approved. Reason: ${note}. Edit it and save to send it for review again.`, { href: `${origin}/#/bracket`, label: 'تعديل البطولة' })) : undefined));
      if (waitUntil) waitUntil(job); else await job;
    }
  } catch { return json({ error: 'migrate' }, 500); }
  return json({ ok: true });
};
