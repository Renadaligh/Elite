import { allProviders, COOKIE, cookie, currentUser, ensureHandle, sameOrigin, validHandle } from '../../_auth';
import { body, denied, json, str, type Ctx } from '../../_lib';
import { MAX_PER_USER } from '../../_bracket';

/** Who is signed in + which sign-in options are configured (so the site only shows working ones). */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const user = await currentUser(request, env);
  let count = 0;
  if (user && !user.handle) user.handle = await ensureHandle(env, user);
  if (user) { try { count = (await env.DB.prepare('SELECT COUNT(*) AS n FROM user_brackets WHERE user_id = ?').bind(user.id).first<{ n: number }>())?.n ?? 0; } catch { /* table missing */ } }
  return json({ user, providers: allProviders(env), count, max: MAX_PER_USER });
};

/** Change the display name and/or the username (a–z, 0–9, _ ; 3–20; unique). */
export const onRequestPut = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const b = await body(request);
  if (b.handle !== undefined) {
    const h = str(b.handle, 30).toLowerCase().replace(/^@/, '');
    if (!validHandle(h)) return json({ error: 'bad_handle' }, 400);
    try {
      const hit = await env.DB.prepare('SELECT id FROM users WHERE handle = ? AND id != ?').bind(h, u.id).first();
      if (hit) return json({ error: 'taken' }, 409);
      await env.DB.prepare('UPDATE users SET handle = ? WHERE id = ?').bind(h, u.id).run();
    } catch { return json({ error: 'migrate' }, 500); }
    if (b.name === undefined) return json({ ok: true });
  }
  const name = str(b.name, 40);
  if (name.length < 2) return json({ error: 'invalid' }, 400);
  await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, u.id).run();
  return json({ ok: true });
};

/** Delete the account with all its brackets and sessions. */
export const onRequestDelete = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  await env.DB.prepare('DELETE FROM user_brackets WHERE user_id = ?').bind(u.id).run();
  try { await env.DB.prepare('DELETE FROM bracket_editors WHERE user_id = ?').bind(u.id).run(); } catch { /* table not created yet */ }
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', 'set-cookie': cookie(request, COOKIE, '', 0) } });
};
