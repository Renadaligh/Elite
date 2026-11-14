import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowIcon } from './icons';

/** Round "back to top" button: appears after scrolling down a screen. */
export default function BackToTop() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const up = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button" onClick={up} aria-label={t.toTop} tabIndex={show ? 0 : -1} aria-hidden={!show}
      className={`btn-primary btt fixed bottom-5 end-5 z-40 !h-12 !w-12 !gap-0 !p-0 transition-all duration-300 sm:bottom-8 sm:end-8 lg:!h-16 lg:!w-16 ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
    >
      <ArrowIcon className="h-5 w-5 -rotate-90 lg:h-7 lg:w-7" />
    </button>
  );
}
