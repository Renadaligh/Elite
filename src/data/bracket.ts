/**
 * Tournament brackets (single / double elimination). The whole bracket is one JSON document stored with the tournament;
 * the dashboard does all the logic (generating, advancing winners) and the site only draws it.
 *
 * A match has two slots. A slot is a player (index into `players`), the winner/loser of another match, or a bye.
 * Who plays whom is *derived* by resolve(), so advancing a winner only means storing `win` on one match.
 */
export type BFormat = 'single' | 'double' | 'rr' | 'swiss' | 'ffa' | 'groups';
export const isLeague = (b: { format: BFormat }) => b.format === 'rr' || b.format === 'swiss';
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
/** League formats (round robin / swiss): points per result (Challonge defaults 1 / 0.5 / 0), swiss round count, round robin home-and-away. */
export interface LeagueOpts { win: number; draw: number; loss: number; rounds?: number; double?: boolean; /** groups: group count, how many advance per group, knockout type */ groups?: number; adv?: number; koFormat?: 'single' | 'double'; /** ffa: lower total is better (e.g. time / golf) */ low?: boolean }
export const defaultOpts = (format: BFormat, n: number): LeagueOpts => ({ win: 1, draw: 0.5, loss: 0, ...(format === 'swiss' ? { rounds: Math.max(1, Math.ceil(Math.log2(Math.max(2, n)))) } : format === 'ffa' ? { rounds: 3 } : format === 'groups' ? { groups: n >= 12 ? 4 : 2, adv: 2, koFormat: 'single' as const } : {}) });
/** Knockout stage of a groups tournament: `seed` = global player indexes in seed order; match slots index into `seed`. */
export interface Knockout { format: 'single' | 'double'; seed: number[]; matches: BMatch[] }
export interface Bracket { opts?: LeagueOpts; /** groups: player indexes per group */ groups?: number[][]; ko?: Knockout; /** ffa: fs[round][player] = score */ fs?: string[][]; format: BFormat; players: string[]; matches: BMatch[]; /** ids of the matches being played right now (shown as LIVE); several can run at once */ cur?: string[] }

/** number = player index · 'bye' = empty seat · null = not decided yet. */
export type Who = number | 'bye' | null;
export interface Resolved { a: Who; b: Who; win: Who; lose: Who }

