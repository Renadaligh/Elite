import { sha256 } from '../../_auth';
import { json, type Ctx } from '../../_lib';

export const onRequestPost = async ({ request, env }: Ctx) => {
  const h = request.headers.get('authorization') ?? '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (t) { try { await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await sha256(t)).run(); } catch { /* ignore */ } }
  return json({ ok: true });
};
