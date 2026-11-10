// Shared bracket validator (not a route). Keeps only the fields we know, with limits, so nothing odd can be stored.
const MAX_PLAYERS = 32;
const txt = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
const slotOk = (s: unknown) => {
  const o = s as Record<string, unknown>;
  return !!o && ((typeof o.p === 'number' && Number.isInteger(o.p) && o.p >= 0 && o.p < MAX_PLAYERS) || o.bye === true || (typeof o.w === 'string' && o.w.length < 12) || (typeof o.l === 'string' && o.l.length < 12));
};
const slot = (s: Record<string, unknown>) => ('p' in s ? { p: s.p } : 'bye' in s ? { bye: true } : 'w' in s ? { w: s.w } : { l: s.l });

/** Keeps only the bracket fields we know, with limits, so nothing odd can be stored. */
export function cleanBracket(v: unknown) {
  const o = v as Record<string, unknown>;
  if (!o || (o.format !== 'single' && o.format !== 'double') || !Array.isArray(o.players) || !Array.isArray(o.matches)) return null;
  if (o.players.length < 2 || o.players.length > MAX_PLAYERS || o.matches.length > 80) return null;
  const players = o.players.map((p) => txt(p, 40).trim());
  const matches: Record<string, unknown>[] = [];
  for (const raw of o.matches) {
    const m = raw as Record<string, unknown>;
    if (!m || typeof m.id !== 'string' || m.id.length > 12 || !['W', 'L', 'F'].includes(m.br as string) || !slotOk(m.a) || !slotOk(m.b)) return null;
    matches.push({
      id: m.id, br: m.br, round: Math.min(10, Math.max(1, Number(m.round) | 0)), idx: Math.min(64, Math.max(1, Number(m.idx) | 0)),
      a: slot(m.a as Record<string, unknown>), b: slot(m.b as Record<string, unknown>),
      sa: txt(m.sa, 4) || undefined, sb: txt(m.sb, 4) || undefined, win: m.win === 'a' || m.win === 'b' ? m.win : undefined,
    });
  }
  // Current matches: an array of known match ids (an old single string is accepted too).
  const raw = Array.isArray(o.cur) ? o.cur : typeof o.cur === 'string' ? [o.cur] : [];
  const cur = [...new Set(raw)].filter((c) => matches.some((m) => m.id === c)).slice(0, 16);
  return { format: o.format, players, matches, cur: cur.length ? cur : undefined };
}

