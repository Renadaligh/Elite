import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { MoonIcon, SunIcon } from './icons';

type Mode = 'day' | 'night';
const KEY = 'plato-hero';

/** Switches the home-page hero between the day picture and the night picture. The choice is remembered on this device. */
export default function HeroThemeToggle() {
  const { lang } = useI18n();
  const [mode, setMode] = useState<Mode>(() => (document.documentElement.dataset.hero === 'night' ? 'night' : 'day'));
  useEffect(() => {
    document.documentElement.dataset.hero = mode;
    try { localStorage.setItem(KEY, mode); } catch { /* private mode */ }
  }, [mode]);
  const night = mode === 'night';
  const label = lang === 'ar' ? (night ? 'التبديل إلى النهار' : 'التبديل إلى الليل') : night ? 'Switch to day' : 'Switch to night';
  return (
    <button type="button" className="pill !px-0 w-[2.5rem]" onClick={() => setMode(night ? 'day' : 'night')} aria-label={label} title={label} aria-pressed={night}>
      {night ? <SunIcon className="h-[1.15rem] w-[1.15rem]" /> : <MoonIcon className="h-[1.15rem] w-[1.15rem]" />}
    </button>
  );
}
