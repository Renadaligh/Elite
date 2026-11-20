import { useState, type CSSProperties, type ReactNode } from 'react';

/** A closed card that opens on tap (same look as "Publish the tournament on the site"). */
export default function Fold({ title, note, style, children, defaultOpen = false }: { title: ReactNode; note?: ReactNode; style?: CSSProperties; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="st-share" style={style ?? { background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      <button type="button" className="flex w-full items-center justify-between gap-3 text-start" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <b>{title}</b>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {note ? <p className="st-shn" style={{ marginTop: 4 }}>{note}</p> : null}
      {open ? <div className="grid gap-3" style={{ marginTop: 10 }}>{children}</div> : null}
    </div>
  );
}
