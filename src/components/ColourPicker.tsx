import { useEffect, useRef, useState } from 'react';

/** Colour picker: saturation/brightness square, eyedropper, preview circle, hue slider, and a hex field underneath.
 *  The registration page is tinted from the HUE of the chosen colour (it builds its own dark / light shades), so that is what is reported. */
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
function hsv2hex(h: number, s: number, v: number) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
}
function hex2hsv(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); if (!m) return null;
  const n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60) % 360, mx ? d / mx : 0, mx];
}
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export default function ColourPicker({ hue, onHue, label }: { hue: number; onHue: (h: number) => void; label: string }) {
  const [h, setH] = useState(hue), [s, setS] = useState(0.85), [v, setV] = useState(0.95);
  const [txt, setTxt] = useState(hsv2hex(hue, 0.85, 0.95));
  const own = useRef(false); // the change came from this picker (not from a swatch outside)
  const sq = useRef<HTMLDivElement>(null);
  const hex = hsv2hex(h, s, v);
  useEffect(() => { if (own.current) { own.current = false; return; } if (Math.round(hue) !== Math.round(h)) { setH(hue); setTxt(hsv2hex(hue, s, v)); } }, [hue]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (nh: number, ns: number, nv: number) => { own.current = true; setH(nh); setS(ns); setV(nv); setTxt(hsv2hex(nh, ns, nv)); onHue(Math.round(nh)); };
  const drag = (e: React.PointerEvent) => {
    const el = sq.current; if (!el) return;
    const r = el.getBoundingClientRect();
    set(h, clamp((e.clientX - r.left) / r.width), clamp(1 - (e.clientY - r.top) / r.height));
  };
  const Eye = typeof window !== 'undefined' ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;
  const pickScreen = async () => { if (!Eye) return; try { const r = await new Eye().open(); const p = hex2hsv(r.sRGBHex); if (p) set(p[0], p[1], p[2]); } catch { /* cancelled */ } };
  return (
    <div className="cp" dir="ltr">
      <div ref={sq} className="cp-sq" style={{ background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),hsl(${h} 100% 50%)` }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }} onPointerMove={(e) => { if (e.buttons) drag(e); }} role="presentation">
        <i style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: hex }} />
      </div>
      <div className="cp-row">
        {Eye && <button type="button" className="cp-eye" aria-label={label} onClick={() => { void pickScreen(); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3z"/></svg></button>}
        <span className="cp-dot" style={{ background: hex }} />
        <input type="range" min={0} max={359} value={Math.round(h)} aria-label={label} className="cp-hue" onChange={(e) => set(+e.target.value, s, v)} />
      </div>
      <label className="cp-hex">HEX
        <input value={txt} maxLength={7} spellCheck={false} onChange={(e) => { const t = e.target.value; setTxt(t); const p = hex2hsv(t); if (p) { own.current = true; setH(p[0]); setS(p[1]); setV(p[2]); onHue(p[0]); } }} onBlur={() => setTxt(hex)} />
      </label>
    </div>
  );
}
