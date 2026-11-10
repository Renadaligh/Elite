import { configured, currentUser } from '../../_auth';
import { json, type Ctx } from '../../_lib';

/** Who is signed in + which sign-in buttons are configured (so the site only shows working ones). */
export const onRequestGet = async ({ request, env }: Ctx) =>
  json({ user: await currentUser(request, env), providers: { discord: configured(env, 'discord'), google: configured(env, 'google') } });
