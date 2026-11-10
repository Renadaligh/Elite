import { cookie, cookies, COOKIE, sameOrigin, sha256 } from '../../_auth';
import { json, type Ctx } from '../../_lib';

export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const t = cookies(request)[COOKIE];
  if (t) { try { await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(t)).run(); } catch { /* ignore */ } }
  return new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'set-cookie': cookie(request, COOKIE, '', 0) } });
};
