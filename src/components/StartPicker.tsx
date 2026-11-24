import { useState, type CSSProperties } from 'react';

/** Start date + time in ONE row: date | time (every 30 minutes, 12:00 … 11:30) | AM/PM.
 *  value / onChange use the local "YYYY-MM-DDTHH:mm" form of <input type="datetime-local">. */
const SLOTS: string[] = [];
for (let h = 0; h < 12; h++) for (const m of ['00', '30']) SLOTS.push(`${h === 0 ? 12 : h}:${m}`);

/** "HH:mm" (24h) → [slot label like "9:30", 'am' | 'pm'] */
const split = (hm: string): [string, 'am' | 'pm'] => {
  const [hs, ms] = hm.split(':'); const h = Number(hs) || 0;
  return [`${h % 12 === 0 ? 12 : h % 12}:${ms ?? '00'}`, h >= 12 ? 'pm' : 'am'];
};
const join = (slot: string, p: 'am' | 'pm') => {
  const [hs, ms] = slot.split(':'); const h12 = Number(hs) % 12;
  return `${String((p === 'pm' ? h12 + 12 : h12)).padStart(2, '0')}:${ms}`;
};

export default function StartPicker({ value, onChange, lang, inpCls, selCls, style, required }: { value: string; onChange: (v: string) => void; lang: 'ar' | 'en'; inpCls: string; selCls?: string; style?: CSSProperties; required?: boolean }) {
  const [d0, t0] = value.split('T');
  const [kept, setKept] = useState('21:00'); // remembered while no date is chosen yet
  const time = t0 || kept;
  const [slot, per] = split(time);
  const ar = lang === 'ar';
  const set = (hm: string) => { setKept(hm); if (d0) onChange(`${d0}T${hm}`); };
  const sc = `${(selCls ?? inpCls).replace(/\bdt-in\b/, '')} sel dt-in`;
  const odd = !SLOTS.includes(slot); // a time saved earlier that is not on the half-hour grid is kept as is
  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,.85fr)_minmax(0,1fr)] gap-2">
      <input type="date" dir="ltr" required={required} className={`${inpCls} dt-in`} style={style} value={d0 ?? ''} onChange={(e) => onChange(e.target.value ? `${e.target.value}T${time}` : '')} />
      <select dir="ltr" aria-label={ar ? 'الوقت' : 'Time'} className={sc} style={style} value={slot} onChange={(e) => set(join(e.target.value, per))}>
        {odd && <option value={slot}>{slot}</option>}
        {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select aria-label={ar ? 'صباحاً أو مساءً' : 'AM or PM'} className={sc} style={style} value={per} onChange={(e) => set(join(slot, e.target.value as 'am' | 'pm'))}>
        <option value="am">{ar ? 'صباحاً' : 'AM'}</option><option value="pm">{ar ? 'مساءً' : 'PM'}</option>
      </select>
    </div>
  );
}
