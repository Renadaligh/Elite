/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type ComponentType } from 'react';

/** React.lazy that survives a new deploy: if the page's file is gone (the visitor still has the old site open), reload once to pick up the new one instead of showing a blank page. */
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try { return await load(); }
    catch (e) {
      let tried = false;
      try { tried = sessionStorage.getItem('plato-chunk-reload') === '1'; sessionStorage.setItem('plato-chunk-reload', '1'); } catch { /* private mode */ }
      if (!tried) { window.location.reload(); return new Promise<never>(() => undefined); }
      throw e;
    }
  });
}
