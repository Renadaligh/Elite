import { useLayoutEffect, type RefObject } from 'react';
import { loadGsap } from '../lib/loadGsap';

/** Cards fade up as they enter the viewport (skipped for reduced motion; content stays visible without it).
 *  gsap loads on demand: until it is ready the cards wait hidden through the `cards-wait` class, so nothing flashes; if it fails they are simply shown. */
export function useCardsReveal(root: RefObject<HTMLElement>, active: boolean, deps: unknown[]) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true, revert: (() => void) | undefined;
    el.classList.add('cards-wait');
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (!alive) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.news-card', el);
        gsap.set(cards, { opacity: 0, y: 28 });
        el.classList.remove('cards-wait');
        ScrollTrigger.batch(cards, {
          start: 'top 92%', once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform' }),
        });
      }, el);
      revert = () => mm.revert();
    }).catch(() => el.classList.remove('cards-wait'));
    return () => { alive = false; revert?.(); el.classList.remove('cards-wait'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}
