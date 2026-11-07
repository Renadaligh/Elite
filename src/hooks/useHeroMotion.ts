import { useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LAYERS } from '../config/artwork';

gsap.registerPlugin(ScrollTrigger);

/** Cinematic entrance + reversible scroll transition into the next section (no scroll hijacking). */
export function useHeroMotion(hero: RefObject<HTMLElement>) {
  const played = useRef(false);

  useLayoutEffect(() => {
    const root = hero.current;
    if (!root) return;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!played.current) {
        played.current = true;
        const header = document.querySelector('[data-anim="header"]');
        const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'all' } });
        tl.from('[data-anim="art"]', { opacity: 0, scale: 1.08, duration: 1.4, ease: 'power2.out' }, 0);
        if (header) tl.from(header, { opacity: 0, y: -16, duration: 0.7 }, 0.1);
        tl.from('.hero-desc', { opacity: 0, y: 18, duration: 0.55 }, 0.75)
          .from('.hero-cta > *', { opacity: 0, y: 16, duration: 0.5, stagger: 0.09 }, 0.95);
      }

      const st: ScrollTrigger.Vars = { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 };
      gsap.utils.toArray<HTMLElement>('[data-art-scroll]').forEach((el, i) => {
        gsap.to(el, { scale: 1 + (LAYERS[i]?.zoom ?? 0.1), y: 70, ease: 'none', scrollTrigger: st });
      });
      gsap.to('.hero-copy', { y: -80, opacity: 0.1, ease: 'none', scrollTrigger: st });
      gsap.to('.hero-veil', { opacity: 0.92, ease: 'none', scrollTrigger: st });
    }, root);

    return () => mm.revert();
  }, [hero]);
}
