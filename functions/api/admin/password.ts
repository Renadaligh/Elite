import { sha256 } from '../../_auth';
import { eq, getAdmin, hashPw } from '../../_admin';
import { logAdmin } from '../../_audit';
import { body, denied, json, type Ctx } from '../../_lib';

/** POST /api/admin/password { current, next }. After a recovery login the current password is not required. */
export const onRequestPost = async ({ request, env }: Ctx) => {
  const a = await getAdmin(request, env);
  if (!a) return denied();
  const b = await body(request);
  const cur = typeof b.current === 'string' ? b.current.slice(0, 200) : '', next = typeof b.next === 'string' ? b.next.slice(0, 200) : '';
  if (next.length < 10) return json({ error: 'weak' }, 400);
  if (next.toLowerCase() === a.username || next === cur) return json({ error: 'same' }, 400);
  const r = await env.DB.prepare('SELECT pass_hash, salt FROM admins WHERE username=?').bind(a.username).first<{ pass_hash: string; salt: string }>();
  if (!r) return denied();
  if (!a.recovery && !eq(await hashPw(cur, r.salt), r.pass_hash)) return json({ error: 'wrong_current' }, 401);
  const salt = crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare('UPDATE admins SET pass_hash=?, salt=?, must_change=0, temp_expires=0 WHERE username=?').bind(await hashPw(next, salt), salt, a.username).run();
  const t = (request.headers.get('authorization') ?? '').slice(7);
  await env.DB.prepare('DELETE FROM admin_sessions WHERE username=? AND token_hash<>?').bind(a.username, await sha256(t)).run();
  await env.DB.prepare('UPDATE admin_sessions SET recovery=0 WHERE token_hash=?').bind(await sha256(t)).run();
  await logAdmin(env, a.username, 'password.change', a.recovery ? 'after recovery login' : '');
  return json({ ok: true });
};
