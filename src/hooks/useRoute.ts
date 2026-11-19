import { useEffect, useState } from 'react';
import { appPath, BASE, go, goSection, takeAnchor, upgradeLegacyHash } from './nav';

export type Route = { page: 'home' | 'news' | 'game' | 'tournament' | 'bracket' | 'view' | 'join' | 'admin'; id?: string; key: string };

/** Path routing: /news · /games/<id> · /bracket[/<id>] · /v/<id> (view) · /j/<id> (join) · /t/<id> (tournament) · /admin.
 *  Anything else (/, /#games, …) is the home page. The server answers every path with index.html. */
function parse(): Route {
  upgradeLegacyHash();
  const p = appPath();
  const seg = p.split('/').filter(Boolean);
  const id = seg[1] ? decodeURIComponent(seg[1]) : undefined;
  switch (seg[0]) {
    case 'admin': return { page: 'admin', key: 'admin' };
    case 'news': return { page: 'news', key: 'news' };
    case 'games': if (id) return { page: 'game', id, key: `game:${id}` }; break;
    case 'view': case 'v': if (id) return { page: 'view', id, key: `view:${id}` }; break;
    case 'join': case 'j': if (id) return { page: 'join', id, key: `join:${id}` }; break;
    case 'tournaments': case 't': if (id) return { page: 'tournament', id, key: `tournament:${id}` }; break;
    case 'bracket': return { page: 'bracket', id, key: `bracket:${id ?? ''}` };
  }
  return { page: 'home', key: 'home' };
}

/** Clicks on in-site links change the page without a reload; "#games"-style links from another page go home first. */
function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const raw = a.getAttribute('href') ?? '';
  if (raw.startsWith('/') && !raw.startsWith('//')) { e.preventDefault(); go(raw); }
  else if (raw.startsWith('#') && raw.length > 1) { e.preventDefault(); goSection(raw.slice(1)); }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const on = () => { const r = parse(); setRoute((p) => (p.key === r.key ? p : r)); };
    window.addEventListener('popstate', on);
    window.addEventListener('hashchange', on); // a hand-typed old "#/…" address
    window.addEventListener('plato:nav', on);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', on); window.removeEventListener('hashchange', on);
      window.removeEventListener('plato:nav', on); document.removeEventListener('click', onClick);
    };
  }, []);

  // After a page switch: new page starts at the top, or jumps to the in-page target (#games, …) once it has rendered.
  useEffect(() => {
    const id = takeAnchor() || window.location.hash.slice(1);
    const target = id && id !== 'top' ? document.getElementById(id) : null;
    if (target) target.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    else window.scrollTo({ left: 0, top: 0, behavior: 'instant' as ScrollBehavior });
    // an old "/#games" link: scroll there, then drop the hash from the address bar
    if (window.location.hash) window.history.replaceState(null, '', BASE + appPath() + window.location.search);
  }, [route.key]);

  return route;
}
