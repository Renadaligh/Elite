import { PRESETS, TEMP_MS, cleanPerms, guardOwner, hashPw, ownerName, readPerms, tempPassword, validUser } from '../../../_admin';
import { body, json, str, type Ctx } from '../../../_lib';

type Row = { username: string; role: string; perms: string; must_change: number; temp_expires: number; disabled: number; locked: number; locked_until: number; last_login: number; created_at: number; created_by: string };

/** Owner only. GET: list the admin accounts. POST { username, preset | perms }: creates an account with a one-time temporary password. */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const { results } = await env.DB.prepare('SELECT username, role, perms, must_change, temp_expires, disabled, locked, locked_until, last_login, created_at, created_by FROM admins ORDER BY role DESC, created_at ASC').all<Row>();
  const now = Date.now();
  return json(results.map((r) => ({ username: r.username, role: r.role, perms: readPerms(r.perms), mustChange: !!r.must_change, tempExpires: r.temp_expires, disabled: !!r.disabled, locked: !!r.locked || r.locked_until > now, lastLogin: r.last_login, createdAt: r.created_at, createdBy: r.created_by })));
};

export const onRequestPost = async ({ request, env }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const b = await body(request);
  const username = str(b.username, 40).toLowerCase();
  if (!validUser(username) || username === ownerName(env)) return json({ error: 'invalid_username' }, 400);
  const perms = typeof b.preset === 'string' && PRESETS[b.preset] ? PRESETS[b.preset] : cleanPerms(b.perms);
  if (!Object.keys(perms).length) return json({ error: 'no_perms' }, 400);
  if (await env.DB.prepare('SELECT 1 AS x FROM admins WHERE username=?').bind(username).first()) return json({ error: 'exists' }, 409);
  const password = tempPassword(), salt = crypto.randomUUID().replace(/-/g, ''), now = Date.now();
  await env.DB.prepare("INSERT INTO admins (username, pass_hash, salt, role, perms, must_change, temp_expires, created_by, created_at) VALUES (?,?,?,'admin',?,1,?,?,?)")
    .bind(username, await hashPw(password, salt), salt, JSON.stringify(perms), now + TEMP_MS, a.username, now).run();
  return json({ ok: true, username, password, expiresAt: now + TEMP_MS });
};
