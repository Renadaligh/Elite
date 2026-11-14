import { currentUser, sameOrigin } from '../../_auth';
import { cleanBracket } from '../../_bracket';
import { body, denied, json, safeUrl, str, type Ctx } from '../../_lib';

type Row = { id: string; user_id: string; title: string; data: string; owner: string | null; updated_at: string; share: number; live: number; stream_url: string };
const COLS = 'b.id, b.user_id, b.title, b.data, b.updated_at';
async function load(env: Ctx['env'], id: string): Promise<Row | null> {
  const q = (cols: string) => env.DB.prepare(`SELECT ${COLS}, ${cols}u.name AS owner FROM user_brackets b LEFT JOIN users u ON u.id = b.user_id WHERE b.id = ?`).bind(id).first<Row>();
  try { return await q('b.share, b.live, b.stream_url, '); } catch { /* stream_url column not added yet */ }
  try { const r = await q('b.share, b.live, '); return r ? { ...r, stream_url: '' } : null; } catch { /* share/live not added yet: nothing is published */ }
  const r = await q(''); return r ? { ...r, share: 0, live: 0, stream_url: '' } : null;
}

/** The owner always sees it. Everyone else only after the owner published the link (`share`). The stream link is public only while "live" is on. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const r = await load(env, params.id);
  if (!r) return json({ error: 'not_found' }, 404);
  const u = await currentUser(request, env);
  const mine = !!u && u.id === r.user_id;
  let bracket = null; try { bracket = JSON.parse(r.data); } catch { /* corrupt row */ }
  const streamLive = !!r.live && !!r.stream_url;
  return json({ id: r.id, title: r.title, bracket, owner: mine ? r.owner ?? '' : '', mine, share: true, live: !!r.live, streamLive, streamUrl: mine || streamLive ? r.stream_url || '' : '', updatedAt: r.updated_at });
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

/** Owner switches: publish the view link (`share`), the stream link (`streamUrl`) and whether the stream is on right now (`live`). */
export const onRequestPatch = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const b = await body(request);
  const sets: string[] = [], vals: (number | string)[] = [];
  if (typeof b.share === 'boolean') { sets.push('share = ?'); vals.push(b.share ? 1 : 0); }
  if (typeof b.live === 'boolean') { sets.push('live = ?'); vals.push(b.live ? 1 : 0); }
  if (typeof b.streamUrl === 'string') { sets.push('stream_url = ?'); vals.push(b.streamUrl.trim() ? safeUrl(b.streamUrl).slice(0, 300) : ''); }
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
