import { allProviders, COOKIE, cookie, currentUser, sameOrigin } from '../../_auth';
import { body, denied, json, str, type Ctx } from '../../_lib';
import { MAX_PER_USER } from '../../_bracket';

/** Who is signed in + which sign-in options are configured (so the site only shows working ones). */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const user = await currentUser(request, env);
  let count = 0;
  if (user) { try { count = (await env.DB.prepare('SELECT COUNT(*) AS n FROM user_brackets WHERE user_id = ?').bind(user.id).first<{ n: number }>())?.n ?? 0; } catch { /* table missing */ } }
  return json({ user, providers: allProviders(env), count, max: MAX_PER_USER });
};

/** Change the display name. */
export const onRequestPut = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const name = str((await body(request)).name, 40);
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
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', 'set-cookie': cookie(request, COOKIE, '', 0) } });
};
