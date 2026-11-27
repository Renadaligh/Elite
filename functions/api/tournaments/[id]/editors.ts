import { cleanEditorPerms, type EditorKey } from '../../../_access';
import { guardOwner, validUser } from '../../../_admin';
import { logAdmin } from '../../../_audit';
import { sameOrigin, validHandle } from '../../../_auth';
import { body, json, str, type Ctx } from '../../../_lib';

const MAX_EDITORS = 10;
type Kind = 'admin' | 'user';
type Row = { kind: Kind; who: string; perms: string };

/** An admin gets any of these; a member (who opens it in the organisers' tool) never gets the info card, which stays in the dashboard. */
const permsFor = (kind: Kind, v: unknown): EditorKey[] => cleanEditorPerms(v).filter((k) => kind === 'admin' || k !== 'info');
const kindOf = (v: unknown): Kind | '' => (v === 'admin' || v === 'user' ? v : '');

/** Only a site tournament can be shared this way (a community one belongs to its organiser). */
async function site(env: Ctx['env'], id: string) {
  try { return await env.DB.prepare("SELECT id, name_en, name_ar, bracket FROM tournaments WHERE id = ? AND COALESCE(bracket_id, '') = ''").bind(id).first<{ id: string; name_en: string; name_ar: string; bracket: string | null }>(); }
  catch { return null; }
}
const title = (t: { name_en: string; name_ar: string; id: string }) => `${t.name_ar || t.name_en} (${t.id})`;

/** Owner only: who was added to this tournament and with what. Members are shown by username only (no name, no picture, no email). */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  if (!(await site(env, params.id))) return json({ error: 'not_found' }, 404);
  try {
    const { results } = await env.DB.prepare('SELECT kind, who, perms FROM tournament_editors WHERE tournament_id = ? ORDER BY added_at').bind(params.id).all<Row>();
    const editors = [];
    for (const r of results) {
      let label = r.who;
      if (r.kind === 'user') {
        const u = await env.DB.prepare('SELECT handle FROM users WHERE id = ?').bind(r.who).first<{ handle: string }>().catch(() => null);
        if (!u) continue; // the member is gone
        label = u.handle ? `@${u.handle}` : '—';
      }
      editors.push({ kind: r.kind, id: r.who, label, perms: permsFor(r.kind, JSON.parse(r.perms || '[]')) });
    }
    return json({ max: MAX_EDITORS, editors });
  } catch { return json({ error: 'migrate' }, 500); } // run the CREATE TABLE statement from schema.sql
};

/** Owner only. Body: { kind: 'admin', username, perms } or { kind: 'user', handle, perms }. */
export const onRequestPost = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const t = await site(env, params.id);
  if (!t) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  const kind = kindOf(b.kind);
  if (!kind) return json({ error: 'invalid' }, 400);
  const perms = permsFor(kind, b.perms);
  if (!perms.length) return json({ error: 'no_perms' }, 400);
  let who = '', label = '';
  try {
    if (kind === 'admin') {
      const name = str(b.username, 30).toLowerCase();
      if (!validUser(name)) return json({ error: 'bad_user' }, 400);
      const r = await env.DB.prepare('SELECT username, role, disabled FROM admins WHERE username = ?').bind(name).first<{ username: string; role: string; disabled: number }>();
      if (!r) return json({ error: 'no_user' }, 404);
      if (r.role === 'owner') return json({ error: 'owner' }, 400);
      if (r.disabled) return json({ error: 'disabled' }, 400);
      who = r.username; label = r.username;
    } else {
      const h = str(b.handle, 30).toLowerCase().replace(/^@/, '');
      if (!validHandle(h)) return json({ error: 'bad_handle' }, 400);
      const r = await env.DB.prepare('SELECT id, handle FROM users WHERE handle = ?').bind(h).first<{ id: string; handle: string }>();
      if (!r) return json({ error: 'no_user' }, 404);
      if (!t.bracket) return json({ error: 'no_bracket' }, 400); // the organisers' tool opens a tournament that already has a tree
      who = r.id; label = `@${r.handle}`;
    }
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM tournament_editors WHERE tournament_id = ?').bind(params.id).first<{ n: number }>();
    if ((n?.n ?? 0) >= MAX_EDITORS) return json({ error: 'limit' }, 400);
    await env.DB.prepare('INSERT OR IGNORE INTO tournament_editors (tournament_id, kind, who, perms, added_by, added_at) VALUES (?,?,?,?,?,?)').bind(params.id, kind, who, JSON.stringify(perms), a.username, new Date().toISOString()).run();
  } catch { return json({ error: 'migrate' }, 500); }
  await logAdmin(env, a.username, 'tournaments.editor.add', title(t), { editor: label, perms });
  return json({ ok: true, editor: { kind, id: who, label, perms } });
};

/** Owner only: change what an editor may do. Body: { kind, id, perms } (at least one). */
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const t = await site(env, params.id);
  if (!t) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  const kind = kindOf(b.kind), who = str(b.id, 60);
  if (!kind || !who) return json({ error: 'invalid' }, 400);
  const perms = permsFor(kind, b.perms);
  if (!perms.length) return json({ error: 'no_perms' }, 400);
  try {
    if (!(await env.DB.prepare('SELECT 1 AS x FROM tournament_editors WHERE tournament_id = ? AND kind = ? AND who = ?').bind(params.id, kind, who).first())) return json({ error: 'not_found' }, 404);
    await env.DB.prepare('UPDATE tournament_editors SET perms = ? WHERE tournament_id = ? AND kind = ? AND who = ?').bind(JSON.stringify(perms), params.id, kind, who).run();
  } catch { return json({ error: 'migrate' }, 500); }
  await logAdmin(env, a.username, 'tournaments.editor.perms', title(t), { editor: who, perms });
  return json({ ok: true, perms });
};

/** Owner only. Body: { kind, id }. */
export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const t = await site(env, params.id);
  if (!t) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  const kind = kindOf(b.kind), who = str(b.id, 60);
  if (!kind || !who) return json({ error: 'invalid' }, 400);
  try { await env.DB.prepare('DELETE FROM tournament_editors WHERE tournament_id = ? AND kind = ? AND who = ?').bind(params.id, kind, who).run(); } catch { return json({ error: 'migrate' }, 500); }
  await logAdmin(env, a.username, 'tournaments.editor.remove', title(t), { editor: who });
  return json({ ok: true });
};
