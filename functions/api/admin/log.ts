import { guardOwner } from '../../_admin';
import { json, type Ctx } from '../../_lib';

type Row = { id: number; at: number; username: string; action: string; target: string; detail: string };

/** Owner only, read-only. GET /api/admin/log?user=&action=&from=&to=&before=<id> → { rows, users, actions, more }.
 *  `from`/`to` are millisecond timestamps. 100 rows per page, newest first. There is no write or delete route for the log. */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const q = new URL(request.url).searchParams;
  const w: string[] = [], v: unknown[] = [];
  const user = (q.get('user') || '').slice(0, 40), action = (q.get('action') || '').slice(0, 60);
  const from = Number(q.get('from')) || 0, to = Number(q.get('to')) || 0, before = Number(q.get('before')) || 0;
  if (user) { w.push('username=?'); v.push(user); }
  if (action) { w.push(action.endsWith('.') ? 'action LIKE ?' : 'action=?'); v.push(action.endsWith('.') ? action + '%' : action); }
  if (from) { w.push('at>=?'); v.push(from); }
  if (to) { w.push('at<?'); v.push(to); }
  if (before) { w.push('id<?'); v.push(before); }
  try {
    const { results } = await env.DB.prepare(`SELECT id, at, username, action, target, detail FROM admin_log ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY id DESC LIMIT 101`).bind(...v).all<Row>();
    const users = (await env.DB.prepare('SELECT DISTINCT username FROM admin_log ORDER BY username').all<{ username: string }>()).results.map((r) => r.username);
    const actions = (await env.DB.prepare('SELECT DISTINCT action FROM admin_log ORDER BY action').all<{ action: string }>()).results.map((r) => r.action);
    return json({ rows: results.slice(0, 100), more: results.length > 100, users, actions });
  } catch { return json({ rows: [], more: false, users: [], actions: [], missing: true }); }
};
