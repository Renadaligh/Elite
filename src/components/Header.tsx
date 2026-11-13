import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { NAV } from '../config/site';
import BrandLockup from './BrandLockup';
import HeroThemeToggle from './HeroThemeToggle';
import { CloseIcon, MenuIcon } from './icons';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header({ page }: { page: 'home' | 'news' | 'game' | 'tournament' | 'bracket' | 'admin' }) {
  const { t, dir, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('#top');
  const burger = useRef<HTMLButtonElement>(null);
  // After a nav click the page scrolls past other sections; ignore the scroll-spy until it settles so the clicked item stays selected.
  const lockUntil = useRef(0);
  const pick = (href: string) => { setActive(href); lockUntil.current = Date.now() + 1000; };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (page !== 'home') { setActive(page === 'news' ? '#news' : page === 'bracket' ? '#/bracket' : page === 'tournament' ? '#tournaments' : '#games'); return; }
    setActive('#top');
    const els = NAV.map((n) => document.getElementById(n.href.slice(1))).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => { if (Date.now() < lockUntil.current) return; es.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)); }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [page]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); burger.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Transparent over the hero (soft dark fade behind the text); becomes dark glass once scrolled or when the mobile menu is open.
  const solid = scrolled || open;
  return (
    <header data-solid={solid} className="hdr fixed inset-x-0 top-0 z-50">
      <div dir="ltr" className="flex items-center justify-between gap-4 px-[clamp(1rem,4vw,3.5rem)] py-3 sm:py-4">
        <BrandLockup collapsed={!solid} />
        <nav dir={dir} aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-[clamp(1rem,2.2vw,2.1rem)]">
            {NAV.map((n) => {
              const on = active === n.href;
              return (
                <li key={n.href}>
                  <a href={n.href} onClick={() => pick(n.href)} aria-current={on ? 'page' : undefined} className="border-b-2 py-1.5 text-[1.05rem] rtl:font-bold transition-colors hover:text-[var(--text)]" style={{ color: on ? 'var(--text)' : 'var(--muted)', borderColor: on ? 'var(--link-on)' : 'transparent' }}>
                    {t[n.key]}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <HeroThemeToggle />
          <LanguageSwitcher />
          <button ref={burger} type="button" className="pill !px-0 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t.closeMenu : t.menu}>
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t px-[clamp(1rem,4vw,3.5rem)] pb-4 pt-2 lg:hidden" style={{ borderColor: 'var(--glass-b)' }}>
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.href}><a href={n.href} onClick={() => { pick(n.href); setOpen(false); }} className="block py-3 text-lg rtl:font-bold" style={{ color: active === n.href ? 'var(--text)' : 'var(--muted)' }}>{t[n.key]}</a></li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
