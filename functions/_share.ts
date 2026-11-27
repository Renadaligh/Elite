// Shared editing of a SITE tournament, admin side: who besides the dashboard's owner may open it, and what each may do. Not a route: it exports no handlers.
import { can, forbidden, getAdmin, type Admin } from './_admin';
import { EDITOR_KEYS, readEditorPerms, type EditorKey } from './_access';
import { denied, json, type Ctx } from './_lib';

/** What an admin was given on one tournament, or null when he was not added to it (or the table is not created yet). Community tournaments are never shared this way. */
export async function adminPerms(env: Ctx['env'], id: string, username: string): Promise<EditorKey[] | null> {
  try {
    const r = await env.DB.prepare("SELECT e.perms FROM tournament_editors e JOIN tournaments t ON t.id = e.tournament_id WHERE e.tournament_id = ? AND e.kind = 'admin' AND e.who = ? AND COALESCE(t.bracket_id, '') = ''").bind(id, username).first<{ perms: string }>();
    return r ? readEditorPerms(r.perms) : null;
  } catch { return null; }
}

export type Scope = { admin: Admin; full: boolean; perms: EditorKey[] };

/** Guard for the tournament endpoints: an admin who may edit tournaments in general (full), or one who was added to THIS tournament with at least one of `keys`. */
export async function guardTournament(req: Request, env: Ctx['env'], id: string, ...keys: EditorKey[]): Promise<Scope | Response> {
  const a = await getAdmin(req, env);
  if (!a) return denied();
  if (a.mustChange) return json({ error: 'must_change' }, 403);
  if (can(a, 'tournaments', 'edit')) return { admin: a, full: true, perms: [...EDITOR_KEYS] };
  const p = await adminPerms(env, id, a.username);
  if (!p || !keys.some((k) => p.includes(k))) return forbidden();
  return { admin: a, full: false, perms: p };
}

/** The tournaments an admin was added to (id → permissions). */
export async function sharedWith(env: Ctx['env'], username: string): Promise<Map<string, EditorKey[]>> {
  const m = new Map<string, EditorKey[]>();
  try {
    const { results } = await env.DB.prepare("SELECT e.tournament_id, e.perms FROM tournament_editors e JOIN tournaments t ON t.id = e.tournament_id WHERE e.kind = 'admin' AND e.who = ? AND COALESCE(t.bracket_id, '') = ''").bind(username).all<{ tournament_id: string; perms: string }>();
    for (const r of results) m.set(r.tournament_id, readEditorPerms(r.perms));
  } catch { /* table not created yet */ }
  return m;
}
