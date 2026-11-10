import { currentUser, sameOrigin } from '../../_auth';
import { cleanBracket } from '../../_bracket';
import { body, denied, json, str, type Ctx } from '../../_lib';

type Row = { id: string; user_id: string; title: string; data: string; owner: string | null; updated_at: string; share: number; live: number };
async function load(env: Ctx['env'], id: string): Promise<Row | null> {
  try { return await env.DB.prepare('SELECT b.id, b.user_id, b.title, b.data, b.updated_at, b.share, b.live, u.name AS owner FROM user_brackets b LEFT JOIN users u ON u.id = b.user_id WHERE b.id = ?').bind(id).first<Row>(); }
  catch { // share/live columns not added yet: nothing is published
    const r = await env.DB.prepare('SELECT b.id, b.user_id, b.title, b.data, b.updated_at, u.name AS owner FROM user_brackets b LEFT JOIN users u ON u.id = b.user_id WHERE b.id = ?').bind(id).first<Row>();
    return r ? { ...r, share: 0, live: 0 } : null;
  }
}

/** The owner always sees it. Everyone else only if the owner published the link (`share`), or switched on the stream overlay (`?live=1`). */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const r = await load(env, params.id);
  if (!r) return json({ error: 'not_found' }, 404);
  const u = await currentUser(request, env);
  const mine = !!u && u.id === r.user_id;
  const asLive = new URL(request.url).searchParams.get('live') === '1';
  if (!mine && !(asLive ? r.live : r.share)) return json({ error: 'private' }, 403);
  let bracket = null; try { bracket = JSON.parse(r.data); } catch { /* corrupt row */ }
  return json({ id: r.id, title: r.title, bracket, owner: r.owner ?? '', mine, share: !!r.share, live: !!r.live, updatedAt: r.updated_at });
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

/** Owner switches: publish the view link (`share`) and / or the stream overlay link (`live`). */
export const onRequestPatch = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const b = await body(request);
  const sets: string[] = [], vals: (number | string)[] = [];
  if (typeof b.share === 'boolean') { sets.push('share = ?'); vals.push(b.share ? 1 : 0); }
  if (typeof b.live === 'boolean') { sets.push('live = ?'); vals.push(b.live ? 1 : 0); }
  if (!sets.length) return json({ error: 'invalid' }, 400);
  try { await env.DB.prepare(`UPDATE user_brackets SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).bind(...vals, params.id, u.id).run(); }
  catch { return json({ error: 'migrate' }, 500); } // run the ALTER TABLE statements from schema.sql
  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  await env.DB.prepare('DELETE FROM user_brackets WHERE id = ? AND user_id = ?').bind(params.id, u.id).run();
  return json({ ok: true });
};
