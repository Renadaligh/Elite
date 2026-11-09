/**
 * Tournament brackets (single / double elimination). The whole bracket is one JSON document stored with the tournament;
 * the dashboard does all the logic (generating, advancing winners) and the site only draws it.
 *
 * A match has two slots. A slot is a player (index into `players`), the winner/loser of another match, or a bye.
 * Who plays whom is *derived* by resolve(), so advancing a winner only means storing `win` on one match.
 */
export type BFormat = 'single' | 'double';
export type Slot = { p: number } | { w: string } | { l: string } | { bye: true };
export interface BMatch {
  id: string;
  /** W = winners bracket, L = losers bracket (double elimination), F = grand final. */
  br: 'W' | 'L' | 'F';
  round: number;
  idx: number;
  a: Slot;
  b: Slot;
  /** Optional scores, free text (e.g. "2", "1"). */
  sa?: string;
  sb?: string;
  win?: 'a' | 'b';
}
export interface Bracket { format: BFormat; players: string[]; matches: BMatch[]; /** ids of the matches being played right now (shown as LIVE); several can run at once */ cur?: string[] }

/** number = player index · 'bye' = empty seat · null = not decided yet. */
export type Who = number | 'bye' | null;
export interface Resolved { a: Who; b: Who; win: Who; lose: Who }

export const MAX_PLAYERS = 32;
const pow2 = (n: number) => { let s = 2; while (s < n) s *= 2; return s; };

/** Standard seeding order for a bracket of `size` seats: [1, size, ...] so strong seeds meet late. */
function seedOrder(size: number): number[] {
  let o = [1, 2];
  while (o.length < size) { const n = o.length * 2 + 1; o = o.flatMap((s) => [s, n - s]); }
  return o;
}

export function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Builds an empty bracket. Players are seeded in the given order (shuffle them first if you want a random draw). */
export function generate(format: BFormat, players: string[]): Bracket {
  const names = players.map((p) => p.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
  const n = names.length;
  const size = pow2(n);
  const k = Math.log2(size);
  const matches: BMatch[] = [];
  const add = (br: BMatch['br'], round: number, idx: number, a: Slot, b: Slot) => matches.push({ id: br === 'F' ? 'F-1' : `${br}${round}-${idx}`, br, round, idx, a, b });

  // Winners bracket
  const order = seedOrder(size);
  const seat = (seed: number): Slot => (seed <= n ? { p: seed - 1 } : { bye: true });
  for (let i = 1; i <= size / 2; i++) add('W', 1, i, seat(order[2 * i - 2]), seat(order[2 * i - 1]));
  for (let r = 2; r <= k; r++) for (let i = 1; i <= size / 2 ** r; i++) add('W', r, i, { w: `W${r - 1}-${2 * i - 1}` }, { w: `W${r - 1}-${2 * i}` });

  if (format === 'single') return { format, players: names, matches };

  // Losers bracket: round 1 = losers of W1 meet; then (drop round: vs losers of W(j+1)) and (consolidation) alternate.
  for (let i = 1; i <= size / 4; i++) add('L', 1, i, { l: `W1-${2 * i - 1}` }, { l: `W1-${2 * i}` });
  for (let j = 1; j <= k - 1; j++) {
    const drop = 2 * j;
    for (let i = 1; i <= size / 2 ** (j + 1); i++) add('L', drop, i, { w: `L${drop - 1}-${i}` }, { l: `W${j + 1}-${i}` });
    if (j < k - 1) for (let i = 1; i <= size / 2 ** (j + 2); i++) add('L', drop + 1, i, { w: `L${drop}-${2 * i - 1}` }, { w: `L${drop}-${2 * i}` });
  }
  add('F', 1, 1, { w: `W${k}-1` }, { w: `L${2 * k - 2}-1` });
  return { format, players: names, matches };
}

/** Works out who is in every match (byes advance automatically). */
export function resolve(br: Bracket): Map<string, Resolved> {
  const M = new Map<string, Resolved>();
  const who = (s: Slot): Who => ('p' in s ? s.p : 'bye' in s ? 'bye' : 'w' in s ? M.get(s.w)?.win ?? null : M.get(s.l)?.lose ?? null);
  for (const m of br.matches) {
    const a = who(m.a), b = who(m.b);
    let win: Who = null, lose: Who = null;
    if (a === 'bye' && b === 'bye') { win = 'bye'; lose = 'bye'; }
    else if (a === 'bye') { win = b; lose = 'bye'; }
    else if (b === 'bye') { win = a; lose = 'bye'; }
    else if (m.win && a !== null && b !== null) { win = m.win === 'a' ? a : b; lose = m.win === 'a' ? b : a; }
    M.set(m.id, { a, b, win, lose });
  }
  return M;
}

/** Matches whose players depend (directly or not) on the result of `id`. */
function dependents(br: Bracket, id: string): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const m of br.matches) {
      const dep = ('w' in m.a && m.a.w === cur) || ('l' in m.a && m.a.l === cur) || ('w' in m.b && m.b.w === cur) || ('l' in m.b && m.b.l === cur);
      if (dep && !out.has(m.id)) { out.add(m.id); stack.push(m.id); }
    }
  }
  return out;
}

