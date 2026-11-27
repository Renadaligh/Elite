// Who may do what on a saved bracket: the owner (everything) or a co-editor with the permissions the owner ticked. Not a route: it exports no handlers.
import type { Ctx } from './_lib';

/** tree = results / players / seats · info = tournament details, name, picture · join = registration link settings · regs = the registrants and their answers. Publishing, deleting and adding organisers stay with the owner. */
export const EDITOR_KEYS = ['tree', 'info', 'join', 'regs'] as const;
export type EditorKey = (typeof EDITOR_KEYS)[number];
/** What every co-editor could do before permissions existed (and what a new one starts with until the owner ticks more). */
export const LEGACY_PERMS: EditorKey[] = ['tree', 'info'];

export const cleanEditorPerms = (v: unknown): EditorKey[] => (Array.isArray(v) ? EDITOR_KEYS.filter((k) => v.includes(k)) : []);
/** Empty / missing = a co-editor added before permissions existed. */
export const readEditorPerms = (s: string | null | undefined): EditorKey[] => {
  if (!s) return [...LEGACY_PERMS];
  try { return cleanEditorPerms(JSON.parse(s)); } catch { return [...LEGACY_PERMS]; }
};

/** `site` = the bracket is a site (admin) tournament the member was added to as an organiser: its data lives in `tournaments`, not in `user_brackets`. */
export type Access = { ownerId: string; isOwner: boolean; perms: EditorKey[]; site?: boolean };

/** The signed-in user's access to this bracket, or null (not the owner and not a co-editor). Works on a database that has no `perms` column yet. */
export async function bracketAccess(env: Ctx['env'], id: string, uid: string): Promise<Access | null> {
  let o: { user_id: string } | null = null;
  try { o = await env.DB.prepare('SELECT user_id FROM user_brackets WHERE id = ?').bind(id).first<{ user_id: string }>(); } catch { return null; }
  if (!o) return siteAccess(env, id, uid);
  if (o.user_id === uid) return { ownerId: uid, isOwner: true, perms: [...EDITOR_KEYS] };
  try {
    const r = await env.DB.prepare('SELECT perms FROM bracket_editors WHERE bracket_id = ? AND user_id = ?').bind(id, uid).first<{ perms: string }>();
    return r ? { ownerId: o.user_id, isOwner: false, perms: readEditorPerms(r.perms) } : null;
  } catch { /* the perms column is not added yet: everybody is a legacy co-editor */ }
  try {
    const r = await env.DB.prepare('SELECT 1 AS x FROM bracket_editors WHERE bracket_id = ? AND user_id = ?').bind(id, uid).first();
    return r ? { ownerId: o.user_id, isOwner: false, perms: [...LEGACY_PERMS] } : null;
  } catch { return null; } // the table is not created yet
}

/** A member added to a site tournament as an organiser (never the info card: that stays in the admin). Null when the table is not created yet. */
export async function siteAccess(env: Ctx['env'], id: string, uid: string): Promise<Access | null> {
  try {
    const r = await env.DB.prepare("SELECT e.perms FROM tournament_editors e JOIN tournaments t ON t.id = e.tournament_id WHERE e.tournament_id = ? AND e.kind = 'user' AND e.who = ? AND COALESCE(t.bracket_id, '') = ''").bind(id, uid).first<{ perms: string }>();
    if (!r) return null;
    const perms = readEditorPerms(r.perms).filter((k) => k !== 'info');
    return perms.length ? { ownerId: '', isOwner: false, perms, site: true } : null;
  } catch { return null; }
}

/** True when the access holds at least one of these permissions. */
export const allows = (a: Access | null, ...keys: EditorKey[]) => !!a && keys.some((k) => a.perms.includes(k));
