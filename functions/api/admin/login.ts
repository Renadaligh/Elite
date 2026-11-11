import { MAX_FAILS, eq, hashPw, newSession, ownerName, readPerms, FULL } from '../../_admin';
import { body, json, str, type Ctx } from '../../_lib';

type Row = { username: string; pass_hash: string; salt: string; role: string; perms: string; must_change: number; temp_expires: number; disabled: number; locked: number; locked_until: number; failed: number };
const DUMMY_SALT = 'x'.repeat(32);

/** POST /api/admin/login { username, password } → { token, username, role, perms, mustChange }.
 *  Owner recovery: the owner's username + the ADMIN_PASSWORD secret always works (unlocks the owner, forces a new password). */
export const onRequestPost = async ({ request, env }: Ctx) => {
  const b = await body(request);
  const username = str(b.username, 40).toLowerCase(), password = typeof b.password === 'string' ? b.password.slice(0, 200) : '';
  if (!username || !password) return json({ error: 'invalid' }, 401);
  const now = Date.now();
  const owner = ownerName(env);
  const done = async (r: { username: string; role: string; perms: string; must_change: number }, recovery: boolean) => {
    await env.DB.prepare('UPDATE admins SET failed=0, last_login=? WHERE username=?').bind(now, r.username).run();
    const token = await newSession(env, r.username, recovery);
    const isOwner = r.role === 'owner';
    return json({ token, username: r.username, role: isOwner ? 'owner' : 'admin', perms: isOwner ? FULL : readPerms(r.perms), mustChange: !!r.must_change, recovery });
  };

  // Owner recovery key (Cloudflare secret) — works even if the owner forgot the password or is locked.
  if (username === owner && env.ADMIN_PASSWORD && eq(password, env.ADMIN_PASSWORD)) {
    const salt = crypto.randomUUID().replace(/-/g, '');
    const ex = await env.DB.prepare('SELECT username FROM admins WHERE username=?').bind(owner).first();
    if (ex) await env.DB.prepare('UPDATE admins SET locked=0, locked_until=0, failed=0, disabled=0, must_change=1, temp_expires=0, role=? WHERE username=?').bind('owner', owner).run();
    else await env.DB.prepare("INSERT INTO admins (username, pass_hash, salt, role, perms, must_change, created_by, created_at) VALUES (?,?,?,'owner','{}',1,'system',?)")
      .bind(owner, await hashPw(password, salt), salt, now).run();
    return done({ username: owner, role: 'owner', perms: '{}', must_change: 1 }, true);
  }

  const r = await env.DB.prepare('SELECT * FROM admins WHERE username=?').bind(username).first<Row>();
  if (!r) { await hashPw(password, DUMMY_SALT); return json({ error: 'invalid' }, 401); }
  const isOwner = r.role === 'owner';
  if (r.locked || (isOwner && r.locked_until > now)) return json({ error: 'locked' }, 423);
  const ok = eq(await hashPw(password, r.salt), r.pass_hash);
  if (!ok) {
    const f = r.failed + 1;
    if (f >= MAX_FAILS) {
      // An admin stays locked until the owner unlocks it; the owner is only paused 15 minutes (the recovery key still works).
      if (isOwner) await env.DB.prepare('UPDATE admins SET failed=0, locked_until=? WHERE username=?').bind(now + 15 * 60000, r.username).run();
      else await env.DB.prepare('UPDATE admins SET failed=0, locked=1 WHERE username=?').bind(r.username).run();
      return json({ error: 'locked' }, 423);
    }
    await env.DB.prepare('UPDATE admins SET failed=? WHERE username=?').bind(f, r.username).run();
    return json({ error: 'invalid', left: MAX_FAILS - f }, 401);
  }
  if (r.disabled) return json({ error: 'disabled' }, 403);
  if (r.must_change && r.temp_expires > 0 && r.temp_expires < now) return json({ error: 'expired' }, 403);
  return done(r, false);
};
