import { useEffect, useRef, useState, type CSSProperties } from 'react';

/** Game picker with a search box: the list narrows while you type. Arabic is matched loosely (hamza forms, ة/ه, ى/ي and diacritics are ignored). */
export interface GameOpt { id: string; name: Record<'ar' | 'en', string> }
const norm = (s: string) => s.normalize('NFKC').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase().trim();

export default function GameSelect({ value, onChange, games, lang, inpCls, style }: { value: string; onChange: (id: string) => void; games: GameOpt[]; lang: 'ar' | 'en'; inpCls: string; style?: CSSProperties }) {
  const ar = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const cur = games.find((g) => g.id === value);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const k = norm(q);
  const shown = k ? games.filter((g) => norm(g.name.ar).includes(k) || norm(g.name.en).includes(k)) : games;
  const pick = (id: string) => { onChange(id); setOpen(false); setQ(''); };
  return (
    <div ref={box} className="dtp">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} className={`${inpCls} flex items-center justify-between gap-2 text-start`} style={style} onClick={() => setOpen((o) => !o)}>
        <span style={cur ? undefined : { opacity: .55 }}>{cur ? cur.name[lang] : (ar ? 'اختر لعبة' : 'Choose a game')}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="dtp-pop gs-pop">
          <div className="gs-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? 'ابحث عن لعبة' : 'Search games'} aria-label={ar ? 'ابحث عن لعبة' : 'Search games'} autoComplete="off" />
          </div>
          <div className="gs-list" role="listbox">
            {shown.map((g) => <button key={g.id} type="button" role="option" aria-selected={g.id === value} className={g.id === value ? 'dp-on' : ''} onClick={() => pick(g.id)}>{g.name[lang]}</button>)}
            {!shown.length && <p className="gs-none">{ar ? 'ما لقينا لعبة بهذا الاسم' : 'No game with that name'}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
