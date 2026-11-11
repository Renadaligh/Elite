import { TEMP_MS, cleanPerms, guardOwner, hashPw, tempPassword } from '../../../_admin';
import { body, json, type Ctx } from '../../../_lib';

/** Owner only. PATCH { perms? , disabled? , action?: 'unlock' | 'reset' }. Accounts are never deleted: disable them instead. */
export const onRequestPatch = async ({ request, env, params }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const u = String(params.username || '').toLowerCase();
  const r = await env.DB.prepare('SELECT username, role FROM admins WHERE username=?').bind(u).first<{ username: string; role: string }>();
  if (!r) return json({ error: 'not_found' }, 404);
  if (r.role === 'owner') return json({ error: 'owner_protected' }, 400);
  const b = await body(request);
  let password: string | undefined;
  if ('perms' in b) {
    const p = cleanPerms(b.perms);
    if (!Object.keys(p).length) return json({ error: 'no_perms' }, 400);
    await env.DB.prepare('UPDATE admins SET perms=? WHERE username=?').bind(JSON.stringify(p), u).run();
  }
  if ('disabled' in b) {
    await env.DB.prepare('UPDATE admins SET disabled=? WHERE username=?').bind(b.disabled ? 1 : 0, u).run();
    if (b.disabled) await env.DB.prepare('DELETE FROM admin_sessions WHERE username=?').bind(u).run();
  }
  if (b.action === 'unlock') await env.DB.prepare('UPDATE admins SET locked=0, locked_until=0, failed=0 WHERE username=?').bind(u).run();
  if (b.action === 'reset') {
    password = tempPassword();
    const salt = crypto.randomUUID().replace(/-/g, '');
    await env.DB.prepare('UPDATE admins SET pass_hash=?, salt=?, must_change=1, temp_expires=?, locked=0, locked_until=0, failed=0 WHERE username=?')
      .bind(await hashPw(password, salt), salt, Date.now() + TEMP_MS, u).run();
    await env.DB.prepare('DELETE FROM admin_sessions WHERE username=?').bind(u).run();
  }
  return json({ ok: true, ...(password ? { password } : {}) });
};
