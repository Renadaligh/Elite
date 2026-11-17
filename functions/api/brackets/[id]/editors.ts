import { currentUser, sameOrigin, validHandle } from '../../../_auth';
import { body, denied, json, str, type Ctx } from '../../../_lib';

const MAX_EDITORS = 10;
type Person = { id: string; name: string; handle: string; avatar: string };
async function owner(env: Ctx['env'], id: string) { return env.DB.prepare('SELECT user_id FROM user_brackets WHERE id = ?').bind(id).first<{ user_id: string }>(); }

/** Co-editors of this bracket: visible to the owner and to the co-editors themselves. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const u = await currentUser(request, env);
  if (!u) return denied();
  const o = await owner(env, params.id);
  if (!o) return json({ error: 'not_found' }, 404);
  try {
    const { results } = await env.DB.prepare('SELECT u.id, u.name, u.handle, u.avatar FROM bracket_editors e JOIN users u ON u.id = e.user_id WHERE e.bracket_id = ? ORDER BY e.added_at').bind(params.id).all<Person>();
    if (o.user_id !== u.id && !results.some((p) => p.id === u.id)) return json({ error: 'not_found' }, 404);
    return json({ isOwner: o.user_id === u.id, max: MAX_EDITORS, editors: results });
  } catch { return json({ error: 'migrate' }, 500); } // run the CREATE TABLE / ALTER TABLE statements from schema.sql
};

/** Owner only: add a registered member by username. */
export const onRequestPost = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const o = await owner(env, params.id);
  if (!o || o.user_id !== u.id) return json({ error: 'not_found' }, 404);
  const h = str((await body(request)).handle, 30).toLowerCase().replace(/^@/, '');
  if (!validHandle(h)) return json({ error: 'bad_handle' }, 400);
  try {
    const t = await env.DB.prepare('SELECT id, name, handle, avatar FROM users WHERE handle = ?').bind(h).first<Person>();
    if (!t) return json({ error: 'no_user' }, 404);
    if (t.id === u.id) return json({ error: 'self' }, 400);
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM bracket_editors WHERE bracket_id = ?').bind(params.id).first<{ n: number }>();
    if ((n?.n ?? 0) >= MAX_EDITORS) return json({ error: 'limit' }, 400);
    await env.DB.prepare('INSERT OR IGNORE INTO bracket_editors (bracket_id, user_id, added_at) VALUES (?,?,?)').bind(params.id, t.id, new Date().toISOString()).run();
    return json({ ok: true, person: t });
  } catch { return json({ error: 'migrate' }, 500); }
};

/** Owner removes anyone; a co-editor can remove himself (leave). Body: { userId }. */
export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const o = await owner(env, params.id);
  if (!o) return json({ error: 'not_found' }, 404);
  const uid = str((await body(request)).userId, 40);
  if (o.user_id !== u.id && uid !== u.id) return json({ error: 'not_found' }, 404);
  try { await env.DB.prepare('DELETE FROM bracket_editors WHERE bracket_id = ? AND user_id = ?').bind(params.id, uid).run(); } catch { return json({ error: 'migrate' }, 500); }
  return json({ ok: true });
};
