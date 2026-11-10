import { cookie, configured, hex, isProvider, PROVIDERS, redirectUri } from '../../../_auth';
import type { Ctx } from '../../../_lib';

/** Step 1: send the visitor to Discord / Google. ?r=mine returns to "my brackets" afterwards. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const origin = new URL(request.url).origin;
  const p = params.provider;
  if (!isProvider(p) || !configured(env, p)) return Response.redirect(`${origin}/#/bracket?login=unavailable`, 302);
  const r = new URL(request.url).searchParams.get('r') === 'mine' ? 'mine' : 'tool';
  const state = hex(16);
  const cfg = PROVIDERS[p];
  const q = new URLSearchParams({ client_id: cfg.id(env)!, redirect_uri: redirectUri(request, p), response_type: 'code', scope: cfg.scope, state, ...(p === 'discord' ? { prompt: 'none' } : {}) });
  return new Response(null, { status: 302, headers: { location: `${cfg.auth}?${q}`, 'set-cookie': cookie(request, 'oauth_state', `${state}.${r}`, 600, '/api/auth'), 'cache-control': 'no-store' } });
};
