// Shared bracket validator (not a route). Keeps only the fields we know, with limits, so nothing odd can be stored.
const MAX_PLAYERS = 32;
const FORMATS = ['single', 'double', 'rr', 'swiss', 'ffa', 'groups'];
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(-100, v)) : d);
const txt = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
const slotOk = (s: unknown) => {
  const o = s as Record<string, unknown>;
  return !!o && ((typeof o.p === 'number' && Number.isInteger(o.p) && o.p >= 0 && o.p < MAX_PLAYERS) || o.bye === true || (typeof o.w === 'string' && o.w.length < 12) || (typeof o.l === 'string' && o.l.length < 12));
};
const slot = (s: Record<string, unknown>) => ('p' in s ? { p: s.p } : 'bye' in s ? { bye: true } : 'w' in s ? { w: s.w } : { l: s.l });

function cleanMatches(raw: unknown, max: number): Record<string, unknown>[] | null {
  if (!Array.isArray(raw) || raw.length > max) return null;
  const out: Record<string, unknown>[] = [];
  for (const r of raw) {
    const m = r as Record<string, unknown>;
    if (!m || typeof m.id !== 'string' || m.id.length > 12 || !['W', 'L', 'F'].includes(m.br as string) || !slotOk(m.a) || !slotOk(m.b)) return null;
    out.push({
      id: m.id, br: m.br, round: Math.min(40, Math.max(1, Number(m.round) | 0)), idx: Math.min(64, Math.max(1, Number(m.idx) | 0)),
      a: slot(m.a as Record<string, unknown>), b: slot(m.b as Record<string, unknown>),
      sa: txt(m.sa, 4) || undefined, sb: txt(m.sb, 4) || undefined, win: m.win === 'a' || m.win === 'b' ? m.win : undefined,
    });
  }
  return out;
}

/** Keeps only the bracket fields we know, with limits, so nothing odd can be stored. */
export function cleanBracket(v: unknown) {
  const o = v as Record<string, unknown>;
  if (!o || !FORMATS.includes(o.format as string) || !Array.isArray(o.players)) return null;
  if (o.players.length < 2 || o.players.length > MAX_PLAYERS) return null;
  const f = o.format as string;
  const elim = f === 'single' || f === 'double';
  const players = o.players.map((p) => txt(p, 40).trim());
  const matches = f === 'ffa' ? [] : cleanMatches(o.matches, elim ? 80 : 300);
  if (!matches) return null;
  // Current matches: an array of known match ids (an old single string is accepted too).
  const koIds = new Set<string>();
  let ko: Record<string, unknown> | undefined;
  if (f === 'groups' && o.ko) {
    const k = o.ko as Record<string, unknown>;
    const km = cleanMatches(k.matches, 80);
    const seed = Array.isArray(k.seed) ? k.seed.filter((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < players.length).slice(0, MAX_PLAYERS) : [];
    if (!km || (k.format !== 'single' && k.format !== 'double') || seed.length < 2) return null;
    // knockout slots index into `seed`
    if (km.some((m) => [m.a, m.b].some((s) => 'p' in (s as object) && ((s as { p: number }).p >= seed.length)))) return null;
    km.forEach((m) => koIds.add(m.id as string));
    ko = { format: k.format, seed, matches: km };
  }
  const raw = Array.isArray(o.cur) ? o.cur : typeof o.cur === 'string' ? [o.cur] : [];
  const cur = [...new Set(raw)].filter((c) => matches.some((m) => m.id === c) || koIds.has(c as string)).slice(0, 16);
  const out: Record<string, unknown> = { format: f, players, matches, cur: cur.length ? cur : undefined };
  if (f !== 'single' && f !== 'double') {
    const x = (o.opts ?? {}) as Record<string, unknown>;
    const opts: Record<string, unknown> = { win: num(x.win, 1), draw: num(x.draw, 0.5), loss: num(x.loss, 0) };
    if (f === 'rr' && players.length > 16) return null;
    if (f === 'swiss') opts.rounds = Math.min(12, Math.max(1, Number(x.rounds) | 0 || 1));
    if (f === 'rr' && x.double === true) opts.double = true;
    if (f === 'ffa') { opts.rounds = Math.min(30, Math.max(1, Number(x.rounds) | 0 || 1)); if (x.low === true) opts.low = true; }
    if (f === 'groups') {
      opts.groups = Math.min(8, Math.max(2, Number(x.groups) | 0 || 2)); opts.adv = Math.min(8, Math.max(1, Number(x.adv) | 0 || 1));
      opts.koFormat = x.koFormat === 'double' ? 'double' : 'single';
    }
    out.opts = opts;
  }
  if (f === 'ffa') {
    if (!Array.isArray(o.fs) || o.fs.length < 1 || o.fs.length > 30) return null;
    out.fs = o.fs.map((r) => (Array.isArray(r) ? players.map((_, i) => txt(r[i], 6)) : players.map(() => '')));
  }
  if (f === 'groups') {
    if (!Array.isArray(o.groups) || o.groups.length < 2 || o.groups.length > 8) return null;
    const seen = new Set<number>();
    const groups: number[][] = [];
    for (const g of o.groups) {
      if (!Array.isArray(g) || g.length < 1 || g.length > 16) return null;
      const gi = g.map(Number);
      if (gi.some((i) => !Number.isInteger(i) || i < 0 || i >= players.length || seen.has(i))) return null;
      gi.forEach((i) => seen.add(i)); groups.push(gi);
    }
    out.groups = groups;
    if (ko) out.ko = ko;
  }
  return out;
}

/** new = nothing entered yet · live = in progress · done = a champion exists. Used by the "my brackets" list. */
export function bracketStatus(v: unknown): 'new' | 'live' | 'done' {
  const b = v as { format?: string; matches?: Record<string, unknown>[]; fs?: string[][]; ko?: { matches: Record<string, unknown>[] }; opts?: { rounds?: number }; players?: unknown[] };
  const ms = Array.isArray(b?.matches) ? b.matches : [];
  const scored = (m: Record<string, unknown>) => m.sa !== undefined && m.sa !== '' && m.sb !== undefined && m.sb !== '';
  const hasBye = (m: Record<string, unknown>) => [m.a, m.b].some((s) => (s as { bye?: boolean })?.bye);
  const elimDone = (list: Record<string, unknown>[]) => {
    const last = list.find((m) => m.br === 'F') ?? list.filter((m) => m.br === 'W').sort((x, y) => Number(y.round) - Number(x.round))[0];
    return !!last?.win;
  };
  const f = b?.format;
  if (f === 'single' || f === 'double') return elimDone(ms) ? 'done' : ms.some((m) => m.win) ? 'live' : 'new';
  if (f === 'ffa') {
    const fs = b.fs ?? [];
    const any = fs.some((r) => r.some((c) => c !== ''));
    return fs.length && fs.every((r) => (b.players ?? []).every((_, i) => r[i] !== '' && r[i] !== undefined)) ? 'done' : any ? 'live' : 'new';
  }
  if (f === 'groups') {
    if (b.ko && elimDone(b.ko.matches)) return 'done';
    return b.ko || ms.some(scored) ? 'live' : 'new';
  }
  const real = ms.filter((m) => !hasBye(m));
  if (!real.length) return 'new';
  const all = real.every(scored);
  const rounds = new Set(ms.map((m) => m.round)).size;
  if (all && (f === 'rr' || rounds >= (b.opts?.rounds ?? 1))) return 'done';
  return real.some(scored) ? 'live' : 'new';
}
