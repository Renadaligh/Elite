import { guardOwner } from '../../_admin';
import { logAdmin } from '../../_audit';
import { json, type Ctx } from '../../_lib';

const PAGE = 50;
type Row = { id: string; name: string; handle?: string; provider: string; email: string; created_at: string; brackets: number };

/** Owner only, read-only: the members who made an account on the site. GET /api/admin/members?q=<username or name>&offset=<n> → { total, more, rows }.
 *  The email is never sent. The name of a member who signed in with Google is a real name, so it is never sent either (the username is enough). A member who signed in with an email gets his name from the start of that address, so a name that is still exactly that is left out too. */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  const q = new URL(request.url).searchParams;
  const text = (q.get('q') || '').trim().slice(0, 40).replace(/^@/, '');
  const offset = Math.max(0, Math.min(1_000_000, Number(q.get('offset')) || 0));
  const like = `%${text.replace(/[\\%_]/g, '\\$&')}%`;
  const run = async (withHandle: boolean) => {
    // the name is searched only for members whose name is shown (not Google, not an email sign-in), so a search can never reveal a hidden name
    const nameLike = "(u.provider NOT IN ('google', 'email') AND u.name LIKE ? ESCAPE '\\')";
    const where = text ? (withHandle ? `WHERE (u.handle LIKE ? ESCAPE '\\' OR ${nameLike})` : `WHERE ${nameLike}`) : '';
    const args = text ? (withHandle ? [like, like] : [like]) : [];
    const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM users u ${where}`).bind(...args).first<{ n: number }>())?.n ?? 0;
    const cols = `u.id, u.name, ${withHandle ? 'u.handle,' : ''} u.provider, u.email, u.created_at, (SELECT COUNT(*) FROM user_brackets b WHERE b.user_id = u.id) AS brackets`;
    const { results } = await env.DB.prepare(`SELECT ${cols} FROM users u ${where} ORDER BY u.created_at DESC, u.id LIMIT ? OFFSET ?`).bind(...args, PAGE + 1, offset).all<Row>();
    return { total, results };
  };
  let r: Awaited<ReturnType<typeof run>>;
  try { r = await run(true); }
  catch {
    try { r = await run(false); } // the username column is not added yet
    catch { return json({ total: 0, more: false, rows: [], missing: true }); }
  }
  // opening the list (not each search or page) is written to the activity log
  if (!text && offset === 0) await logAdmin(env, a.username, 'members.view');
  const rows = r.results.slice(0, PAGE).map((u) => {
    const local = u.provider === 'email' ? (u.email || '').split('@')[0] : '';
    return {
      id: u.id, handle: u.handle || '', name: u.provider === 'google' || (local && u.name === local) ? '' : u.name, provider: u.provider,
      createdAt: u.created_at, brackets: u.brackets ?? 0,
    };
  });
  return json({ total: r.total, more: r.results.length > PAGE, rows });
};
