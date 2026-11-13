import { useEffect, useState } from 'react';

/** Phones only: the slogan words are typed and erased one at a time, so the heading takes one line instead of three. */
export function useTypedHeading(words: string[], query: string) {
  const [on, setOn] = useState(false);
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const key = words.join('|');
  useEffect(() => {
    const mq = window.matchMedia(query), rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOn(mq.matches && !rm.matches);
    sync(); mq.addEventListener('change', sync); rm.addEventListener('change', sync);
    return () => { mq.removeEventListener('change', sync); rm.removeEventListener('change', sync); };
  }, [query]);
  useEffect(() => {
    if (!on) return;
    let i = 0, n = 0, dir = 1, timer = 0;
    const list = key.split('|');
    const tick = () => {
      const w = list[i];
      n += dir; setText(w.slice(0, n)); setIdx(i);
      let delay = dir > 0 ? 95 : 48;
      if (dir > 0 && n >= w.length) { dir = -1; delay = 1400; }
      else if (dir < 0 && n <= 0) { dir = 1; i = (i + 1) % list.length; delay = 300; }
      timer = window.setTimeout(tick, delay);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [on, key]);
  return { on, text, idx };
}
