import { body, json, safeUrl, type Ctx } from '../../../_lib';
import { guard } from '../../../_admin';
import { cleanBracket } from '../../../_bracket';
import { logAdmin } from '../../../_audit';
import { dataId } from '../../../_tid';

/** Admin only. Body may hold any of: bracket (object, or null to remove it), streamUrl, streamLive. Only the given fields change. */
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'tournaments', 'edit'); if (a instanceof Response) return a;
  const b = await body(request);
  // A community tournament keeps its bracket and stream in the organiser's saved bracket: the admin edits that one (it is what visitors see)
  const did = await dataId(env, String(params.id));
  if (did !== params.id) {
    try {
      if ('bracket' in b && b.bracket !== null) {
        const c = cleanBracket(b.bracket); if (!c) return json({ error: 'invalid' }, 400);
        await env.DB.prepare('UPDATE user_brackets SET data = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(c), new Date().toISOString(), did).run();
      }
      if ('streamUrl' in b) await env.DB.prepare('UPDATE user_brackets SET stream_url = ? WHERE id = ?').bind(safeUrl(b.streamUrl), did).run();
      if ('streamLive' in b) await env.DB.prepare('UPDATE user_brackets SET live = ? WHERE id = ?').bind(b.streamLive ? 1 : 0, did).run();
    } catch (e) { return json({ error: 'db', detail: String((e as Error).message).slice(0, 160) }, 500); }
    await logAdmin(env, a.username, 'tournaments.bracket', String(params.id), { community: did });
    return json({ ok: true });
  }
  const sets: string[] = [], vals: unknown[] = [];
  if ('bracket' in b) {
    if (b.bracket === null) { sets.push('bracket=?'); vals.push(''); }
    else { const c = cleanBracket(b.bracket); if (!c) return json({ error: 'invalid' }, 400); sets.push('bracket=?'); vals.push(JSON.stringify(c)); }
  }
  if ('streamUrl' in b) { sets.push('stream_url=?'); vals.push(safeUrl(b.streamUrl)); }
  if ('streamLive' in b) { sets.push('stream_live=?'); vals.push(b.streamLive ? 1 : 0); }
  if (!sets.length) return json({ error: 'invalid' }, 400);
  try { await env.DB.prepare(`UPDATE tournaments SET ${sets.join(',')} WHERE id=?`).bind(...vals, params.id).run(); }
  catch (e) { return json({ error: 'db', detail: String((e as Error).message).slice(0, 160) }, 500); }
  await logAdmin(env, a.username, 'tournaments.bracket', String(params.id), { bracket: 'bracket' in b ? (b.bracket === null ? 'removed' : 'saved') : undefined, streamUrl: 'streamUrl' in b ? safeUrl(b.streamUrl) : undefined, streamLive: 'streamLive' in b ? !!b.streamLive : undefined });
  return json({ ok: true });
};
