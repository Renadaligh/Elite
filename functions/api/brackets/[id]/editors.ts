import { LEGACY_PERMS, cleanEditorPerms, readEditorPerms, type EditorKey } from '../../../_access';
import { currentUser, sameOrigin, validHandle } from '../../../_auth';
import { body, denied, json, str, type Ctx } from '../../../_lib';

const MAX_EDITORS = 10;
type Person = { id: string; name: string; handle: string; avatar: string; perms?: EditorKey[] };
type PersonRow = Omit<Person, 'perms'> & { perms?: string };
async function owner(env: Ctx['env'], id: string) { return env.DB.prepare('SELECT user_id FROM user_brackets WHERE id = ?').bind(id).first<{ user_id: string }>(); }

/** The co-editors with what each may do. On a database without the `perms` column everybody has the old permissions. */
async function listEditors(env: Ctx['env'], id: string): Promise<{ rows: Person[]; hasPerms: boolean }> {
  try {
    const { results } = await env.DB.prepare('SELECT u.id, u.name, u.handle, u.avatar, e.perms FROM bracket_editors e JOIN users u ON u.id = e.user_id WHERE e.bracket_id = ? ORDER BY e.added_at').bind(id).all<PersonRow>();
    return { rows: results.map((r) => ({ id: r.id, name: r.name, handle: r.handle, avatar: r.avatar, perms: readEditorPerms(r.perms) })), hasPerms: true };
  } catch { /* the perms column is not added yet */ }
  const { results } = await env.DB.prepare('SELECT u.id, u.name, u.handle, u.avatar FROM bracket_editors e JOIN users u ON u.id = e.user_id WHERE e.bracket_id = ? ORDER BY e.added_at').bind(id).all<Person>();
  return { rows: results.map((r) => ({ ...r, perms: [...LEGACY_PERMS] })), hasPerms: false };
}

/** Co-editors of this bracket: visible to the owner and to the co-editors themselves. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const u = await currentUser(request, env);
  if (!u) return denied();
  const o = await owner(env, params.id);
  if (!o) return json({ error: 'not_found' }, 404);
  try {
    const { rows, hasPerms } = await listEditors(env, params.id);
    if (o.user_id !== u.id && !rows.some((p) => p.id === u.id)) return json({ error: 'not_found' }, 404);
    return json({ isOwner: o.user_id === u.id, max: MAX_EDITORS, editors: rows, perms: hasPerms });
  } catch { return json({ error: 'migrate' }, 500); } // run the CREATE TABLE / ALTER TABLE statements from schema.sql
};

/** Owner only: add a registered member by username, with the permissions he is given (default: the tree and the tournament info). */
export const onRequestPost = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const o = await owner(env, params.id);
  if (!o || o.user_id !== u.id) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  const h = str(b.handle, 30).toLowerCase().replace(/^@/, '');
  if (!validHandle(h)) return json({ error: 'bad_handle' }, 400);
  const perms = b.perms === undefined ? [...LEGACY_PERMS] : cleanEditorPerms(b.perms);
  if (!perms.length) return json({ error: 'no_perms' }, 400);
  try {
    const t = await env.DB.prepare('SELECT id, name, handle, avatar FROM users WHERE handle = ?').bind(h).first<Person>();
    if (!t) return json({ error: 'no_user' }, 404);
    if (t.id === u.id) return json({ error: 'self' }, 400);
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM bracket_editors WHERE bracket_id = ?').bind(params.id).first<{ n: number }>();
    if ((n?.n ?? 0) >= MAX_EDITORS) return json({ error: 'limit' }, 400);
    const now = new Date().toISOString();
    try { await env.DB.prepare('INSERT OR IGNORE INTO bracket_editors (bracket_id, user_id, added_at, perms) VALUES (?,?,?,?)').bind(params.id, t.id, now, JSON.stringify(perms)).run(); }
    catch {
      // the perms column is not added yet: only the old permissions can be given
      if (perms.join() !== LEGACY_PERMS.join()) return json({ error: 'migrate' }, 500);
      await env.DB.prepare('INSERT OR IGNORE INTO bracket_editors (bracket_id, user_id, added_at) VALUES (?,?,?)').bind(params.id, t.id, now).run();
    }
    return json({ ok: true, person: { ...t, perms } });
  } catch { return json({ error: 'migrate' }, 500); }
};

/** Owner only: change what a co-editor may do. Body: { userId, perms: ['tree', 'info', 'join', 'regs'] } (at least one). */
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const o = await owner(env, params.id);
  if (!o || o.user_id !== u.id) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  const uid = str(b.userId, 40);
  const perms = cleanEditorPerms(b.perms);
  if (!perms.length) return json({ error: 'no_perms' }, 400);
  try {
    if (!(await env.DB.prepare('SELECT 1 AS x FROM bracket_editors WHERE bracket_id = ? AND user_id = ?').bind(params.id, uid).first())) return json({ error: 'not_found' }, 404);
    await env.DB.prepare('UPDATE bracket_editors SET perms = ? WHERE bracket_id = ? AND user_id = ?').bind(JSON.stringify(perms), params.id, uid).run();
  } catch { return json({ error: 'migrate' }, 500); } // the perms column is not added yet
  return json({ ok: true, perms });
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
