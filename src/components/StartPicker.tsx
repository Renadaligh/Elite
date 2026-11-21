import { useState, type CSSProperties } from 'react';

/** Start date + time. The time is the phone's own wheel picker (hour, minutes, AM/PM spin together); on a computer it is the usual time field.
 *  value / onChange use the local "YYYY-MM-DDTHH:mm" form of <input type="datetime-local">. */
export default function StartPicker({ value, onChange, lang, inpCls, style, required }: { value: string; onChange: (v: string) => void; lang: 'ar' | 'en'; inpCls: string; selCls?: string; style?: CSSProperties; required?: boolean }) {
  const [d0, t0] = value.split('T');
  const [kept, setKept] = useState('21:00'); // remembered while no date is chosen yet
  const time = t0 || kept;
  return (
    <div className="grid grid-cols-2 gap-2">
      <input type="date" dir="ltr" required={required} className={`${inpCls} dt-in`} style={style} value={d0 ?? ''} onChange={(e) => onChange(e.target.value ? `${e.target.value}T${time}` : '')} />
      <input type="time" dir="ltr" step={60} aria-label={lang === 'ar' ? 'الوقت' : 'Time'} className={`${inpCls} dt-in`} style={style} value={time} onChange={(e) => { const v = e.target.value; if (!v) return; setKept(v); if (d0) onChange(`${d0}T${v}`); }} />
    </div>
  );
}
