import { body, denied, isAdmin, json, safeUrl, type Ctx } from '../../../_lib';
import { cleanBracket } from '../../../_bracket';

/** Admin only. Body may hold any of: bracket (object, or null to remove it), streamUrl, streamLive. Only the given fields change. */
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  const b = await body(request);
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
  return json({ ok: true });
};
