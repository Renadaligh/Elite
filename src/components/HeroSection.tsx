import { useEffect, useRef } from 'react';
import { useHeroMotion } from '../hooks/useHeroMotion';
import { usePointerParallax } from '../hooks/usePointerParallax';
import ArtLayers from './ArtLayers';
import HeroContent from './HeroContent';
import { useI18n } from '../i18n/I18nProvider';

export default function HeroSection() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  usePointerParallax(heroRef);
  useHeroMotion(heroRef);

  // Pause continuous animation while the hero is off-screen.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-paused', !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="top" ref={heroRef} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <ArtLayers />
      {/* soft top shade keeps the glass header readable over the bright footage */}
      <div className="hero-topshade pointer-events-none absolute inset-0" />
      {/* readability shades: a bottom fade on phones (copy sits under the artwork), a side fade on desktop (copy sits in the artwork's empty left) */}
      <div className="hero-shade pointer-events-none absolute inset-0" />
      <div className="hero-wrap relative z-10 flex flex-1 flex-col items-center justify-end px-[clamp(1.1rem,5vw,5rem)] pb-[max(4.4rem,8vh)] pt-28 md:justify-center md:px-[clamp(2.5rem,6.3vw,7rem)] md:pb-[8vh] md:pt-[10vh]">
        <HeroContent />
      </div>
      <div className="hero-veil pointer-events-none absolute inset-0 z-[8] opacity-0" style={{ backgroundColor: 'var(--bg)' }} />
      <div className="hero-bottomfade pointer-events-none absolute inset-x-0 bottom-0 z-[9]" />
      <a href="#news" aria-label={t.scrollDown} className="scroll-cue absolute bottom-5 left-1/2 z-[11] -translate-x-1/2 sm:bottom-7">
        <span className="scroll-cue-dot" />
      </a>
    </section>
  );
}
