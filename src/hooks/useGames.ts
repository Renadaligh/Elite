import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getGamesSnapshot, setGameRows, subscribeGames, type GameRow } from '../data/games';
import { api } from '../services/api';

let started = false;
let last = '';
const load = () => api<GameRow[]>('/games').then((rows) => {
  const j = JSON.stringify(rows);
  if (j !== last) { last = j; setGameRows(rows); } // only re-render when something changed
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
