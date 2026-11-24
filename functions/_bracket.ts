// Shared bracket validator (not a route). Keeps only the fields we know, with limits, so nothing odd can be stored.
const MAX_PLAYERS = 4096; // safety net only: members have no practical limit
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
    if (!m || typeof m.id !== 'string' || m.id.length > 12 || !['W', 'L', 'F', 'T', 'P'].includes(m.br as string) || !slotOk(m.a) || !slotOk(m.b)) return null;
    out.push({
      id: m.id, br: m.br, round: Math.min(40, Math.max(1, Number(m.round) | 0)), idx: Math.min(64, Math.max(1, Number(m.idx) | 0)),
      a: slot(m.a as Record<string, unknown>), b: slot(m.b as Record<string, unknown>),
      ...(m.br === 'P' ? { pl: Math.min(32, Math.max(1, Number(m.pl) | 0)), gs: Math.min(32, Math.max(2, Number(m.gs) | 0)), g: txt(m.g, 16), sec: m.sec === 'L' ? 'L' : 'W' } : {}),
      sa: txt(m.sa, 4) || undefined, sb: txt(m.sb, 4) || undefined, win: m.win === 'a' || m.win === 'b' ? m.win : undefined,
    });
  }
  return out;
}

const orgOf = (o: Record<string, unknown>) => { const v = txt(o.org, 60).trim(); return v ? { org: v } : {}; };
/** Keeps only the bracket fields we know, with limits, so nothing odd can be stored. */
/** Optional organiser settings kept with the bracket: manual players currently out of it, and the automatic-adding switch. */

/** Tournament details card (game, prize, start, seats, solo/team); copied field by field so nothing else gets stored. */
function infoOf(v: unknown) {
  const x = (v ?? {}) as Record<string, unknown>;
  const info: Record<string, unknown> = {};
  const g = txt(x.gameId, 60).trim().toLowerCase(), pr = txt(x.prize, 80).trim(), st = txt(x.startsAt, 40).trim();
  if (g) info.gameId = g;
  if (pr) info.prize = pr;
  if (st && !Number.isNaN(Date.parse(st))) info.startsAt = st;
  if (Number.isInteger(x.total) && (x.total as number) >= 0) info.total = Math.min(4096, x.total as number);
  if (x.mode === 'team' || x.mode === 'solo') info.mode = x.mode;
  if (x.showCount === false) info.showCount = false;
  return Object.keys(info).length ? { info } : {};
}
const extraOf = (o: Record<string, unknown>) => ({
  ...(Array.isArray(o.bench) && o.bench.length ? { bench: o.bench.slice(0, 2000).map((p) => txt(p, 40).trim()).filter(Boolean) } : {}),
  ...(o.auto === false ? { auto: false } : {}),
  ...(o.third === true ? { third: true } : {}),
  ...(o.place === true ? { place: true, ...(Number.isInteger(o.placeTo) && (o.placeTo as number) >= 3 && (o.placeTo as number) < 16 ? { placeTo: o.placeTo } : {}) } : {}),
  ...(o.gf === 'two' || o.gf === 'one' || o.gf === 'none' ? { gf: o.gf } : {}),
  ...infoOf(o.info),
  ...(txt(o.titleEn, 80).trim() ? { titleEn: txt(o.titleEn, 80).trim() } : {}),
});

export function cleanBracket(v: unknown) {
  const o = v as Record<string, unknown>;
  if (!o || !FORMATS.includes(o.format as string) || !Array.isArray(o.players)) return null;
  if (o.players.length > MAX_PLAYERS) return null;
  const f = o.format as string;
  const elim = f === 'single' || f === 'double';
  const players = o.players.map((p) => txt(p, 40).trim());
  if (players.length < 2) { // a draft: players are listed, nothing is drawn yet
    const x = (o.opts ?? {}) as Record<string, unknown>;
    return { format: f, players, matches: [], ...orgOf(o), ...extraOf(o), ...(elim ? {} : { opts: { win: num(x.win, 1), draw: num(x.draw, 0.5), loss: num(x.loss, 0), ...(x.double === true ? { double: true } : {}), ...(x.low === true ? { low: true } : {}), ...(x.koFormat === 'double' ? { koFormat: 'double' } : x.koFormat === 'single' ? { koFormat: 'single' } : {}), ...(typeof x.rounds === 'number' ? { rounds: Math.min(30, Math.max(1, x.rounds | 0)) } : {}), ...(typeof x.groups === 'number' ? { groups: Math.min(8, Math.max(2, x.groups | 0)) } : {}), ...(typeof x.adv === 'number' ? { adv: Math.min(8, Math.max(1, x.adv | 0)) } : {}) } }) };
  }
  const matches = f === 'ffa' ? [] : cleanMatches(o.matches, Math.max(elim ? 80 : 300, players.length * (elim ? 2 : 40)));
  if (!matches) return null;
  // Current matches: an array of known match ids (an old single string is accepted too).
  const koIds = new Set<string>();
  let ko: Record<string, unknown> | undefined;
  if (f === 'groups' && o.ko) {
    const k = o.ko as Record<string, unknown>;
    const km = cleanMatches(k.matches, Math.max(80, players.length * 2));
    const seed = Array.isArray(k.seed) ? k.seed.filter((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < players.length).slice(0, MAX_PLAYERS) : [];
    if (!km || (k.format !== 'single' && k.format !== 'double') || seed.length < 2) return null;
    // knockout slots index into `seed`
    if (km.some((m) => [m.a, m.b].some((s) => 'p' in (s as object) && ((s as { p: number }).p >= seed.length)))) return null;
    km.forEach((m) => koIds.add(m.id as string));
    ko = { format: k.format, seed, matches: km };
  }
  const out: Record<string, unknown> = { format: f, players, matches, ...orgOf(o), ...extraOf(o) };
  if (Number.isInteger(o.champ) && (o.champ as number) >= 0 && (o.champ as number) < players.length) out.champ = o.champ;
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
    const f1 = list.find((m) => m.id === 'F-1'), f2 = list.find((m) => m.id === 'F-2');
    if (f1 && f2) return f1.win === 'a' || !!f2.win; // the winners-bracket champion winning the first final ends it
    const last = f1 ?? list.filter((m) => m.br === 'W').sort((x, y) => Number(y.round) - Number(x.round))[0];
    return !!last?.win;
  };
  const f = b?.format;
  if (Number.isInteger((b as { champ?: unknown }).champ)) return 'done'; // the organiser chose the winner
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

/** Saved brackets per signed-in visitor. */
export const MAX_PER_USER = 100;
