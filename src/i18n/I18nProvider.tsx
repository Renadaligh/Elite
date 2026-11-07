import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BRAND } from '../config/site';
import { translations, type Dict, type Lang } from './translations';

interface Ctx { lang: Lang; dir: 'ltr' | 'rtl'; t: Dict; setLang: (l: Lang) => void }
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (document.documentElement.lang === 'ar' ? 'ar' : 'en'));
  useEffect(() => { document.title = BRAND[lang]; }, [lang]);
  const setLang = useCallback((l: Lang) => {
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('elite-lang', l); } catch { /* storage unavailable */ }
    setLangState(l);
  }, []);
  const value = useMemo<Ctx>(() => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', t: translations[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext);
  if (!c) throw new Error('useI18n must be used inside <I18nProvider>');
  return c;
}
