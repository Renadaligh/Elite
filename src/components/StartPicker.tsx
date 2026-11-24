import { useEffect, useRef, useState, type CSSProperties } from 'react';

/** Start date + time in one popup (Challonge style): a month calendar and a list of times every 30 minutes (12:00 ص … 11:30 م).
 *  value / onChange use the local "YYYY-MM-DDTHH:mm" form of <input type="datetime-local">, so every caller keeps working. The list opens in the page flow (no floating layer to be clipped). */
const pad2 = (n: number) => String(n).padStart(2, '0');
const SLOTS: string[] = [];
for (let i = 0; i < 48; i++) SLOTS.push(`${pad2(i >> 1)}:${i % 2 ? '30' : '00'}`);
const MONTHS = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const WD = { ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'], en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] };
const dayKey = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
/** "20:30" → "8:30 م" (Arabic) / "8:30 PM" */
const label = (hm: string, ar: boolean) => {
  const [h, m] = hm.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad2(m || 0)} ${h < 12 ? (ar ? 'ص' : 'AM') : (ar ? 'م' : 'PM')}`;
};
const parseDay = (d: string): [number, number, number] | null => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m ? [+m[1], +m[2] - 1, +m[3]] : null; };

export default function StartPicker({ value, onChange, lang, inpCls, style, required }: { value: string; onChange: (v: string) => void; lang: 'ar' | 'en'; inpCls: string; selCls?: string; style?: CSSProperties; required?: boolean }) {
  const ar = lang === 'ar';
  const [d0, t0] = value.split('T');
  const picked = d0 ? parseDay(d0) : null;
  const now = new Date();
  const today = dayKey(now.getFullYear(), now.getMonth(), now.getDate());
  const [kept, setKept] = useState('21:00'); // remembered while no date is chosen yet
  const time = t0 || kept;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<[number, number]>(() => (picked ? [picked[0], picked[1]] : [now.getFullYear(), now.getMonth()]));
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  useEffect(() => { // the chosen time is brought to the middle of the list when it opens
    if (!open || !list.current) return;
    const s = list.current.querySelector<HTMLElement>('.dp-on');
    if (s) list.current.scrollTop = s.offsetTop - list.current.clientHeight / 2 + s.clientHeight / 2;
  }, [open]);

  const times = SLOTS.includes(time) ? SLOTS : [...SLOTS, time].sort(); // a time saved earlier that is not on the half-hour grid is kept as is
  const setDay = (key: string) => onChange(`${key}T${time}`);
  const setTime = (hm: string) => { setKept(hm); onChange(`${d0 || today}T${hm}`); };
  const [vy, vm] = view;
  const first = new Date(vy, vm, 1).getDay(), days = new Date(vy, vm + 1, 0).getDate(), prevDays = new Date(vy, vm, 0).getDate();
  const go = (n: number) => { const x = new Date(vy, vm + n, 1); setView([x.getFullYear(), x.getMonth()]); };
  const toToday = () => { setView([now.getFullYear(), now.getMonth()]); setDay(today); };
  const [hh, mm] = time.split(':').map(Number);
  const at = picked ? new Date(picked[0], picked[1], picked[2], hh || 0, mm || 0) : now;
  const off = -at.getTimezoneOffset(), ab = Math.abs(off);
  let zone = ''; try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* ignore */ }
  const gmt = `GMT${off >= 0 ? '+' : '-'}${pad2(Math.floor(ab / 60))}:${pad2(ab % 60)}${zone ? ` ${zone}` : ''}`;
  const shown = picked ? `${dayKey(picked[0], picked[1], picked[2]).replace(/-/g, '/')} · ${label(time, ar)}` : '';
  const arrow = (prev: boolean) => (prev === ar ? '›' : '‹');

  return (
    <div ref={box} className="dtp">
      <input tabIndex={-1} aria-hidden="true" className="sr-only" required={required} value={value} onChange={() => undefined} />
      <button type="button" aria-expanded={open} className={`${inpCls.replace(/\bdt-in\b/, '')} flex items-center justify-between gap-2 text-start`} style={style} onClick={() => setOpen((o) => !o)}>
        <span dir="ltr" style={shown ? undefined : { opacity: .55 }}>{shown || (ar ? 'اختر التاريخ والوقت' : 'Choose date and time')}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
      </button>
      {open && (
        <div className="dtp-pop">
          <div>
            <div className="dtp-hd">
              <button type="button" aria-label={ar ? 'الشهر السابق' : 'Previous month'} onClick={() => go(-1)}>{arrow(true)}</button>
              <button type="button" aria-label={ar ? 'اليوم الحالي' : 'Today'} title={ar ? 'اليوم الحالي' : 'Today'} onClick={toToday}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 11 12 3.5 20.5 11" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></svg>
              </button>
              <span className="dtp-title">{MONTHS[lang][vm]} {vy}</span>
              <button type="button" aria-label={ar ? 'الشهر التالي' : 'Next month'} onClick={() => go(1)}>{arrow(false)}</button>
            </div>
            <div className="dtp-cal">
              {WD[lang].map((w, i) => <span key={i} className="dtp-wd">{w}</span>)}
              {Array.from({ length: first }, (_, i) => <button key={`p${i}`} type="button" tabIndex={-1} className="dp-dim" onClick={() => go(-1)}>{prevDays - first + 1 + i}</button>)}
              {Array.from({ length: days }, (_, i) => { const k = dayKey(vy, vm, i + 1); return <button key={k} type="button" className={`${k === d0 ? 'dp-on' : ''} ${k === today ? 'dp-today' : ''}`} onClick={() => setDay(k)}>{i + 1}</button>; })}
            </div>
          </div>
          <div ref={list} className="dtp-tm" role="listbox" aria-label={ar ? 'الوقت' : 'Time'}>
            {times.map((s) => <button key={s} type="button" role="option" aria-selected={s === time && !!picked} className={s === time && picked ? 'dp-on' : ''} onClick={() => setTime(s)}>{label(s, ar)}</button>)}
          </div>
          <div className="dtp-ft">
            <span dir="ltr">{ar ? 'بتوقيت جهازك' : 'Your device time'} ({gmt})</span>
            <span className="dtp-act">
              {!required && !!value && <button type="button" onClick={() => { onChange(''); setOpen(false); }}>{ar ? 'مسح' : 'Clear'}</button>}
              <button type="button" onClick={() => setOpen(false)}>{ar ? 'تم' : 'Done'}</button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
