import { useMemo, type CSSProperties } from 'react';

type Vars = CSSProperties & { [k: `--${string}`]: string | number };
const COLORS = ['#ff7aa8', '#7fe3ff', '#c9a6ff', '#ffd27a'];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Magical drifting motes (CSS-only animation, deterministic layout). */
export default function ParticleField({ count = 28 }: { count?: number }) {
  const items = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: count }, (_, i) => {
      const s = 2 + r() * 4, c = COLORS[i % COLORS.length];
      const style: Vars = { left: `${r() * 100}%`, top: `${20 + r() * 75}%`, width: s, height: s, background: c, boxShadow: `0 0 ${s * 3}px ${c}`, '--d': `${5 + r() * 6}s`, '--l': `-${r() * 6}s`, '--x': `${r() * 30 - 15}px` };
      return <span key={i} className="particle" style={style} />;
    });
  }, [count]);
  return <div className="particles pointer-events-none absolute inset-0 z-[3]" aria-hidden="true">{items}</div>;
}
