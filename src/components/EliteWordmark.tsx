import { useEffect, useRef, useState } from 'react';

const BASE = import.meta.env.BASE_URL;

/* Geometry of the footage (1280×720). The wordmark settles at x 515, y 328 (248×52) in the source footage.
   The intro sprite is the same footage's glitch-in, 44 frames @ 24 fps, cut out as transparent frames. */
const VW = 1280, VH = 720;
/** The footage settles the word at y 328; it is lifted so it sits above the hero paragraph (more on phones, where the
 *  copy block is taller). Sprite and SVG move together. */
const LIFT_DESKTOP = 106, LIFT_PHONE = 156;
const SPRITE = { src: `${BASE}art/elite-intro.webp`, x: 300, y: 195, w: 690, h: 205, cols: 4, frames: 44, fps: 24 };
const WORD = { x: 515, y: 328, w: 248, h: 52 };
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

type Phase = 'wait' | 'play' | 'done';

/**
 * Wordmark layer that sits inside the hero art (same box as the video, "cover"-fitted) so it stays glued to the footage.
 * Plays the footage's own glitch-in once, then shows the crisp SVG word. Reduced motion / sprite failure → SVG only.
 */
export default function EliteWordmark() {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('wait');
  const [phone, setPhone] = useState(() => matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const m = matchMedia('(max-width: 767px)');
    const on = () => setPhone(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  const lift = phone ? LIFT_PHONE : LIFT_DESKTOP;

  // Reproduce object-fit: cover (centred) for a 16:9 box inside whatever the parent is.
  useEffect(() => {
    const el = box.current, parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      const { clientWidth: W, clientHeight: H } = parent;
      const s = Math.max(W / VW, H / VH);
      el.style.width = `${VW * s}px`;
      el.style.height = `${VH * s}px`;
      el.style.left = `${(W - VW * s) / 2}px`;
      el.style.top = `${(H - VH * s) / 2}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('done'); return; }
    let raf = 0, dead = false;
    const img = new Image();
    const giveUp = window.setTimeout(() => { if (!dead) setPhase('done'); }, 3000);
    img.onerror = () => { window.clearTimeout(giveUp); if (!dead) setPhase('done'); };
    img.onload = () => {
      window.clearTimeout(giveUp);
      const c = cv.current, ctx = c?.getContext('2d');
      if (dead || !c || !ctx) { setPhase('done'); return; }
      setPhase('play');
      const t0 = performance.now() + 350; // let the hero entrance fade in first
      let shown = -1;
      const loop = (now: number) => {
        const f = Math.floor((now - t0) / (1000 / SPRITE.fps));
        if (f >= SPRITE.frames) { setPhase('done'); return; }
        const k = Math.max(f, 0);
        if (k !== shown) {
          shown = k;
          ctx.clearRect(0, 0, SPRITE.w, SPRITE.h);
          ctx.drawImage(img, (k % SPRITE.cols) * SPRITE.w, Math.floor(k / SPRITE.cols) * SPRITE.h, SPRITE.w, SPRITE.h, 0, 0, SPRITE.w, SPRITE.h);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    img.src = SPRITE.src;
    return () => { dead = true; window.clearTimeout(giveUp); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={box} aria-hidden="true" className="pointer-events-none absolute">
      <canvas
        ref={cv} width={SPRITE.w} height={SPRITE.h} className="absolute"
        style={{ left: pct(SPRITE.x, VW), top: pct(SPRITE.y - lift, VH), width: pct(SPRITE.w, VW), height: pct(SPRITE.h, VH), visibility: phase === 'play' ? 'visible' : 'hidden' }}
      />
      <svg
        viewBox="0 0 248 52" className="absolute" focusable="false"
        style={{ left: pct(WORD.x, VW), top: pct(WORD.y - lift, VH), width: pct(WORD.w, VW), height: pct(WORD.h, VH), visibility: phase === 'done' ? 'visible' : 'hidden' }}
      >
        <g fill="#0a0a0a">
          <rect x="0" y="0" width="52" height="13" /><rect x="0" y="19.5" width="52" height="13" /><rect x="0" y="39" width="52" height="13" />
          <rect x="70" y="0" width="13" height="52" /><rect x="58" y="39" width="52" height="13" />
          <rect x="116" y="0" width="13" height="52" />
          <rect x="136" y="0" width="53" height="13" /><rect x="159" y="0" width="13" height="52" />
          <rect x="196" y="0" width="52" height="13" /><rect x="196" y="19.5" width="52" height="13" /><rect x="196" y="39" width="52" height="13" />
        </g>
      </svg>
    </div>
  );
}
