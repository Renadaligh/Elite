import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getGamesSnapshot, setGameRows, subscribeGames, type GameRow } from '../data/games';
import { api } from '../services/api';

let started = false;
/** Loads the dashboard-managed games once (the built-in list shows meanwhile / if the API is unavailable). */
export function useGames() {
  useEffect(() => {
    if (started) return;
    started = true;
    api<GameRow[]>('/games').then(setGameRows).catch(() => { started = false; });
  }, []);
  return useSyncExternalStore(subscribeGames, getGamesSnapshot);
}

/** The games shown on the site (Games section, Game of the day): everything except tournament-only games. */
export function useSiteGames() {
  const all = useGames();
  return useMemo(() => all.filter((g) => !g.tournamentOnly), [all]);
}
