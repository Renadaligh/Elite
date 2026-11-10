import { champion, isCurrent, layout, resolve, type BMatch, type Bracket, type Who } from './bracket';

/** Draws a bracket straight onto a canvas (no libraries), so "save as image" works the same everywhere. */
const CW = 210, CH = 62, RH = CH / 2, GX = 60, GY = 18, PAD = 36, HEAD = 96, FOOT = 56;

interface Opts { title: string; lang: 'ar' | 'en'; scale?: number }

export async function bracketBlob(br: Bracket, { title, lang, scale = 2 }: Opts): Promise<Blob> {
  try { await document.fonts?.ready; } catch { /* fonts are optional */ }
  const rtl = lang === 'ar';
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const R = resolve(br);
  const L = layout(br);
  const pos = new Map<string, { x: number; y: number }>();

  // Positions: a match sits level with the match(es) that feed it; first rounds are stacked in order.
  const place = (rounds: BMatch[][], y0: number) => {
    let bottom = y0;
    rounds.forEach((ms, ri) => ms.forEach((m, i) => {
      const fs = [m.a, m.b].map((s) => ('w' in s ? pos.get(s.w) : undefined)).filter(Boolean) as { x: number; y: number }[];
      const y = fs.length ? fs.reduce((t, f) => t + f.y, 0) / fs.length : y0 + i * (CH + GY);
      pos.set(m.id, { x: ri * (CW + GX), y });
      bottom = Math.max(bottom, y + CH);
    }));
    return bottom;
  };
  const double = br.format === 'double';
  const wBottom = place(L.winners, HEAD + (double ? 26 : 0));
  const lTop = wBottom + 46;
  const lBottom = L.losers.length ? place(L.losers, lTop + 26) : wBottom;
  const cols = Math.max(L.winners.length, L.losers.length);
  let bottom = Math.max(wBottom, lBottom);
  if (L.final) {
    const fs = [L.final.a, L.final.b].map((s) => ('w' in s ? pos.get(s.w) : undefined)).filter(Boolean) as { x: number; y: number }[];
    const y = fs.length ? fs.reduce((t, f) => t + f.y, 0) / fs.length : HEAD;
    pos.set(L.final.id, { x: cols * (CW + GX), y });
  }
  const champ = champion(br);
  const W = PAD * 2 + (cols + (L.final ? 1 : 0)) * (CW + GX) - GX;
  const H = bottom + (champ !== null ? 70 : 0) + FOOT;
  const k = Math.min(scale, 8000 / W);
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const c = cv.getContext('2d')!;
  c.scale(k, k);
  c.direction = rtl ? 'rtl' : 'ltr';

  const X = (x: number, w = CW) => (rtl ? W - PAD - x - w : PAD + x);
  const rr = (x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const txt = (s: string, x: number, y: number, align: 'start' | 'end' | 'left' | 'right', maxW: number) => {
    let t = s;
    while (t.length > 1 && c.measureText(t).width > maxW) t = t.slice(0, -1);
    c.textAlign = align; c.fillText(t === s ? t : `${t}…`, x, y);
  };

  c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,51,71,.18)'); g.addColorStop(1, 'rgba(255,51,71,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, 6 + 0);
  c.fillStyle = '#ff3347'; c.fillRect(0, 0, W, 4);
  // title
  c.fillStyle = '#ffffff'; c.font = `800 28px ${family}`; c.textBaseline = 'alphabetic';
  txt(title, rtl ? W - PAD : PAD, 56, 'start', W - PAD * 2);
  c.fillStyle = '#9aa0b8'; c.font = `600 13px ${family}`;
  txt(rtl ? 'البراكت' : 'Bracket', rtl ? W - PAD : PAD, 80, 'start', 300);

  // section labels
  c.fillStyle = '#9aa0b8'; c.font = `700 12px ${family}`;
  if (double) {
    txt(rtl ? 'فرع الفائزين' : 'WINNERS BRACKET', rtl ? W - PAD : PAD, HEAD + 14, 'start', 300);
    if (L.losers.length) txt(rtl ? 'فرع الخاسرين' : 'LOSERS BRACKET', rtl ? W - PAD : PAD, lTop + 14, 'start', 300);
  }

  // connectors
  c.lineWidth = 1.5;
  for (const m of br.matches) {
    const to = pos.get(m.id); if (!to) continue;
    for (const s of [m.a, m.b]) {
      if (!('w' in s)) continue;
      const from = pos.get(s.w); if (!from) continue;
      const x1 = rtl ? X(from.x) : X(from.x) + CW, x2 = rtl ? X(to.x) + CW : X(to.x), y1 = from.y + RH, y2 = to.y + RH, mx = (x1 + x2) / 2;
      c.strokeStyle = R.get(s.w)?.win != null ? '#ff3347' : 'rgba(255,255,255,.2)';
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(mx, y1); c.lineTo(mx, y2); c.lineTo(x2, y2); c.stroke();
    }
  }

  // cards
  const nm = (w: Who) => (w === 'bye' ? 'BYE' : w === null ? (rtl ? 'لم يُحدد' : 'TBD') : br.players[w] || '—');
  for (const m of br.matches) {
    const p = pos.get(m.id); if (!p) continue;
    const r = R.get(m.id)!;
    const x = X(p.x), isBye = r.a === 'bye' || r.b === 'bye', live = isCurrent(br, m.id) && !m.win;
    c.globalAlpha = isBye ? 0.45 : 1;
    rr(x, p.y, CW, CH, 10); c.fillStyle = '#14141a'; c.fill();
    c.save(); rr(x, p.y, CW, CH, 10); c.clip();
    ([['a', r.a, m.sa], ['b', r.b, m.sb]] as const).forEach(([side, w, sc], i) => {
      const y = p.y + i * RH, win = !isBye && m.win === side, lose = !isBye && !!m.win && !win;
      if (win) { c.fillStyle = 'rgba(255,51,71,.2)'; c.fillRect(x, y, CW, RH); }
      c.fillStyle = win ? '#ffffff' : lose || typeof w !== 'number' ? '#8b90a6' : '#e8e8f0';
      c.font = `${win ? 700 : 500} 14px ${family}`; c.textBaseline = 'middle';
      txt(nm(w), rtl ? x + CW - 12 : x + 12, y + RH / 2 + 1, 'start', CW - 56);
      if (sc || win) { c.font = `800 14px ${family}`; c.fillStyle = win && !sc ? '#ff4455' : '#fff'; c.textAlign = 'end'; txt(sc || '✓', rtl ? x + 12 : x + CW - 12, y + RH / 2 + 1, rtl ? 'start' : 'end', 30); }
    });
    c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(x, p.y + RH, CW, 1);
    c.restore();
    c.lineWidth = live ? 2.5 : 1; c.strokeStyle = live ? '#ff3347' : 'rgba(255,255,255,.14)'; rr(x, p.y, CW, CH, 10); c.stroke();
    if (live) { c.fillStyle = '#ff3347'; c.font = `800 10px ${family}`; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillRect(x + CW / 2 - 24, p.y - 8, 48, 16); c.fillStyle = '#fff'; c.fillText(rtl ? 'الآن' : 'LIVE', x + CW / 2, p.y); }
    c.globalAlpha = 1;
  }

  // champion + footer
  if (champ !== null) {
    const w = Math.min(W - PAD * 2, 360), x = rtl ? W - PAD - w : PAD, y = bottom + 20;
    rr(x, y, w, 44, 12); c.fillStyle = 'rgba(255,51,71,.14)'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#ff3347'; c.stroke();
    c.fillStyle = '#fff'; c.font = `800 17px ${family}`; c.textBaseline = 'middle';
    txt(`🏆  ${br.players[champ]}`, rtl ? x + w - 16 : x + 16, y + 23, 'start', w - 32);
  }
  c.fillStyle = '#6c7088'; c.font = `600 12px ${family}`; c.textBaseline = 'middle';
  txt('Elite · plato-ar.com', rtl ? PAD : W - PAD, H - 26, rtl ? 'left' : 'right', 260);
  c.textAlign = 'start';
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/png'));
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Shares the picture through the phone's share sheet when possible; otherwise shares/copies the link. */
export async function shareBracket(blob: Blob, title: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  const file = new File([blob], 'bracket.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title, text: `${title}\n${url}` }); return 'shared'; }
    if (navigator.share) { await navigator.share({ title, url }); return 'shared'; }
  } catch (e) { if ((e as Error).name === 'AbortError') return 'failed'; }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch { return 'failed'; }
}
