import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Bracket } from '../data/bracket';
import BracketTreeSvg, { treeGeometry } from './BracketTreeSvg';

export default function BracketSheet({ bracket, title, lang }: { bracket: Bracket; title: string; lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const wrap = useRef<HTMLDivElement>(null);
  const scr = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  const [phone, setPhone] = useState(false);

  const g = useMemo(() => treeGeometry(bracket, ar), [bracket, ar]);


  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const q = window.matchMedia('(max-width: 767px)');
    const on = () => { setAvail(el.clientWidth); setPhone(q.matches); };
    on();
    const ro = new ResizeObserver(on); ro.observe(el);
    q.addEventListener('change', on);
    return () => { ro.disconnect(); q.removeEventListener('change', on); };
  }, []);

  // desktop: hold the mouse and drag to move sideways when the bracket is wider than the page
  useEffect(() => {
    const el = scr.current; if (!el) return;
    let on = false, moved = false, sx = 0, sl = 0;
    const down = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth) return; on = true; moved = false; sx = e.clientX; sl = el.scrollLeft; };
    const move = (e: PointerEvent) => { if (!on) return; const dx = e.clientX - sx; if (!moved && Math.abs(dx) < 4) return; moved = true; el.classList.add('is-panning'); el.scrollLeft = sl - dx; };
    const up = () => { on = false; el.classList.remove('is-panning'); };
    el.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const inner = Math.max(0, avail - 28);
  const fitS = inner > 0 ? inner / g.W : 1;
  const scale = phone ? Math.min(1, Math.max(0.42, fitS)) : Math.min(1, Math.max(0.66, fitS)); // phone: never smaller than 0.42 (same size as Challonge), bigger brackets scroll sideways

  return (
    <div ref={wrap} className="bs-sheet" dir={ar ? 'rtl' : 'ltr'}>
      <div className="bs-top"><b dir="auto">{title}</b><span>plato-ar.com</span></div>
      {bracket.org && <div className="bs-org" dir="auto">{lang === 'ar' ? 'تنظيم' : 'By'}: {bracket.org}</div>}
      <div ref={scr} className="bs-scroll">
        <BracketTreeSvg bracket={bracket} title={title} lang={lang} uid={uid} geometry={g} scale={scale} />
      </div>
    </div>
  );
}
