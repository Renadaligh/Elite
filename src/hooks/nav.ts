/** Path routing helpers (no "#"). All paths here are app-relative ("/bracket/ab12cd34"); BASE is "" on the real site. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Current app-relative path ("/" for home). */
export function appPath(): string {
  const p = window.location.pathname;
  const r = BASE && p.startsWith(BASE) ? p.slice(BASE.length) : p;
  return r === '' ? '/' : r;
}

/** Moves to another page without a reload. `to` may carry ?query and #anchor. */
export function go(to: string, replace = false): void {
  const full = BASE + to;
  if (full !== window.location.pathname + window.location.search + window.location.hash) {
    if (replace) window.history.replaceState(null, '', full); else window.history.pushState(null, '', full);
  }
  window.dispatchEvent(new Event('plato:nav'));
}

/** Full address of an app path, e.g. https://plato-ar.com/j/ab12cd34. */
export const siteUrl = (p: string) => `${window.location.origin}${BASE}${p}`;

/** The address without "https://", which is how links are copied and shown. */
export const noProto = (u: string) => u.replace(/^https?:\/\//i, '');

/** Old links used "#/bracket/…": turns them into the new path form once, on load. */
export function upgradeLegacyHash(): void {
  const h = window.location.hash;
  if (h.startsWith('#/')) window.history.replaceState(null, '', BASE + h.slice(1));
}

/** Query value of the current page (e.g. ?login=…). */
export const query = (k: string) => new URLSearchParams(window.location.search).get(k);