export const MAX_PLAYERS = 4096; // no practical limit for members; this is only a safety net
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
export function generate(format: BFormat, players: string[], opts?: Partial<LeagueOpts>): Bracket {
  const names = players.map((p) => p.trim()).filter(Boolean).slice(0, format === 'rr' ? MAX_RR : MAX_PLAYERS);
  const n = names.length;
  if (format === 'ffa') return generateFfa(names, { ...defaultOpts('ffa', n), ...opts });
  if (format === 'groups') return generateGroups(names, { ...defaultOpts('groups', n), ...opts });
  if (format === 'rr') return generateRR(names, { ...defaultOpts('rr', n), ...opts });
  if (format === 'swiss') return generateSwiss(names, { ...defaultOpts('swiss', n), ...opts });
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

/** A bracket with fewer than 2 players is a draft: players are listed but nothing is drawn yet. Adding the 2nd player builds it. */
export const isDraft = (br: Bracket) => br.players.length < 2;
export function draftBracket(format: BFormat, players: string[] = [], opts?: Partial<LeagueOpts>): Bracket {
  const o = format === 'single' || format === 'double' ? undefined : { ...defaultOpts(format, players.length), ...opts };
  return { format, players: players.map((p) => p.trim()).filter(Boolean), matches: [], ...(o ? { opts: o } : {}) };
}
/** Has anything been played / scored / marked live yet? (Adding players after that clears the results.) */
export function hasResults(br: Bracket): boolean {
  const played = (m: BMatch) => !!m.win || !!m.sa || !!m.sb;
  return br.matches.some(played) || !!br.ko?.matches.some(played) || !!br.fs?.some((r) => r.some((v) => v !== '' && v != null)) || !!br.cur?.length;
}
/** Adds players (new names only) and redraws. Keeps the seeding order and the rules. Only call it when there are no results, or after the user agreed to clear them. */
export function addPlayers(br: Bracket, add: string[]): Bracket {
  const have = new Set(br.players.map((p) => p.trim().toLowerCase()));
  const fresh: string[] = [];
  for (const n of add.map((a) => a.trim()).filter(Boolean)) { const k = n.toLowerCase(); if (!have.has(k)) { have.add(k); fresh.push(n); } }
  const players = [...br.players, ...fresh];
  const keep = br.opts ? { win: br.opts.win, draw: br.opts.draw, loss: br.opts.loss, double: br.opts.double, koFormat: br.opts.koFormat, low: br.opts.low, ...(br.format === 'ffa' ? { rounds: br.opts.rounds } : {}) } : undefined;
  return players.length < 2 ? draftBracket(br.format, players, keep) : generate(br.format, players, keep);
}

/** A match with an empty seat (BYE): nothing is played, so every view hides it and lets the player simply wait in the next round. */
export const hasBye = (R: Map<string, Resolved>, id: string) => { const r = R.get(id); return !!r && (r.a === 'bye' || r.b === 'bye'); };

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

/** Swaps two first-round seats (a player or a bye). Only while neither match has a result; scores of those matches are cleared. */
export interface SeatRef { id: string; side: 'a' | 'b' }
export function swapSeats(br: Bracket, x: SeatRef, y: SeatRef): Bracket | null {
  const mx = br.matches.find((m) => m.id === x.id), my = br.matches.find((m) => m.id === y.id);
  if (!mx || !my || mx.win || my.win) return null;
  const sx = mx[x.side], sy = my[y.side];
  const seat = (v: Slot) => 'p' in v || 'bye' in v;
  if (!seat(sx) || !seat(sy)) return null;
  const clr = (m: BMatch): BMatch => ({ ...m, sa: undefined, sb: undefined });
  return { ...br, matches: br.matches.map((m) => {
    if (m.id === mx.id && m.id === my.id) return clr({ ...m, [x.side]: sy, [y.side]: sx });
    if (m.id === mx.id) return clr({ ...m, [x.side]: sy });
    if (m.id === my.id) return clr({ ...m, [y.side]: sx });
    return m;
  }) };
}

export const isCurrent = (br: Bracket, id: string) => !!br.cur?.includes(id);
export function toggleCurrent(br: Bracket, id: string): Bracket {
  const cur = isCurrent(br, id) ? br.cur!.filter((c) => c !== id) : [...(br.cur ?? []), id];
  return { ...br, cur: cur.length ? cur : undefined };
}

/** Rename one player (everywhere they appear). Empty names are ignored. */
export function renamePlayer(br: Bracket, i: number, name: string): Bracket {
  const v = name.trim().slice(0, 40);
  if (!v || i < 0 || i >= br.players.length || br.players[i] === v) return br;
  return { ...br, players: br.players.map((p, k) => (k === i ? v : p)) };
}

export function setScore(br: Bracket, id: string, sa: string, sb: string): Bracket {
  return { ...br, matches: br.matches.map((m) => (m.id === id ? { ...m, sa: sa || undefined, sb: sb || undefined } : m)) };
}

/** The tournament champion (winner of the last match), if decided. */
export function champion(br: Bracket): number | null {
  if (isDraft(br)) return null;
  if (isLeague(br)) return leagueChampion(br);
  if (br.format === 'ffa') return ffaChampion(br);
  if (br.format === 'groups') { const k = koSub(br); const w = k ? champion(k) : null; return w === null || !br.ko ? null : br.ko.seed[w]; }
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


/* ---------------- League formats: round robin + swiss ---------------- */
export const MAX_RR = 16;

const pl = (i: number): Slot => ({ p: i });
const BYE: Slot = { bye: true };

/** Round robin (circle method). A bye seat is added when the number of players is odd. */
function generateRR(names: string[], opts: LeagueOpts): Bracket {
  const n = names.length;
  const ids: (number | null)[] = names.map((_, i) => i);
  if (n % 2) ids.push(null);
  const m = ids.length, half = m / 2;
  const matches: BMatch[] = [];
  const legs = opts.double ? 2 : 1;
  let round = 0;
  for (let leg = 0; leg < legs; leg++) {
    let arr = [...ids];
    for (let r = 0; r < m - 1; r++) {
      round++;
      for (let i = 0; i < half; i++) {
        let a = arr[i], b = arr[m - 1 - i];
        if ((leg === 1) !== (r % 2 === 1 && i === 0)) [a, b] = [b, a]; // alternate sides a little, swap in the return leg
        matches.push({ id: `R${round}-${i + 1}`, br: 'W', round, idx: i + 1, a: a === null ? BYE : pl(a), b: b === null ? BYE : pl(b) });
      }
      arr = [arr[0], arr[m - 1], ...arr.slice(1, m - 1)];
    }
  }
  return { format: 'rr', players: names, matches, opts };
}

/** Standings from the entered scores. Order: points, score difference, score for, wins. */
export interface Standing { p: number; played: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }
export function outcome(br: Bracket, m: BMatch): 'a' | 'b' | 'draw' | null {
  if (!isLeague(br)) return m.win ?? null;
  if ('bye' in m.a && 'bye' in m.b) return null;
  if ('bye' in m.b) return 'a';
  if ('bye' in m.a) return 'b';
  const a = m.sa !== undefined && m.sa !== '' ? Number(m.sa) : NaN, b = m.sb !== undefined && m.sb !== '' ? Number(m.sb) : NaN;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a > b ? 'a' : b > a ? 'b' : 'draw';
}
export function standings(br: Bracket): Standing[] {
  const o = br.opts ?? defaultOpts(br.format, br.players.length);
  const S: Standing[] = br.players.map((_, p) => ({ p, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
  for (const m of br.matches) {
    const r = outcome(br, m); if (!r) continue;
    if (br.format === 'rr' && ('bye' in m.a || 'bye' in m.b)) continue; // resting in a round robin is not a win
    const a = 'p' in m.a ? S[m.a.p] : null, b = 'p' in m.b ? S[m.b.p] : null;
    const sa = Number(m.sa) || 0, sb = Number(m.sb) || 0;
    const isBye = !a || !b;
    for (const [x, side] of [[a, 'a'], [b, 'b']] as const) {
      if (!x) continue;
      x.played++;
      if (!isBye) { x.gf += side === 'a' ? sa : sb; x.ga += side === 'a' ? sb : sa; }
      if (r === 'draw') { x.d++; x.pts += o.draw; } else if (r === side) { x.w++; x.pts += o.win; } else { x.l++; x.pts += o.loss; }
    }
  }
  return S.sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || y.w - x.w || x.p - y.p);
}

export const leagueRounds = (br: Bracket) => [...new Set(br.matches.map((m) => m.round))].sort((a, b) => a - b);
export const roundMatches = (br: Bracket, r: number) => br.matches.filter((m) => m.round === r).sort((a, b) => a.idx - b.idx);
export const roundDone = (br: Bracket, r: number) => roundMatches(br, r).every((m) => outcome(br, m) !== null || ('bye' in m.a && 'bye' in m.b));
export const leagueDone = (br: Bracket) => br.matches.every((m) => outcome(br, m) !== null) && (br.format === 'rr' || leagueRounds(br).length >= (br.opts?.rounds ?? 1));
export const leagueChampion = (br: Bracket): number | null => (leagueDone(br) ? standings(br)[0]?.p ?? null : null);

/** Swiss pairing: same-points players meet, nobody meets the same opponent twice, the odd player out gets a bye (once each). */
function pairSwiss(br: Bracket, round: number): BMatch[] {
  const st = standings(br);
  const order = st.map((s) => s.p);
  const met = new Set<string>();
  const hadBye = new Set<number>();
  for (const m of br.matches) {
    if ('p' in m.a && 'p' in m.b) { met.add(`${m.a.p}-${m.b.p}`); met.add(`${m.b.p}-${m.a.p}`); }
    else if ('p' in m.a) hadBye.add(m.a.p); else if ('p' in m.b) hadBye.add(m.b.p);
  }
  let bye: number | null = null;
  let pool = order;
  if (order.length % 2) {
    bye = [...order].reverse().find((p) => !hadBye.has(p)) ?? order[order.length - 1];
    pool = order.filter((p) => p !== bye);
  }
  const pairs: [number, number][] = [];
  const go = (left: number[]): boolean => {
    if (!left.length) return true;
    const [a, ...rest] = left;
    for (let i = 0; i < rest.length; i++) {
      const b = rest[i];
      if (met.has(`${a}-${b}`)) continue;
      pairs.push([a, b]);
      if (go(rest.filter((_, j) => j !== i))) return true;
      pairs.pop();
    }
    return false;
  };
  if (!go(pool)) { pairs.length = 0; for (let i = 0; i < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]); } // no rematch-free pairing exists: pair by rank
  const out: BMatch[] = pairs.map(([a, b], i) => ({ id: `R${round}-${i + 1}`, br: 'W', round, idx: i + 1, a: pl(a), b: pl(b) }));
  if (bye !== null) out.push({ id: `R${round}-${out.length + 1}`, br: 'W', round, idx: out.length + 1, a: pl(bye), b: BYE });
  return out;
}

/** Swiss round 1: top half meets bottom half by seed. */
function generateSwiss(names: string[], opts: LeagueOpts): Bracket {
  const n = names.length, half = Math.floor(n / 2);
  const matches: BMatch[] = [];
  for (let i = 0; i < half; i++) matches.push({ id: `R1-${i + 1}`, br: 'W', round: 1, idx: i + 1, a: pl(i), b: pl(i + half + (n % 2)) });
  if (n % 2) matches.push({ id: `R1-${half + 1}`, br: 'W', round: 1, idx: half + 1, a: pl(half), b: BYE });
  return { format: 'swiss', players: names, matches, opts };
}

/** Adds the next swiss round (only once the current one is fully scored and rounds remain). */
export function nextSwissRound(br: Bracket): Bracket | null {
  if (br.format !== 'swiss') return null;
  const rs = leagueRounds(br), last = rs[rs.length - 1] ?? 0;
  if (!roundDone(br, last) || last >= (br.opts?.rounds ?? 1)) return null;
  return { ...br, matches: [...br.matches, ...pairSwiss(br, last + 1)] };
}

/** Enters a league score. A scored match stops being "current". */
export function setLeagueScore(br: Bracket, id: string, sa: string, sb: string): Bracket {
  const next = { ...br, matches: br.matches.map((m) => (m.id === id ? { ...m, sa: sa || undefined, sb: sb || undefined } : m)) };
  const m = next.matches.find((i) => i.id === id)!;
  if (outcome(next, m) && next.cur?.includes(id)) { const cur = next.cur.filter((c) => c !== id); next.cur = cur.length ? cur : undefined; }
  return next;
}
/** Swiss: drops the last round (to redo a pairing). */
export function dropLastRound(br: Bracket): Bracket {
  const rs = leagueRounds(br), last = rs[rs.length - 1];
  if (br.format !== 'swiss' || rs.length < 2) return br;
  const matches = br.matches.filter((m) => m.round !== last), ids = new Set(matches.map((m) => m.id));
  const cur = (br.cur ?? []).filter((c) => ids.has(c));
  return { ...br, matches, cur: cur.length ? cur : undefined };
}


/* ---------------- Leaderboard (free-for-all): everyone scores in every round ---------------- */
function generateFfa(names: string[], opts: LeagueOpts): Bracket {
  const rounds = Math.min(30, Math.max(1, Math.round(opts.rounds ?? 3)));
  return { format: 'ffa', players: names, matches: [], opts: { ...opts, rounds }, fs: Array.from({ length: rounds }, () => names.map(() => '')) };
}
const num0 = (v: string | undefined) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
export interface FfaRow { p: number; total: number; played: number; best: number | null }
export function ffaRows(br: Bracket): FfaRow[] {
  const low = !!br.opts?.low;
  const rows = br.players.map((_, p) => {
    const vals = (br.fs ?? []).map((r) => num0(r[p])).filter((v): v is number => v !== null);
    return { p, total: vals.reduce((a, b) => a + b, 0), played: vals.length, best: vals.length ? (low ? Math.min(...vals) : Math.max(...vals)) : null };
  });
  return rows.sort((a, b) => (low ? a.total - b.total : b.total - a.total) || (b.played - a.played) || a.p - b.p);
}
export const ffaDone = (br: Bracket) => !!br.fs?.length && br.fs.every((r) => br.players.every((_, p) => num0(r[p]) !== null));
export const ffaChampion = (br: Bracket): number | null => (ffaDone(br) ? ffaRows(br)[0]?.p ?? null : null);
export function setFfaScore(br: Bracket, round: number, p: number, v: string): Bracket {
  return { ...br, fs: (br.fs ?? []).map((r, i) => (i === round ? r.map((x, j) => (j === p ? v.slice(0, 6) : x)) : r)) };
}
export function addFfaRound(br: Bracket): Bracket {
  if ((br.fs?.length ?? 0) >= 30) return br;
  return { ...br, fs: [...(br.fs ?? []), br.players.map(() => '')], opts: { ...(br.opts as LeagueOpts), rounds: (br.fs?.length ?? 0) + 1 } };
}
export function dropFfaRound(br: Bracket): Bracket {
  if ((br.fs?.length ?? 0) < 2) return br;
  return { ...br, fs: br.fs!.slice(0, -1), opts: { ...(br.opts as LeagueOpts), rounds: br.fs!.length - 1 } };
}

/* ---------------- Two stages: groups (round robin) then a knockout bracket ---------------- */
export const MAX_GROUPS = 8;
function generateGroups(names: string[], opts: LeagueOpts): Bracket {
  const n = names.length;
  const G = Math.min(MAX_GROUPS, Math.max(2, Math.floor(opts.groups ?? 2)), Math.max(2, Math.floor(n / 2)));
  const adv = Math.max(1, Math.min(Math.floor(opts.adv ?? 2), Math.floor(n / G)));
  const groups: number[][] = Array.from({ length: G }, () => []);
  // snake seeding: strongest players are spread over the groups
  for (let i = 0; i < n; i++) { const row = Math.floor(i / G), col = i % G; groups[row % 2 ? G - 1 - col : col].push(i); }
  const matches: BMatch[] = [];
  groups.forEach((members, g) => {
    const rr = generateRR(members.map((i) => names[i]), { ...opts, double: false });
    for (const m of rr.matches) {
      const map = (sl: Slot): Slot => ('p' in sl ? { p: members[sl.p] } : sl);
      matches.push({ ...m, id: `G${g + 1}${m.id}`, a: map(m.a), b: map(m.b) });
    }
  });
  return { format: 'groups', players: names, groups, matches, opts: { ...opts, groups: G, adv, koFormat: opts.koFormat ?? 'single' } };
}
export const groupLabel = (g: number) => String.fromCharCode(65 + g);
/** A group as its own little round robin (local player indexes) so the league table / cards can be reused. */
export function groupSub(br: Bracket, g: number): Bracket {
  const members = br.groups![g], local = new Map(members.map((p, i) => [p, i]));
  const map = (sl: Slot): Slot => ('p' in sl ? { p: local.get(sl.p) ?? 0 } : sl);
  const pre = `G${g + 1}`;
  const matches = br.matches.filter((m) => m.id.startsWith(`${pre}R`)).map((m) => ({ ...m, a: map(m.a), b: map(m.b) }));
  const ids = new Set(matches.map((m) => m.id));
  const cur = (br.cur ?? []).filter((c) => ids.has(c));
  return { format: 'rr', players: members.map((p) => br.players[p]), matches, opts: br.opts, cur: cur.length ? cur : undefined };
}
export function groupMerge(br: Bracket, g: number, sub: Bracket): Bracket {
  const by = new Map(sub.matches.map((m) => [m.id, m]));
  const ids = new Set(sub.matches.map((m) => m.id));
  const cur = [...(br.cur ?? []).filter((c) => !ids.has(c)), ...(sub.cur ?? [])];
  return { ...br, cur: cur.length ? cur : undefined, matches: br.matches.map((m) => { const x = by.get(m.id); return x ? { ...m, sa: x.sa, sb: x.sb } : m; }) };
}
export function groupRank(br: Bracket, g: number): number[] {
  const members = br.groups![g];
  return standings(groupSub(br, g)).map((s) => members[s.p]);
}
export const groupDone0 = (br: Bracket, g: number) => { const sb = groupSub(br, g); return sb.matches.every((m) => outcome(sb, m) !== null); };
export const groupsDone = (br: Bracket) => br.groups!.every((_, g) => groupSub(br, g).matches.every((m) => outcome(groupSub(br, g), m) !== null));
/** Knockout seeds: all group winners, then all runners-up, ... (so groupmates do not meet in round 1 when possible). */
export function koSeed(br: Bracket): number[] {
  const adv = br.opts?.adv ?? 2, ranks = br.groups!.map((_, g) => groupRank(br, g));
  const seed: number[] = [];
  for (let t = 0; t < adv; t++) for (const r of ranks) if (r[t] !== undefined) seed.push(r[t]);
  return seed;
}
export function startKnockout(br: Bracket): Bracket | null {
  if (br.format !== 'groups' || br.ko || !groupsDone(br)) return null;
  const seed = koSeed(br);
  if (seed.length < 2) return null;
  const kf = br.opts?.koFormat ?? 'single';
  const k = generate(kf, seed.map((_, i) => String(i)));
  return { ...br, ko: { format: kf, seed, matches: k.matches } };
}
export function dropKnockout(br: Bracket): Bracket {
  if (!br.ko) return br;
  const ids = new Set(br.ko.matches.map((m) => m.id));
  const cur = (br.cur ?? []).filter((c) => !ids.has(c));
  return { ...br, ko: undefined, cur: cur.length ? cur : undefined };
}
/** The knockout as a normal bracket (names looked up from the seed), or null before it starts. */
export function koSub(br: Bracket): Bracket | null {
  if (!br.ko) return null;
  const ids = new Set(br.ko.matches.map((m) => m.id));
  const cur = (br.cur ?? []).filter((c) => ids.has(c));
  return { format: br.ko.format, players: br.ko.seed.map((p) => br.players[p]), matches: br.ko.matches, cur: cur.length ? cur : undefined };
}
export function koMerge(br: Bracket, sub: Bracket): Bracket {
  if (!br.ko) return br;
  const ids = new Set(br.ko.matches.map((m) => m.id));
  const cur = [...(br.cur ?? []).filter((c) => !ids.has(c)), ...(sub.cur ?? [])];
  return { ...br, ko: { ...br.ko, matches: sub.matches }, cur: cur.length ? cur : undefined };
}

/** Matches being played right now, as names (for the tournament page banner). Works for every format. */
export function liveMatches(br: Bracket): { a: string; b: string }[] {
  const out: { a: string; b: string }[] = [];
  const add = (b: Bracket) => {
    const R = resolve(b);
    for (const m of b.matches) {
      if (!isCurrent(b, m.id) || outcome(b, m) !== null && isLeague(b)) continue;
      const r = R.get(m.id);
      if (!r || (!isLeague(b) && m.win) || typeof r.a !== 'number' || typeof r.b !== 'number') continue;
      out.push({ a: b.players[r.a], b: b.players[r.b] });
    }
  };
  if (br.format === 'groups') { br.groups!.forEach((_, g) => add(groupSub(br, g))); const k = koSub(br); if (k) add(k); }
  else if (br.format !== 'ffa') add(br);
  return out;
}
