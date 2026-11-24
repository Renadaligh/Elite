import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react';

/** Inside a page of its own (the tool's section tabs) cards are not collapsible: always open, the title is a plain heading. */
export const FlatFold = createContext(false);

/** A closed card that opens on tap (same look as "Publish the tournament on the site"). */
export default function Fold({ title, note, style, children, defaultOpen = false }: { title: ReactNode; note?: ReactNode; style?: CSSProperties; children: ReactNode; defaultOpen?: boolean }) {
  const flat = useContext(FlatFold);
  const [open, setOpen] = useState(defaultOpen);
  const shown = flat || open;
  return (
    <div className="st-share" style={style ?? { background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      {flat ? <b>{title}</b> : (
        <button type="button" className="flex w-full items-center justify-between gap-3 text-start" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <b>{title}</b>
          <span className="st-chev" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="m6 9 6 6 6-6" /></svg></span>
        </button>
      )}
      {note ? <p className="st-shn" style={{ marginTop: 4 }}>{note}</p> : null}
      {shown ? <div className="grid gap-3" style={{ marginTop: 10 }}>{children}</div> : null}
    </div>
  );
}
