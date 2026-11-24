import { useEffect, useState, type CSSProperties } from 'react';

/** Colours of a registration page. The page takes its colour from the cover picture (most prominent hue); the organiser can pick another one. */
/** Most prominent hue of the cover (30° bins, only vivid pixels). null = grey/white picture or unreadable: keep the site colours. */
export function useCoverHue(src?: string): number | null {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    setH(null);
    if (!src) return;
    let live = true;
    const img = new Image();
    img.onload = () => {
      try {
        const w = 48, hgt = Math.max(1, Math.round((48 * img.naturalHeight) / Math.max(1, img.naturalWidth)));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt;
        const cx = cv.getContext('2d'); if (!cx) return;
        cx.drawImage(img, 0, 0, w, hgt);
        const d = cx.getImageData(0, 0, w, hgt).data;
        const bins = new Array<number>(12).fill(0), sum = new Array<number>(12).fill(0);
        let vivid = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx, s = mx === 0 ? 0 : (mx - mn) / mx;
          if (s < 0.35 || v < 0.25 || v > 0.97) continue;
          const dl = mx - mn; let hu = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; hu = (hu * 60 + 360) % 360;
          const bi = Math.floor(((hu + 15) % 360) / 30); bins[bi]++; vivid++;
          sum[bi] += hu > 180 && bi === 0 ? hu - 360 : hu;
        }
        if (vivid < d.length / 4 * 0.08) return;
        let best = 0; for (let i = 1; i < 12; i++) if (bins[i] > bins[best]) best = i;
        if (live) setH(Math.round((sum[best] / bins[best] + 360) % 360));
      } catch { /* unreadable picture: default colours */ }
    };
    img.src = src;
    return () => { live = false; };
  }, [src]);
  return h;
}

/** One hue → the page's variables, dark or light (same recipe the registration page has always used). */
export function tintVars(hue: number, theme: 'dark' | 'light'): CSSProperties {
  return (theme === 'dark'
    ? { '--bg': `hsl(${hue} 55% 8%)`, '--bg2': `hsl(${hue} 60% 14%)`, '--glass': `hsl(${hue} 35% 13%)`, '--glass-b': `hsla(${hue} 40% 60% / .26)`, '--muted': `hsl(${hue} 22% 72%)`, '--jn-ac': `hsl(${hue} 90% 55%)` }
    : { '--bg': `hsl(${hue} 80% 93%)`, '--bg2': `hsl(${hue} 90% 86%)`, '--glass': '#fff', '--glass-b': `hsla(${hue} 45% 30% / .2)`, '--muted': `hsl(${hue} 22% 36%)`, '--jn-ac': `hsl(${hue} 88% 46%)` }) as CSSProperties;
}
/** The site's own colours, for a page with no picture colour and no chosen colour. */
export function plainVars(theme: 'dark' | 'light'): CSSProperties {
  return (theme === 'dark'
    ? { '--bg': '#050b2b', '--bg2': '#0b1650', '--glass': 'rgba(14,26,88,.6)', '--glass-b': 'rgba(150,175,255,.2)', '--muted': '#a3b3ea', '--jn-ac': '#3d7bff' }
    : { '--bg': '#f4eefc', '--bg2': '#e6ddf7', '--glass': '#fff', '--glass-b': 'rgba(43,33,96,.14)', '--muted': '#6d62a0', '--jn-ac': '#4a5df0' }) as CSSProperties;
}
export const PRESET_HUES = [262, 18, 160, 215, 340] as const;
/** hue (0–359) of a "#rrggbb" colour, null when it is grey */
export function hueOfHex(v: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(v); if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255, g = parseInt(m[1].slice(2, 4), 16) / 255, b = parseInt(m[1].slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b); if (!d) return null;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}
export function hexOfHue(h: number): string {
  const s = 0.85, l = 0.5, a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Up to `max` distinct vivid hues of a picture, most common first (pure function over RGBA pixels, so it can be tested without a canvas).
 *  Hues closer than `gap` degrees count as one colour; a hue must cover at least `min` of the vivid pixels to be offered. */
export function hueClusters(d: ArrayLike<number>, max = 5, gap = 28, min = 0.03): number[] {
  const N = 36; // 10° bins
  const cnt = new Array<number>(N).fill(0), vivid = { n: 0 };
  for (let i = 0; i + 3 < d.length; i += 4) {
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx === 0 ? 0 : (mx - mn) / mx;
    if (s < 0.35 || mx < 0.25 || mx > 0.97) continue;
    const dl = mx - mn; let hu = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; hu = (hu * 60 + 360) % 360;
    cnt[Math.floor(hu / 10) % N]++; vivid.n++;
  }
  if (!vivid.n) return [];
  // smooth over the neighbouring bins so one colour is not split in two
  const sm = cnt.map((_, i) => cnt[(i + N - 1) % N] + cnt[i] * 2 + cnt[(i + 1) % N]);
  const order = sm.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
  const out: number[] = [];
  for (const [v, i] of order) {
    if (v / 4 < vivid.n * min) break;
    const h = i * 10 + 5;
    if (out.every((o) => { const df = Math.abs(o - h) % 360; return Math.min(df, 360 - df) >= gap; })) out.push(h);
    if (out.length >= max) break;
  }
  return out;
}

/** The picture's own colours for the colour picker: the most prominent hue first (the one the page uses by default), then the other main hues. */
export function useCoverPalette(src: string | undefined, first: number | null): number[] {
  const [pal, setPal] = useState<number[]>([]);
  useEffect(() => {
    setPal([]);
    if (!src) return undefined;
    let live = true;
    const img = new Image();
    img.onload = () => {
      try {
        const w = 64, hgt = Math.max(1, Math.round((64 * img.naturalHeight) / Math.max(1, img.naturalWidth)));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt;
        const cx = cv.getContext('2d'); if (!cx) return;
        cx.drawImage(img, 0, 0, w, hgt);
        if (live) setPal(hueClusters(cx.getImageData(0, 0, w, hgt).data, 6));
      } catch { /* unreadable picture: no extra colours */ }
    };
    img.src = src;
    return () => { live = false; };
  }, [src]);
  if (first === null) return [];
  const gapOk = (h: number) => { const df = Math.abs(first - h) % 360; return Math.min(df, 360 - df) >= 28; };
  return [first, ...pal.filter(gapOk)].slice(0, 5);
}
