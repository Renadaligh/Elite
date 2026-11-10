import { cookie, cookies, configured, isProvider, PROVIDERS, redirectUri, signIn, steamOn, type Profile } from '../../../_auth';
import type { Ctx, Env } from '../../../_lib';

async function profileOf(p: 'discord' | 'google' | 'twitch', token: string, env: Env): Promise<Profile | null> {
  const h = { authorization: `Bearer ${token}` };
  if (p === 'discord') {
    const r = await fetch('https://discord.com/api/users/@me', { headers: h }); if (!r.ok) return null;
    const u = (await r.json()) as { id: string; username: string; global_name?: string; avatar?: string; email?: string };
    return { id: u.id, name: u.global_name || u.username, email: u.email ?? '', avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : '' };
  }
  if (p === 'twitch') {
    const r = await fetch('https://api.twitch.tv/helix/users', { headers: { ...h, 'client-id': env.TWITCH_CLIENT_ID ?? '' } }); if (!r.ok) return null;
    const u = ((await r.json()) as { data?: { id: string; display_name?: string; login?: string; email?: string; profile_image_url?: string }[] }).data?.[0];
    return u ? { id: u.id, name: u.display_name || u.login || 'Player', email: u.email ?? '', avatar: u.profile_image_url ?? '' } : null;
  }
  const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: h }); if (!r.ok) return null;
  const u = (await r.json()) as { sub: string; name?: string; email?: string; picture?: string };
  return { id: u.sub, name: u.name || (u.email ?? '').split('@')[0] || 'Player', email: u.email ?? '', avatar: u.picture ?? '' };
}

/** Steam OpenID 2.0: ask Steam to confirm its own signed answer, then read the public profile with our API key. */
async function steamProfile(request: Request, env: Env): Promise<Profile | null> {
  const q = new URL(request.url).searchParams;
  if (q.get('openid.mode') !== 'id_res') return null;
  const expected = `${redirectUri(request, 'steam')}?state=${q.get('state') ?? ''}`;
  if (q.get('openid.return_to') !== expected) return null;
  const sid = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/.exec(q.get('openid.claimed_id') ?? '')?.[1];
  if (!sid) return null;
  const check = new URLSearchParams();
  q.forEach((v, k) => { if (k.startsWith('openid.')) check.set(k, v); });
  check.set('openid.mode', 'check_authentication');
  const ok = await fetch('https://steamcommunity.com/openid/login', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: check });
  if (!ok.ok || !/is_valid\s*:\s*true/.test(await ok.text())) return null;
  let name = `Steam ${sid.slice(-4)}`, avatar = '';
  try {
    const r = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(env.STEAM_API_KEY ?? '')}&steamids=${sid}`);
    const u = ((await r.json()) as { response?: { players?: { personaname?: string; avatarfull?: string }[] } }).response?.players?.[0];
    if (u?.personaname) name = u.personaname; if (u?.avatarfull) avatar = u.avatarfull;
  } catch { /* keep defaults */ }
  return { id: sid, name, email: '', avatar };
}

/** Step 2: the provider sends the visitor back → we create the account (first time) and a session cookie. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const url = new URL(request.url), origin = url.origin;
  const fail = (why: string) => new Response(null, { status: 302, headers: { location: `${origin}/#/bracket?login=${why}`, 'set-cookie': cookie(request, 'oauth_state', '', 0, '/api/auth') } });
  const p = params.provider;
  const [state, r] = (cookies(request).oauth_state ?? '').split('.');
  if (!state || state !== url.searchParams.get('state')) return fail('failed');
  try {
    if (p === 'steam') {
      if (!steamOn(env)) return fail('unavailable');
      const prof = await steamProfile(request, env);
      return prof ? await signIn(request, env, 'steam', prof, r) : fail('failed');
    }
    if (!isProvider(p) || !configured(env, p)) return fail('unavailable');
    const code = url.searchParams.get('code');
    if (!code) return fail('failed');
    const cfg = PROVIDERS[p];
    const tok = await fetch(cfg.token, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.id(env)!, client_secret: cfg.secret(env)!, grant_type: 'authorization_code', code, redirect_uri: redirectUri(request, p) }),
    });
    if (!tok.ok) return fail('failed');
    const access = ((await tok.json()) as { access_token?: string }).access_token;
    const prof = access ? await profileOf(p, access, env) : null;
    if (!prof?.id) return fail('failed');
    return await signIn(request, env, p, prof, r);
  } catch { return fail('failed'); }
};
