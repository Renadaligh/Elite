import { currentUser, sameOrigin } from '../../_auth';
import { cleanBracket } from '../../_bracket';
import { body, denied, json, str, type Ctx } from '../../_lib';

type Row = { id: string; user_id: string; title: string; data: string; owner: string | null; updated_at: string };
const load = (env: Ctx['env'], id: string) =>
  env.DB.prepare('SELECT b.id, b.user_id, b.title, b.data, b.updated_at, u.name AS owner FROM user_brackets b LEFT JOIN users u ON u.id = b.user_id WHERE b.id = ?').bind(id).first<Row>();

/** Anyone with the link can view (read-only). `mine` tells the page whether this visitor may edit. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const r = await load(env, params.id);
  if (!r) return json({ error: 'not_found' }, 404);
  const u = await currentUser(request, env);
  let bracket = null; try { bracket = JSON.parse(r.data); } catch { /* corrupt row */ }
  return json({ id: r.id, title: r.title, bracket, owner: r.owner ?? '', mine: !!u && u.id === r.user_id, updatedAt: r.updated_at });
};

export const onRequestPut = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const r = await load(env, params.id);
  if (!r || r.user_id !== u.id) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  const data = cleanBracket(b.bracket);
  if (!data) return json({ error: 'invalid' }, 400);
  await env.DB.prepare('UPDATE user_brackets SET title = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(str(b.title, 60) || r.title, JSON.stringify(data), new Date().toISOString(), r.id, u.id).run();
  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  await env.DB.prepare('DELETE FROM user_brackets WHERE id = ? AND user_id = ?').bind(params.id, u.id).run();
  return json({ ok: true });
};
