import { getAdmin } from '../../_admin';
import { MAIL } from '../../_mail';
import { body, denied, json, str, type Ctx } from '../../_lib';

const mailOf = async (env: Ctx['env'], username: string) => {
  try { return (await env.DB.prepare('SELECT email FROM admins WHERE username = ?').bind(username).first<{ email: string }>())?.email ?? ''; } catch { return ''; }
};

export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await getAdmin(request, env);
  if (!a) return denied();
  return json({ username: a.username, role: a.role, perms: a.perms, mustChange: a.mustChange, recovery: a.recovery, email: await mailOf(env, a.username) });
};

/** The signed-in admin saves (or clears) their own email for review notifications. */
export const onRequestPut = async ({ request, env }: Ctx) => {
  const a = await getAdmin(request, env);
  if (!a) return denied();
  if (a.mustChange) return json({ error: 'must_change' }, 403);
  const email = str((await body(request)).email, 120).toLowerCase();
  if (email && !MAIL.test(email)) return json({ error: 'invalid' }, 400);
  try { await env.DB.prepare('UPDATE admins SET email = ? WHERE username = ?').bind(email, a.username).run(); } catch { return json({ error: 'migrate' }, 500); }
  return json({ ok: true, email });
};