/** Sets (or, with side = undefined, clears) the winner of a match. Results that depended on it are cleared. */
export function setWinner(br: Bracket, id: string, side?: 'a' | 'b'): Bracket {
  const m0 = br.matches.find((m) => m.id === id);
  if (!m0) return br;
  const clear = m0.win !== side ? dependents(br, id) : new Set<string>();
  // A decided match is no longer "current" (and neither is one whose result was just cleared downstream).
  // A decided match is no longer "current", and neither is anything whose result was just cleared downstream.
  const cur = (br.cur ?? []).filter((c) => !(c === id && side) && !clear.has(c));
  return { ...br, cur: cur.length ? cur : undefined, matches: br.matches.map((m) => (m.id === id ? { ...m, win: side } : clear.has(m.id) ? { ...m, win: undefined, sa: undefined, sb: undefined } : m)) };
}

export const isCurrent = (br: Bracket, id: string) => !!br.cur?.includes(id);
export function toggleCurrent(br: Bracket, id: string): Bracket {
  const cur = isCurrent(br, id) ? br.cur!.filter((c) => c !== id) : [...(br.cur ?? []), id];
  return { ...br, cur: cur.length ? cur : undefined };
}

export function setScore(br: Bracket, id: string, sa: string, sb: string): Bracket {
  return { ...br, matches: br.matches.map((m) => (m.id === id ? { ...m, sa: sa || undefined, sb: sb || undefined } : m)) };
}

/** The tournament champion (winner of the last match), if decided. */
export function champion(br: Bracket): number | null {
  const last = br.matches.find((m) => m.br === 'F') ?? br.matches.filter((m) => m.br === 'W').sort((x, y) => y.round - x.round)[0];
  const w = last ? resolve(br).get(last.id)?.win : null;
  return typeof w === 'number' ? w : null;
}

/** Matches grouped as sections → rounds (for drawing). */
export function layout(br: Bracket) {
  const rounds = (b: 'W' | 'L') => {
    const rs = [...new Set(br.matches.filter((m) => m.br === b).map((m) => m.round))].sort((x, y) => x - y);
    return rs.map((r) => br.matches.filter((m) => m.br === b && m.round === r).sort((x, y) => x.idx - y.idx));
  };
  return { winners: rounds('W'), losers: rounds('L'), final: br.matches.find((m) => m.br === 'F') };
}

/** Short label for an undecided slot, e.g. "W2-1" → winner/loser of that match. */
export const slotRef = (s: Slot): string => ('w' in s ? `W:${s.w}` : 'l' in s ? `L:${s.l}` : '');
