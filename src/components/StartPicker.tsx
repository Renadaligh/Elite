import { useState, type CSSProperties } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');
const SLOTS = Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`);
const label = (t: string, lang: 'ar' | 'en') => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? (lang === 'ar' ? 'ص' : 'AM') : (lang === 'ar' ? 'م' : 'PM')}`;
};

/** Start date + a time chosen from a list in half-hour steps (9:00, 9:30, 10:00 ...). value / onChange use the local "YYYY-MM-DDTHH:mm" form of <input type="datetime-local">. */
export default function StartPicker({ value, onChange, lang, inpCls, selCls, style, required }: { value: string; onChange: (v: string) => void; lang: 'ar' | 'en'; inpCls: string; selCls: string; style?: CSSProperties; required?: boolean }) {
  const [d0, t0] = value.split('T');
  const [kept, setKept] = useState('21:00'); // remembered while no date is chosen yet
  const time = t0 || kept;
  const slots = SLOTS.includes(time) ? SLOTS : [...SLOTS, time].sort(); // an older value such as 9:15 stays selectable
  return (
    <div className="grid grid-cols-2 gap-2">
      <input type="date" dir="ltr" required={required} className={inpCls} style={style} value={d0 ?? ''} onChange={(e) => onChange(e.target.value ? `${e.target.value}T${time}` : '')} />
      <select aria-label={lang === 'ar' ? 'الوقت' : 'Time'} className={selCls} style={{ ...style, backgroundColor: 'var(--bg)' }} value={time} onChange={(e) => { setKept(e.target.value); if (d0) onChange(`${d0}T${e.target.value}`); }}>
        {slots.map((s) => <option key={s} value={s}>{label(s, lang)}</option>)}
      </select>
    </div>
  );
}
