import { cookie, configured, hex, isProvider, PROVIDERS, redirectUri, steamOn } from '../../../_auth';
import type { Ctx } from '../../../_lib';

/** Step 1: send the visitor to Discord / Google / Twitch (OAuth) or Steam (OpenID), remembering a one-time `state` so the callback can be trusted. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const origin = new URL(request.url).origin;
  const p = params.provider;
  const off = Response.redirect(`${origin}/#/bracket?login=unavailable`, 302);
  const r = new URL(request.url).searchParams.get('r') === 'mine' ? 'mine' : 'tool';
  const state = hex(16);
  const go = (to: string) => new Response(null, { status: 302, headers: { location: to, 'set-cookie': cookie(request, 'oauth_state', `${state}.${r}`, 600, '/api/auth'), 'cache-control': 'no-store' } });
  if (p === 'steam') {
    if (!steamOn(env)) return off;
    const id = 'http://specs.openid.net/auth/2.0/identifier_select';
    const q = new URLSearchParams({ 'openid.ns': 'http://specs.openid.net/auth/2.0', 'openid.mode': 'checkid_setup', 'openid.return_to': `${redirectUri(request, 'steam')}?state=${state}`, 'openid.realm': origin, 'openid.identity': id, 'openid.claimed_id': id });
    return go(`https://steamcommunity.com/openid/login?${q}`);
  }
  if (!isProvider(p) || !configured(env, p)) return off;
  const cfg = PROVIDERS[p];
  const q = new URLSearchParams({ client_id: cfg.id(env)!, redirect_uri: redirectUri(request, p), response_type: 'code', scope: cfg.scope, state, ...(p === 'discord' ? { prompt: 'none' } : {}) });
  return go(`${cfg.auth}?${q}`);
};
