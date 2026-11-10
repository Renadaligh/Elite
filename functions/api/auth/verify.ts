import { signIn, sha256 } from '../../_auth';
import type { Ctx } from '../../_lib';

/** The link from the sign-in email: valid once, 15 minutes. */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const origin = new URL(request.url).origin;
  const bad = (why: string) => Response.redirect(`${origin}/#/bracket?login=${why}`, 302);
  const t = new URL(request.url).searchParams.get('t') ?? '';
  if (!/^[0-9a-f]{48}$/.test(t)) return bad('expired');
  try {
    const h = await sha256(t);
    const row = await env.DB.prepare('SELECT email, expires_at FROM login_links WHERE token_hash = ?').bind(h).first<{ email: string; expires_at: number }>();
    await env.DB.prepare('DELETE FROM login_links WHERE token_hash = ?').bind(h).run();
    if (!row || row.expires_at < Date.now()) return bad('expired');
    return await signIn(request, env, 'email', { id: row.email, name: row.email.split('@')[0], email: row.email, avatar: '' }, 'tool');
  } catch { return bad('failed'); }
};
