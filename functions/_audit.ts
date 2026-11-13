// Append-only audit log of admin activity. Not a route. Rows are only ever inserted: no code path updates or deletes them.
import type { Env } from './_lib';

type Row = Record<string, unknown>;
const cut = (v: unknown) => { const s = v == null ? '' : String(v); return s.length > 140 ? s.slice(0, 140) + '…' : s; };

/** Writes one log line. Never throws: a logging problem must not block the admin's action. */
export async function logAdmin(env: Env, username: string, action: string, target = '', detail: unknown = '') {
  try {
    const d = typeof detail === 'string' ? detail : JSON.stringify(detail);
    await env.DB.prepare('INSERT INTO admin_log (at, username, action, target, detail) VALUES (?,?,?,?,?)')
      .bind(Date.now(), username.slice(0, 40), action.slice(0, 60), cut(target), d.slice(0, 1500)).run();
  } catch { /* table missing or DB busy: ignore */ }
}

/** Current row of a table (for before/after comparison). Bulky or secret columns are left out. */
export async function snap(env: Env, table: 'news' | 'tournaments' | 'games', id: string): Promise<Row | null> {
  try { return await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first<Row>(); } catch { return null; }
}
const SKIP = new Set(['bracket', 'details', 'winner_members']);
/** { field: [before, after] } for the fields that changed. */
export function diff(before: Row | null, after: Row | null) {
  const out: Record<string, [string, string]> = {};
  if (!before || !after) return out;
  for (const k of Object.keys(after)) {
    if (SKIP.has(k)) { if (String(before[k] ?? '') !== String(after[k] ?? '')) out[k] = ['', '(changed)']; continue; }
    if (String(before[k] ?? '') !== String(after[k] ?? '')) out[k] = [cut(before[k]), cut(after[k])];
  }
  return out;
}
/** Log an edit: compares the row before and after. */
export async function logEdit(env: Env, who: string, action: string, table: 'news' | 'tournaments' | 'games', id: string, before: Row | null) {
  const after = await snap(env, table, id);
  const title = String(after?.title_en || after?.name_en || after?.title_ar || after?.name_ar || id);
  await logAdmin(env, who, action, `${title} (${id})`, diff(before, after));
}
/** Log a deletion with the item's name. */
export const rowTitle = (r: Row | null, id: string) => `${String(r?.title_en || r?.name_en || r?.title_ar || r?.name_ar || id)} (${id})`;
