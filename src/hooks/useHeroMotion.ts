import { useLayoutEffect, type RefObject } from 'react';
import { LAYERS } from '../config/artwork';
import { loadGsap } from '../lib/loadGsap';

/**
 * Hero motion. The entrance (picture, header, text, buttons) is plain CSS under `html.hero-on` (see index.css), so it needs no script and
 * the picture can paint as soon as the page does. The reversible scroll transition into the next section (no scroll hijacking) needs gsap,
 * which loads when the browser is idle, because nothing about it is visible until the visitor scrolls.
 */
export function useHeroMotion(hero: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const root = hero.current;
    if (!root) return;
    const html = document.documentElement;
    html.classList.add('hero-on');
    let alive = true, revert: (() => void) | undefined, idle = 0, timer = 0;
    const start = () => {
      loadGsap().then(({ gsap, ScrollTrigger }) => {
        if (!alive) return;
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
          const st: ScrollTrigger.Vars = { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 };
          gsap.utils.toArray<HTMLElement>('[data-art-scroll]').forEach((el, i) => {
            gsap.to(el, { scale: 1 + (LAYERS[i]?.zoom ?? 0.1), y: 70, ease: 'none', scrollTrigger: st });
          });
          gsap.to('.hero-copy', { y: -80, opacity: 0.1, ease: 'none', scrollTrigger: st });
          gsap.to('.hero-veil', { opacity: 0.92, ease: 'none', scrollTrigger: st });
        }, root);
        revert = () => mm.revert();
      }).catch(() => undefined); // the page works without the scroll effect
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) idle = w.requestIdleCallback(start, { timeout: 2500 }); else timer = window.setTimeout(start, 800);
    return () => {
      alive = false;
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      revert?.();
      html.classList.remove('hero-on');
    };
  }, [hero]);
}
