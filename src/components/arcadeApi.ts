/**
 * Client for the weekly leaderboard (functions/api/arcade.ts).
 * If the API is unreachable (offline, or `vite dev` without Pages Functions) it falls back to a board kept in this browser,
 * so the game still works; those scores never reach other players.
 */
export interface Row { n: string; s: number }
export interface Board { rows: Row[]; endsAt: number; local: boolean }

const DAY = 86_400_000, RIYADH = 3 * 3_600_000;
const weekIndex = (t: number) => Math.floor(((t + RIYADH) / DAY - 2) / 7); // weeks start Saturday 00:00 Riyadh
const weekEnd = (w: number) => ((w + 1) * 7 + 2) * DAY - RIYADH;
const URL_ = '/api/arcade';

const lsKey = () => `plato-arcade-local-${weekIndex(Date.now())}`;
function readLocal(): Row[] {
  try { const v: unknown = JSON.parse(localStorage.getItem(lsKey()) ?? '[]'); return Array.isArray(v) ? (v as Row[]) : []; } catch { return []; }
}
function writeLocal(rows: Row[]) { try { localStorage.setItem(lsKey(), JSON.stringify(rows)); } catch { /* storage unavailable */ } }
const localBoard = (): Board => ({ rows: readLocal().sort((a, b) => b.s - a.s).slice(0, 10), endsAt: weekEnd(weekIndex(Date.now())), local: true });

/** `net` is false when the request never got an answer; a 4xx/5xx answer is `net: true` with `j: null`. */
async function call(init?: RequestInit): Promise<{ net: boolean; j: Record<string, unknown> | null }> {
  try {
    const r = await fetch(URL_, { ...init, headers: { 'content-type': 'application/json' } });
    if (r.status >= 500) return { net: false, j: null };
    if (!r.ok) return { net: true, j: null };
    const j: unknown = await r.json();
    return { net: true, j: j && typeof j === 'object' ? (j as Record<string, unknown>) : null };
  } catch { return { net: false, j: null }; }
}
const toBoard = (j: Record<string, unknown>): Board | null =>
  Array.isArray(j.rows) && typeof j.endsAt === 'number' ? { rows: j.rows as Row[], endsAt: j.endsAt, local: false } : null;

export async function loadBoard(): Promise<Board> {
  const { j } = await call();
  return (j && toBoard(j)) || localBoard();
}

/** Sends a finished game. Returns the player's rank and the refreshed board, or null if the score was refused. */
export async function submitScore(name: string, score: number, ms: number): Promise<{ rank: number; board: Board } | null> {
  const { net, j } = await call({ method: 'POST', body: JSON.stringify({ name, score, ms }) });
  const b = j && j.ok === true ? toBoard(j) : null;
  if (j && b && typeof j.rank === 'number') return { rank: j.rank, board: b };
  if (net) return null; // the server answered and refused (bad name, bad score, too many tries)
  // Offline fallback: keep the best score per name in this browser.
  const rows = readLocal(), key = name.toLowerCase(), f = rows.find((r) => r.n.toLowerCase() === key);
  if (f) { if (score > f.s) { f.s = score; f.n = name; } } else rows.push({ n: name, s: score });
  writeLocal(rows);
  const board = localBoard(), best = board.rows.find((r) => r.n.toLowerCase() === key)?.s ?? score;
  return { rank: board.rows.filter((r) => r.s > best).length + 1, board };
}
