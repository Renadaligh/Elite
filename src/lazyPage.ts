/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type ComponentType } from 'react';

const KEY = 'plato-chunk-reload-at';

/** Reloads the page, but at most once every 30 seconds (so a file that really is missing can never make it loop). Returns true when a reload was started. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY)) || 0;
    if (Date.now() - last < 30000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch { return false; } // no storage (private mode): no way to guard against a loop, so no reload
  window.location.reload();
  return true;
}

/** The error a visitor gets when the site was updated while the old one was still open: the page's file is gone (or answered with the home page). */
export const isStaleFile = (e: unknown) => /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|Loading chunk|ChunkLoadError|MIME type|error loading dynamically/i.test(String((e as Error | undefined)?.message ?? e));

/** React.lazy that survives a new deploy: if the page's file is gone (the visitor still has the old site open), reload to pick up the new one instead of showing an error. It can do that again after 30 seconds, so a long-open tab heals after every update, not only the first. */
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try { return await load(); }
    catch (e) {
      if (reloadOnce()) return new Promise<never>(() => undefined);
      throw e;
    }
  });
}
