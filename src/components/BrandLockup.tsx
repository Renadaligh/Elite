import type { CSSProperties } from 'react';

const BASE = import.meta.env.BASE_URL;

/** White PNG used as a CSS mask so it takes the current text colour. */
function Mask({ src, className }: { src: string; className: string }) {
  const style: CSSProperties = {
    backgroundColor: 'currentColor',
    WebkitMask: `url(${src}) center / contain no-repeat`,
    mask: `url(${src}) center / contain no-repeat`,
  };
  return <span aria-hidden="true" className={`inline-block shrink-0 ${className}`} style={style} />;
}

/** Header brand:  [cube] plato  |  [Elite ninja mark] */
export default function BrandLockup() {
  return (
    <a href="#top" className="flex min-w-0 items-center gap-1.5 whitespace-nowrap min-[420px]:gap-2.5" aria-label="Plato Elite">
      <Mask src={`${BASE}brand/cube.png`} className="h-6 w-[1.3rem] min-[420px]:h-9 min-[420px]:w-8" />
      <span className="text-[1.2rem] leading-none min-[420px]:text-[1.75rem]" style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}>plato</span>
      <span aria-hidden="true" className="mx-0.5 h-5 w-px opacity-40 min-[420px]:mx-1 min-[420px]:h-6" style={{ background: 'currentColor' }} />
      <Mask src={`${BASE}brand/ninja.png`} className="h-4 w-6 min-[420px]:h-6 min-[420px]:w-9" />
    </a>
  );
}
