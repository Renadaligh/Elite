import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { BRAND } from '../config/site';
import { translations, type Dict, type Lang } from './translations';

interface Ctx { lang: Lang; dir: 'ltr' | 'rtl'; t: Dict; setLang: (l: Lang) => void }
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (document.documentElement.lang === 'ar' ? 'ar' : 'en'));
  useEffect(() => {
    document.title = BRAND[lang];
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `plato-lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    const apply = () => {
      document.documentElement.lang = l;
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      try { localStorage.setItem('elite-lang', l); } catch { /* storage unavailable */ }
      setLangState(l);
    };
    // smooth switch: the browser cross-fades the old page into the new one (direction + texts change inside one frame); older browsers just switch
    type VT = { startViewTransition?: (cb: () => void) => unknown };
    const d = document as Document & VT;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (typeof d.startViewTransition === 'function' && !calm) d.startViewTransition(() => { flushSync(apply); });
    else apply();
  }, []);
  const value = useMemo<Ctx>(() => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', t: translations[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext);
  if (!c) throw new Error('useI18n must be used inside <I18nProvider>');
  return c;
}
