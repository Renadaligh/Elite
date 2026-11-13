import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const KEY = 'plato-theme';
const META: Record<Theme, string> = { dark: '#0d0e22', light: '#f3f6ff' };

const current = (): Theme => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

function apply(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[t]);
}

/** Dark / light. The first visit follows the device setting (index.html applies it before paint); a manual choice is remembered. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(current);

  const setTheme = useCallback((t: Theme) => {
    apply(t);
    try { localStorage.setItem(KEY, t); } catch { /* storage unavailable */ }
    setThemeState(t);
  }, []);

  // Without a saved choice, keep following the device when it switches.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const on = () => {
      try { if (localStorage.getItem(KEY)) return; } catch { /* ignore */ }
      const t: Theme = mq.matches ? 'light' : 'dark';
      apply(t);
      setThemeState(t);
    };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return { theme, setTheme };
}
