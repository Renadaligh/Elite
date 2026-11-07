import { useEffect, useSyncExternalStore } from 'react';
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
