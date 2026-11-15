import { useEffect, useState } from 'react';

/** Two dominant, vivid colours of an image (for the glow behind a game page). null until known, or if the image cannot be read (e.g. blocked by CORS). */
export type Tones = [string, string] | null;
const cache = new Map<string, Tones>();

function pick(data: Uint8ClampedArray): Tones {
  // 12 hue buckets weighted by saturation and brightness; ignores near-black, near-white and grey pixels
  const hue = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (mx < 0.2 || d < 0.12 || mn > 0.85) continue;
    const sat = d / mx;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const k = Math.floor(h / 30), w = sat * sat * (0.4 + mx);
    const c = hue[k]; c.w += w; c.r += data[i] * w; c.g += data[i + 1] * w; c.b += data[i + 2] * w;
  }
  const ranked = hue.map((c, k) => ({ ...c, k })).filter((c) => c.w > 0).sort((a, b) => b.w - a.w);
  if (!ranked.length) return null;
  const col = (c: (typeof ranked)[number]) => `rgb(${Math.round(c.r / c.w)}, ${Math.round(c.g / c.w)}, ${Math.round(c.b / c.w)})`;
  const first = ranked[0];
  // the second colour should be a clearly different hue (not a neighbouring bucket)
  const second = ranked.find((c) => { const dk = Math.abs(c.k - first.k); return Math.min(dk, 12 - dk) >= 2 && c.w > first.w * 0.15; });
  return [col(first), col(second ?? first)];
}

export function useImageTones(src?: string): Tones {
  const [tones, setTones] = useState<Tones>(() => (src ? cache.get(src) ?? null : null));
  useEffect(() => {
    if (!src) { setTones(null); return undefined; }
    if (cache.has(src)) { setTones(cache.get(src) ?? null); return undefined; }
    let live = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let t: Tones = null;
      try {
        const c = document.createElement('canvas'); c.width = 40; c.height = 50;
        const x = c.getContext('2d', { willReadFrequently: true });
        if (x) { x.drawImage(img, 0, 0, 40, 50); t = pick(x.getImageData(0, 0, 40, 50).data); }
      } catch { /* tainted canvas: keep the default colour */ }
      cache.set(src, t); if (live) setTones(t);
    };
    img.onerror = () => { cache.set(src, null); };
    img.src = src;
    return () => { live = false; };
  }, [src]);
  return tones;
}
