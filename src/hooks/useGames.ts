import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getGamesSnapshot, setGameRows, subscribeGames, type GameRow } from '../data/games';
import { api } from '../services/api';

let started = false;
let last = '';
const CACHE = 'plato-games-cache-v1';

/** The last list we got is kept on the device: the carousel paints at once with the right pictures while the fresh list loads. */
function hydrate() {
  try {
    const raw = localStorage.getItem(CACHE);
    if (!raw) return;
    const rows = JSON.parse(raw) as GameRow[];
    if (!Array.isArray(rows)) return;
    last = raw; setGameRows(rows);
    preload(rows);
  } catch { /* no cache */ }
}
/** Starts downloading the first few covers before the carousel has even rendered. */
function preload(rows: GameRow[]) {
  rows.filter((r) => r.image && !r.hidden && !r.tournamentOnly && r.id !== '__meta').slice(0, 3).forEach((r, i) => {
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = r.image; if (i === 0) l.setAttribute('fetchpriority', 'high');
    document.head.appendChild(l);
  });
}
hydrate();

const load = () => api<GameRow[]>('/games').then((rows) => {
  const j = JSON.stringify(rows);
  if (j !== last) { last = j; setGameRows(rows); try { localStorage.setItem(CACHE, j); } catch { /* storage full or private mode */ } } // only re-render when something changed
});
/** Loads the dashboard-managed games, then refreshes silently (every 30 s and when the tab becomes visible again), like news and tournaments. */
export function useGames() {
  useEffect(() => {
    if (started) return;
    started = true;
    load().catch(() => { started = false; });
    const tick = () => { if (document.visibilityState === 'visible') load().catch(() => undefined); };
    window.setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
  }, []);
  return useSyncExternalStore(subscribeGames, getGamesSnapshot);
}

/** The games shown on the site (Games section, Game of the day): everything except tournament-only games. */
export function useSiteGames() {
  const all = useGames();
  return useMemo(() => all.filter((g) => !g.tournamentOnly), [all]);
}
