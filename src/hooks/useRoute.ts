import { useEffect, useState } from 'react';

export type Route = { page: 'home' | 'news' | 'game' | 'tournament' | 'bracket' | 'view' | 'admin'; id?: string; key: string };

/** Hash routing needs no server rewrites.
 *  #/news → all news · #/games/<id> → game page · anything else (#top, #games, …) → home. */
function parse(): Route {
  const h = window.location.hash;
  if (h.startsWith('#/admin')) return { page: 'admin', key: 'admin' };
  if (h.startsWith('#/news')) return { page: 'news', key: 'news' };
  const m = /^#\/games\/([^/?#]+)/.exec(h);
  if (m) { const id = decodeURIComponent(m[1]); return { page: 'game', id, key: `game:${id}` }; }
  const vm = /^#\/view\/([^/?#]+)/.exec(h);
  if (vm) { const id = decodeURIComponent(vm[1]); return { page: 'view', id, key: `view:${id}` }; }
  const bm = /^#\/bracket(?:\/([^/?#]+))?/.exec(h);
  if (bm) { const id = bm[1] ? decodeURIComponent(bm[1]) : undefined; return { page: 'bracket', id, key: `bracket:${id ?? ''}` }; }
  const tm = /^#\/tournaments\/([^/?#]+)/.exec(h);
  if (tm) { const id = decodeURIComponent(tm[1]); return { page: 'tournament', id, key: `tournament:${id}` }; }
  return { page: 'home', key: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const on = () => { const r = parse(); setRoute((p) => (p.key === r.key ? p : r)); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  // After a page switch: new page starts at the top, or jumps to the in-page target (#games, …) once it has rendered.
  useEffect(() => {
    const id = window.location.hash.startsWith('#/') ? '' : window.location.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    else window.scrollTo({ left: 0, top: 0, behavior: 'instant' as ScrollBehavior });
  }, [route.key]);

  return route;
}
