import { body, denied, isAdmin, json, safeUrl, type Ctx } from '../../../_lib';

const MAX_PLAYERS = 32;
const txt = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
const slotOk = (s: unknown) => {
  const o = s as Record<string, unknown>;
  return !!o && ((typeof o.p === 'number' && Number.isInteger(o.p) && o.p >= 0 && o.p < MAX_PLAYERS) || o.bye === true || (typeof o.w === 'string' && o.w.length < 12) || (typeof o.l === 'string' && o.l.length < 12));
};
const slot = (s: Record<string, unknown>) => ('p' in s ? { p: s.p } : 'bye' in s ? { bye: true } : 'w' in s ? { w: s.w } : { l: s.l });

/** Keeps only the bracket fields we know, with limits, so nothing odd can be stored. */
function cleanBracket(v: unknown) {
  const o = v as Record<string, unknown>;
  if (!o || (o.format !== 'single' && o.format !== 'double') || !Array.isArray(o.players) || !Array.isArray(o.matches)) return null;
  if (o.players.length < 2 || o.players.length > MAX_PLAYERS || o.matches.length > 80) return null;
  const players = o.players.map((p) => txt(p, 40).trim());
  const matches = [];
  for (const raw of o.matches) {
    const m = raw as Record<string, unknown>;
    if (!m || typeof m.id !== 'string' || m.id.length > 12 || !['W', 'L', 'F'].includes(m.br as string) || !slotOk(m.a) || !slotOk(m.b)) return null;
    matches.push({
      id: m.id, br: m.br, round: Math.min(10, Math.max(1, Number(m.round) | 0)), idx: Math.min(64, Math.max(1, Number(m.idx) | 0)),
      a: slot(m.a as Record<string, unknown>), b: slot(m.b as Record<string, unknown>),
      sa: txt(m.sa, 4) || undefined, sb: txt(m.sb, 4) || undefined, win: m.win === 'a' || m.win === 'b' ? m.win : undefined,
    });
  }
  const cur = typeof o.cur === 'string' && matches.some((m) => m.id === o.cur) ? o.cur : undefined;
  return { format: o.format, players, matches, cur };
}

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
