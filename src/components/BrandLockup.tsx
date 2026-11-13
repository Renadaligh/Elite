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

/** Header brand:  [cube] plato  |  AR */
export default function BrandLockup({ collapsed = false, ninja = true }: { collapsed?: boolean; ninja?: boolean }) {
  return (
    <a href="#top" dir="ltr" className="flex min-w-0 items-center gap-1.5 whitespace-nowrap min-[420px]:gap-2.5" aria-label="Plato AR">
      <Mask src={`${BASE}brand/cube-v2.png`} className="h-8 w-[1.75rem] min-[420px]:h-12 min-[420px]:w-[2.7rem]" />
      <span className="bl-more" data-show={collapsed ? 'false' : 'true'} aria-hidden={collapsed || undefined}>
      {ninja ? <Mask src={`${BASE}brand/plato-ar-white.png`} className="h-[1.9rem] w-[5.2rem] min-[420px]:h-[2.9rem] min-[420px]:w-[7.9rem]" /> : <span className="text-[1.2rem] leading-none min-[420px]:text-[1.75rem]" style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}>plato</span>}
      </span>
    </a>
  );
}
