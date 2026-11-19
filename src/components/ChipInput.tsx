import { useRef, useState, type CSSProperties, type Ref } from 'react';
import { nameKey } from '../data/bracket';

/**
 * Names as bubbles: type a name and press space (or comma / Enter) and it turns into a bubble with a small × to remove it.
 * Works on phone keyboards too (it reacts to the typed text, not to the Space key event). Duplicates are ignored.
 */
export function ChipInput({ value, onChange, placeholder, maxLen = 40, maxChips = 200, dir = 'auto', className = '', style, bad, ariaLabel, inputRef, onEnterEmpty }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; maxLen?: number; maxChips?: number; dir?: 'ltr' | 'rtl' | 'auto';
  className?: string; style?: CSSProperties; bad?: (s: string) => boolean; ariaLabel?: string; inputRef?: Ref<HTMLInputElement>; onEnterEmpty?: () => void;
}) {
  const [txt, setTxt] = useState('');
  const own = useRef<HTMLInputElement | null>(null);
  const setRef = (el: HTMLInputElement | null) => { own.current = el; if (typeof inputRef === 'function') inputRef(el); else if (inputRef) (inputRef as { current: HTMLInputElement | null }).current = el; };
  const add = (parts: string[]) => {
    const have = new Set(value.map(nameKey)); const next = [...value];
    for (const p of parts) { const n = p.trim().slice(0, maxLen); const k = nameKey(n); if (!k || have.has(k) || next.length >= maxChips) continue; have.add(k); next.push(n); }
    if (next.length !== value.length) onChange(next);
  };
  const SEP = /[\s,،;|]+/;
  const type = (v: string) => {
    if (!SEP.test(v)) { setTxt(v); return; }
    const parts = v.split(SEP); const rest = SEP.test(v.slice(-1)) ? '' : parts.pop() ?? '';
    add(parts); setTxt(rest.slice(0, maxLen));
  };
  return (
    <div dir={dir} className={`${className} flex flex-wrap items-center gap-1.5`} style={style} onClick={() => own.current?.focus()}>
      {value.map((c, i) => (
        <span key={c} dir="ltr" className="inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 ps-3 pe-1 text-[.88rem] font-semibold"
          style={{ borderColor: bad?.(c) ? 'rgba(255,110,110,.8)' : 'rgba(143,178,255,.5)', background: bad?.(c) ? 'rgba(255,90,90,.16)' : 'rgba(61,123,255,.2)', color: 'var(--text)' }}>
          <span className="truncate">{c}</span>
          <button type="button" aria-label={`× ${c}`} className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[.8rem] leading-none"
            style={{ background: 'rgba(255,255,255,.14)', color: 'inherit' }}
            onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, j) => j !== i)); own.current?.focus(); }}>×</button>
        </span>
      ))}
      <input ref={setRef} value={txt} maxLength={maxLen + 1} placeholder={value.length ? '' : placeholder} aria-label={ariaLabel} autoComplete="off" autoCapitalize="off" spellCheck={false}
        className="w-0 min-w-[7ch] flex-1 bg-transparent py-0.5 outline-none" style={{ color: 'inherit' }}
        onChange={(e) => type(e.target.value)}
        onBlur={() => { if (txt.trim()) { add([txt]); setTxt(''); } }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { if (txt.trim()) { e.preventDefault(); add([txt]); setTxt(''); } else if (onEnterEmpty && value.length) { e.preventDefault(); onEnterEmpty(); } }
          else if (e.key === 'Backspace' && !txt && value.length) onChange(value.slice(0, -1));
        }} />
    </div>
  );
}
