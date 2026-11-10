import { cookie, cookies, COOKIE, DAYS, configured, hex, isProvider, PROVIDERS, redirectUri, sha256 } from '../../../_auth';
import type { Ctx } from '../../../_lib';

type Profile = { id: string; name: string; email: string; avatar: string };

async function profileOf(p: 'discord' | 'google', token: string): Promise<Profile | null> {
  const h = { authorization: `Bearer ${token}` };
  if (p === 'discord') {
    const r = await fetch('https://discord.com/api/users/@me', { headers: h }); if (!r.ok) return null;
    const u = (await r.json()) as { id: string; username: string; global_name?: string; avatar?: string; email?: string };
    return { id: u.id, name: u.global_name || u.username, email: u.email ?? '', avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : '' };
  }
  const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: h }); if (!r.ok) return null;
  const u = (await r.json()) as { sub: string; name?: string; email?: string; picture?: string };
  return { id: u.sub, name: u.name || (u.email ?? '').split('@')[0] || 'Player', email: u.email ?? '', avatar: u.picture ?? '' };
}

/** Step 2: Discord / Google sends the visitor back with a code → we create the account (first time) and a session cookie. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const url = new URL(request.url), origin = url.origin;
  const fail = (why: string) => new Response(null, { status: 302, headers: { location: `${origin}/#/bracket?login=${why}`, 'set-cookie': cookie(request, 'oauth_state', '', 0, '/api/auth') } });
  const p = params.provider;
  if (!isProvider(p) || !configured(env, p)) return fail('unavailable');
  const [state, r] = (cookies(request).oauth_state ?? '').split('.');
  const code = url.searchParams.get('code');
  if (!state || state !== url.searchParams.get('state') || !code) return fail('failed');
  try {
    const cfg = PROVIDERS[p];
    const tok = await fetch(cfg.token, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.id(env)!, client_secret: cfg.secret(env)!, grant_type: 'authorization_code', code, redirect_uri: redirectUri(request, p) }),
    });
    if (!tok.ok) return fail('failed');
    const access = ((await tok.json()) as { access_token?: string }).access_token;
    const prof = access ? await profileOf(p, access) : null;
    if (!prof?.id) return fail('failed');

    const found = await env.DB.prepare('SELECT id FROM users WHERE provider = ? AND provider_id = ?').bind(p, prof.id).first<{ id: string }>();
    const uid = found?.id ?? hex(8);
    if (found) await env.DB.prepare('UPDATE users SET name = ?, email = ?, avatar = ? WHERE id = ?').bind(prof.name.slice(0, 60), prof.email.slice(0, 120), prof.avatar.slice(0, 300), uid).run();
    else await env.DB.prepare('INSERT INTO users (id, provider, provider_id, name, email, avatar, created_at) VALUES (?,?,?,?,?,?,?)').bind(uid, p, prof.id, prof.name.slice(0, 60), prof.email.slice(0, 120), prof.avatar.slice(0, 300), new Date().toISOString()).run();

    const token = hex(24);
    await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').bind(await sha256(token), uid, Date.now() + DAYS * 86400000).run();
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run();
    const h = new Headers({ location: `${origin}/#/bracket${r === 'mine' ? '/mine' : ''}`, 'cache-control': 'no-store' });
    h.append('set-cookie', cookie(request, COOKIE, token, DAYS * 86400));
    h.append('set-cookie', cookie(request, 'oauth_state', '', 0, '/api/auth'));
    return new Response(null, { status: 302, headers: h });
  } catch { return fail('failed'); }
};
