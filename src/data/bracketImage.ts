import { champion, ffaChampion, ffaRows, groupLabel, groupSub, isCurrent, isLeague, koSub, layout, leagueRounds, outcome, resolve, roundMatches, standings, type BMatch, type Bracket, type Who } from './bracket';

/** Draws a bracket straight onto a canvas (no libraries), so "save as image" works the same everywhere. */
const CW = 210, CH = 62, RH = CH / 2, GX = 60, GY = 18, PAD = 36, HEAD = 96, FOOT = 72;

/** Header-style brand mark (cube · plato) + site address, drawn at the bottom corner of every image. */

/** Colours of the picture. Dark by default; light when the page being viewed is in light mode. */
const DARK = { bg: '#050b2b', fg: '#fff', mut: '#9fb0e6', dim: '#6f80b8', soft: '#d6defa', lose: '#7f8fc4', panel: '#0e1a58', card: '#142470', head: 'rgba(150,175,255,.1)', line: 'rgba(150,175,255,.12)', line2: 'rgba(150,175,255,.16)', border: 'rgba(150,175,255,.22)', border2: 'rgba(150,175,255,.3)', acc: '#8fb2ff', glow: .13, win: '#5eead4', winBg: 'rgba(34,197,160,.2)' };
const LIGHT = { bg: '#f4eefc', fg: '#2b2160', mut: '#6d62a0', dim: '#8d84b8', soft: '#463b84', lose: '#9a91c2', panel: '#ffffff', card: '#ffffff', head: 'rgba(43,33,96,.06)', line: 'rgba(43,33,96,.08)', line2: 'rgba(43,33,96,.1)', border: 'rgba(43,33,96,.16)', border2: 'rgba(43,33,96,.24)', acc: '#4a5df0', glow: .1, win: '#0f9d76', winBg: 'rgba(15,157,118,.16)' };
let P: typeof DARK = DARK;
/** Light when the bracket page on screen is light (dashboard / public view carry data-st, the main site uses data-hero). */
function pageIsLight() {
  const st = document.querySelector('[data-st]')?.getAttribute('data-st');
  return st ? st === 'light' : document.documentElement.dataset.hero === 'day';
}

const IMG: { cube?: HTMLImageElement } = {};
const loadImg = (src: string) => new Promise<HTMLImageElement | undefined>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(undefined); i.src = src; });
async function preloadBrand() {
  if (IMG.cube) return;
  const b = import.meta.env.BASE_URL;
  try { await document.fonts?.load('500 24px Ubuntu'); } catch { /* optional */ }
  IMG.cube = await loadImg(`${b}brand/cube-v2.png`);
}
function brandMark(c: CanvasRenderingContext2D, W: number, cy: number, rtl: boolean, family: string) {
  const ch = 26, gap = 8;
  const cw = IMG.cube ? (ch * IMG.cube.width) / IMG.cube.height : 0;
  c.save(); c.textBaseline = 'middle'; c.textAlign = 'left';
  c.font = '500 24px Ubuntu, sans-serif'; const pw = c.measureText('plato').width;
  const total = cw + (cw ? gap : 0) + pw;
  let x = (W - total) / 2; // centred under the bracket
  const mid = W / 2;
  c.fillStyle = P.fg;
  if (IMG.cube) {
    const t = document.createElement('canvas'); t.width = Math.ceil(cw * 2); t.height = ch * 2;
    const tc = t.getContext('2d')!; tc.drawImage(IMG.cube, 0, 0, t.width, t.height); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = P.fg; tc.fillRect(0, 0, t.width, t.height);
    c.drawImage(t, x, cy - ch / 2, cw, ch); x += cw + gap;
  }
  c.font = '500 24px Ubuntu, sans-serif'; c.fillText('plato', x, cy + 1);
  c.fillStyle = P.mut; c.font = `600 12px ${family}`; c.textAlign = 'center'; c.fillText('plato-ar.com', mid, cy + 28);
  c.restore();
}

/** Dark page with a soft red glow in the corner where the title sits. */
function bg(c: CanvasRenderingContext2D, W: number, H: number, rtl: boolean) {
  c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
  const R = Math.min(Math.max(W, H) * 0.42, 620), cx = rtl ? W : 0;
  const g = c.createRadialGradient(cx, 0, 0, cx, 0, R); g.addColorStop(0, `rgba(61,123,255,${P.glow})`); g.addColorStop(1, 'rgba(61,123,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const g2 = c.createRadialGradient(W - cx, H, 0, W - cx, H, R * 0.7); g2.addColorStop(0, 'rgba(61,123,255,.04)'); g2.addColorStop(1, 'rgba(61,123,255,0)');
  c.fillStyle = g2; c.fillRect(0, 0, W, H);
}
/** Keeps the canvas inside what browsers (and iPhones: ~16M pixels) can draw, however big the bracket is. */
const fit = (scale: number, W: number, H: number) => Math.min(scale, 8000 / W, 16000 / H, Math.sqrt(16_000_000 / (W * H)));

interface Opts { title: string; lang: 'ar' | 'en'; scale?: number; light?: boolean }

/** Gold trophy drawn on the canvas (no emoji fonts needed), centred at (cx, cy), `size` px square. */
function trophy(c: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  c.save(); c.translate(cx - size / 2, cy - size / 2); c.scale(size / 24, size / 24);
  c.lineWidth = 1.9; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#ffc93c'; c.fillStyle = 'rgba(255,201,60,.25)';
  const cup = new Path2D('M7 3h10v6a5 5 0 0 1-10 0V3Z');
  c.fill(cup); c.stroke(cup);
  c.stroke(new Path2D('M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M10 18h4'));
  c.restore();
}

export async function bracketBlob(br: Bracket, o: Opts): Promise<Blob> {
  try { await document.fonts?.ready; } catch { /* fonts are optional */ }
  await preloadBrand();
  P = o.light ?? pageIsLight() ? LIGHT : DARK;
  if (isLeague(br)) return leagueBlob(br, o);
  if (br.format === 'ffa') return canvasBlob(ffaCanvas(br, o));
  if (br.format === 'groups') return groupsBlob(br, o);
  return canvasBlob(await treeCanvas(br, o));
}
const canvasBlob = (cv: HTMLCanvasElement) => new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/png'));

/** Round robin / swiss: standings table, then every round's matches. */
function leagueBlob(br: Bracket, { title, lang, scale = 2 }: Opts): Promise<Blob> {
  const rtl = lang === 'ar';
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const S = standings(br), rounds = leagueRounds(br);
  const W = 920, RHt = 36, MW = (W - PAD * 2 - 24) / 3, MH = 56, MR = MH / 2;
  const rowsOf = (r: number) => Math.ceil(roundMatches(br, r).length / 3);
  const tableTop = HEAD + 6, tableH = RHt * (S.length + 1);
  let y = tableTop + tableH + 30;
  const secY: number[] = [];
  for (const r of rounds) { secY.push(y); y += 28 + rowsOf(r) * (MH + 12) + 10; }
  const H = y + FOOT;
  const k = fit(scale, W, H);
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const c = cv.getContext('2d')!;
  c.scale(k, k); c.direction = rtl ? 'rtl' : 'ltr';
  const rr = (x: number, y0: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y0, w, h, r); };
  const txt = (str: string, x: number, y0: number, align: 'left' | 'right' | 'center', maxW: number) => {
    let t = str;
    while (t.length > 1 && c.measureText(t).width > maxW) t = t.slice(0, -1);
    c.textAlign = align; c.fillText(t === str ? t : `${t}…`, x, y0);
  };
  // x for the start edge of a box / for text anchored at the start side
  const sx = (x: number, w: number) => (rtl ? W - x - w : x);
  const al = rtl ? 'right' : 'left', alEnd = rtl ? 'left' : 'right';

  bg(c, W, H, rtl); c.fillStyle = '#3d7bff'; c.fillRect(0, 0, W, 4);
  c.fillStyle = P.fg; c.font = `800 28px ${family}`; c.textBaseline = 'alphabetic';
  txt(title, rtl ? W - PAD : PAD, 56, al, W - PAD * 2);
  c.fillStyle = P.mut; c.font = `600 13px ${family}`;
  txt(br.format === 'swiss' ? (rtl ? 'سويسري' : 'Swiss') : (rtl ? 'دوري' : 'Round robin'), rtl ? W - PAD : PAD, 80, al, 300);

  // standings
  const cols = [{ k: '#', w: 40 }, { k: rtl ? 'اللاعب' : 'Player', w: 0 }, { k: rtl ? 'لعب' : 'P', w: 44 }, { k: rtl ? 'فوز' : 'W', w: 44 }, { k: rtl ? 'تعادل' : 'D', w: 44 }, { k: rtl ? 'خسارة' : 'L', w: 44 }, { k: '+/−', w: 56 }, { k: rtl ? 'نقاط' : 'Pts', w: 58 }];
  const TW = W - PAD * 2; cols[1].w = TW - cols.reduce((t, q) => t + q.w, 0);
  rr(PAD, tableTop, TW, tableH, 12); c.fillStyle = P.panel; c.fill();
  c.save(); rr(PAD, tableTop, TW, tableH, 12); c.clip();
  c.fillStyle = P.head; c.fillRect(PAD, tableTop, TW, RHt);
  const champ = champion(br);
  const drawRow = (vals: string[], ry: number, head: boolean, top: boolean) => {
    if (top) { c.fillStyle = 'rgba(61,123,255,.18)'; c.fillRect(PAD, ry, TW, RHt); }
    let off = 0;
    cols.forEach((col, i) => {
      c.fillStyle = head ? P.mut : i === 7 || i === 1 ? P.fg : P.soft;
      c.font = `${head || i === 7 || i === 1 ? 700 : 500} ${head ? 12 : 14}px ${family}`; c.textBaseline = 'middle';
      const bx = sx(PAD + off, col.w);
      if (i === 1) txt(vals[i], rtl ? bx + col.w - 8 : bx + 8, ry + RHt / 2 + 1, al, col.w - 16); else txt(vals[i], bx + col.w / 2, ry + RHt / 2 + 1, 'center', col.w - 4);
      off += col.w;
    });
    if (!head) { c.fillStyle = P.line; c.fillRect(PAD, ry, TW, 1); }
  };
  drawRow(cols.map((q) => q.k), tableTop, true, false);
  S.forEach((q, i) => drawRow([String(i + 1), br.players[q.p] || '—', String(q.played), String(q.w), String(q.d), String(q.l), `${q.gf - q.ga > 0 ? '+' : ''}${q.gf - q.ga}`, String(q.pts)], tableTop + RHt * (i + 1), false, i === 0 && champ !== null));
  c.restore();
  c.lineWidth = 1; c.strokeStyle = P.border; rr(PAD, tableTop, TW, tableH, 12); c.stroke();

  // rounds
  rounds.forEach((r, ri) => {
    const y0 = secY[ri];
    c.fillStyle = P.mut; c.font = `700 12px ${family}`; c.textBaseline = 'middle';
    txt(rtl ? `الجولة ${r}` : `ROUND ${r}`, rtl ? W - PAD : PAD, y0 + 8, al, 300);
    roundMatches(br, r).forEach((m, i) => {
      const col = i % 3, row = Math.floor(i / 3), bx = sx(PAD + col * (MW + 12), MW), by = y0 + 28 + row * (MH + 12);
      const bye = 'bye' in m.a || 'bye' in m.b, o = outcome(br, m), live = isCurrent(br, m.id) && !o;
      c.globalAlpha = bye ? 0.5 : 1;
      rr(bx, by, MW, MH, 10); c.fillStyle = P.card; c.fill();
      c.save(); rr(bx, by, MW, MH, 10); c.clip();
      (['a', 'b'] as const).forEach((sd, i2) => {
        const slot = m[sd], isBye = 'bye' in slot, yy = by + i2 * MR, win = (o === sd) || (bye && !isBye && br.format === 'swiss'), lose = !!o && o !== sd && o !== 'draw';
        if (win && o !== 'draw') { c.fillStyle = P.winBg; c.fillRect(bx, yy, MW, MR); }
        c.fillStyle = win && o !== 'draw' ? P.fg : lose || isBye ? P.lose : P.soft; c.font = `${win ? 700 : 500} 13px ${family}`; c.textBaseline = 'middle';
        txt(isBye ? 'BYE' : br.players[(slot as { p: number }).p] || '—', rtl ? bx + MW - 10 : bx + 10, yy + MR / 2 + 1, al, MW - 52);
        const sc = m[sd === 'a' ? 'sa' : 'sb'];
        if (sc && !bye) { c.font = `800 14px ${family}`; c.fillStyle = P.fg; txt(sc, rtl ? bx + 10 : bx + MW - 10, yy + MR / 2 + 1, alEnd, 34); }
      });
      c.fillStyle = P.line2; c.fillRect(bx, by + MR, MW, 1);
      c.restore();
      c.lineWidth = live ? 2.5 : 1; c.strokeStyle = live ? '#3d7bff' : P.border; rr(bx, by, MW, MH, 10); c.stroke();
      c.globalAlpha = 1;
    });
  });

  if (champ !== null) {
    const w = Math.min(TW, 360), x = rtl ? W - PAD - w : PAD, yy = H - FOOT - 4;
    c.fillStyle = P.fg; c.font = `800 15px ${family}`; c.textBaseline = 'middle';
    trophy(c, rtl ? x + w - 10 : x + 10, yy, 19); txt(br.players[champ], rtl ? x + w - 30 : x + 30, yy, al, w - 30);
  }
  c.fillStyle = P.dim; c.font = `600 12px ${family}`; c.textBaseline = 'middle';
  brandMark(c, W, H - 46, rtl, family);
  c.textAlign = 'start';
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/png'));
}

async function treeCanvas(br: Bracket, { title, lang, scale = 2 }: Opts): Promise<HTMLCanvasElement> {
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
  const TOP = HEAD + 34, OFF = double ? 44 : 26;   // room for the round names above the first match
  const wBottom = place(L.winners, TOP + OFF);
  const lTop = wBottom + 46;
  const lBottom = L.losers.length ? place(L.losers, lTop + OFF) : wBottom;
  const cols = Math.max(L.winners.length, L.losers.length);
  let bottom = Math.max(wBottom, lBottom);
  if (L.final) {
    const fs = [L.final.a, L.final.b].map((s) => ('w' in s ? pos.get(s.w) : undefined)).filter(Boolean) as { x: number; y: number }[];
    const y = fs.length ? fs.reduce((t, f) => t + f.y, 0) / fs.length : HEAD;
    pos.set(L.final.id, { x: cols * (CW + GX), y });
  }
  const champ = champion(br);
  const lastId = L.final ? L.final.id : L.winners[L.winners.length - 1]?.[0]?.id;
  const champCol = cols + (L.final ? 1 : 0);   // the champion sits right after the last match
  const W = PAD * 2 + (champCol + (champ !== null ? 1 : 0)) * (CW + GX) - GX;
  const H = bottom + FOOT;
  const k = fit(scale, W, H);
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const c = cv.getContext('2d')!;
  c.scale(k, k);
  c.direction = rtl ? 'rtl' : 'ltr';

  const X = (x: number, w = CW) => (rtl ? W - PAD - x - w : PAD + x);
  const rr = (x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const txt = (s: string, x: number, y: number, align: 'start' | 'end' | 'left' | 'right' | 'center', maxW: number) => {
    let t = s;
    while (t.length > 1 && c.measureText(t).width > maxW) t = t.slice(0, -1);
    c.textAlign = align; c.fillText(t === s ? t : `${t}…`, x, y);
  };

  bg(c, W, H, rtl);
  c.fillStyle = '#3d7bff'; c.fillRect(0, 0, W, 4);
  // title
  c.fillStyle = P.fg; c.font = `800 28px ${family}`; c.textBaseline = 'alphabetic';
  txt(title, rtl ? W - PAD : PAD, 56, 'start', W - PAD * 2);
  c.fillStyle = P.mut; c.font = `600 13px ${family}`;
  const n = br.players.length;
  const cnt = rtl ? `${n} ${n <= 2 ? 'لاعبان' : n <= 10 ? 'لاعبين' : 'لاعباً'}` : `${n} players`;
  const when = new Date().toLocaleDateString(rtl ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtName = double ? (rtl ? 'خروج مزدوج' : 'Double elimination') : (rtl ? 'خروج المغلوب' : 'Single elimination');
  txt(`${fmtName}  ·  ${cnt}  ·  ${when}`, rtl ? W - PAD : PAD, 82, 'start', W - PAD * 2);

  // section + round names above every column
  c.fillStyle = P.mut; c.font = `700 12px ${family}`;
  if (double) {
    txt(rtl ? 'فرع الفائزين' : 'WINNERS BRACKET', rtl ? W - PAD : PAD, TOP + 10, 'start', 300);
    if (L.losers.length) txt(rtl ? 'فرع الخاسرين' : 'LOSERS BRACKET', rtl ? W - PAD : PAD, lTop + 10, 'start', 300);
  }
  const colName = (name: string, ci: number, y: number) => { c.fillStyle = P.mut; c.font = `700 13px ${family}`; c.textBaseline = 'middle'; txt(name, X(ci * (CW + GX)) + CW / 2, y, 'center', CW); };
  const rn = (lang2: 'ar' | 'en', side: 'W' | 'L', round: number, total: number) => {
    const left = total - round;
    if (side === 'L') return lang2 === 'ar' ? `الخاسرين ${round}` : `Losers R${round}`;
    if (left === 0) return lang2 === 'ar' ? 'النهائي' : 'Final';
    if (left === 1) return lang2 === 'ar' ? 'نصف النهائي' : 'Semifinals';
    if (left === 2) return lang2 === 'ar' ? 'ربع النهائي' : 'Quarterfinals';
    return lang2 === 'ar' ? `الجولة ${round}` : `Round ${round}`;
  };
  L.winners.forEach((ms, ci) => colName(rn(lang, 'W', ms[0].round, L.winners.length), ci, TOP + OFF - 14));
  L.losers.forEach((ms, ci) => colName(rn(lang, 'L', ms[0].round, L.losers.length), ci, lTop + OFF - 14));
  if (L.final) colName(rtl ? 'النهائي الكبير' : 'Grand Final', cols, (pos.get(L.final.id)?.y ?? TOP) - 14);

  // connectors
  c.lineWidth = 1.5;
  for (const m of br.matches) {
    const to = pos.get(m.id); if (!to) continue;
    for (const s of [m.a, m.b]) {
      if (!('w' in s)) continue;
      const from = pos.get(s.w); if (!from) continue;
      const x1 = rtl ? X(from.x) : X(from.x) + CW, x2 = rtl ? X(to.x) + CW : X(to.x), y1 = from.y + RH, y2 = to.y + RH, mx = (x1 + x2) / 2;
      c.strokeStyle = R.get(s.w)?.win != null ? '#3d7bff' : P.border2;
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
    rr(x, p.y, CW, CH, 10); c.fillStyle = P.card; c.fill();
    c.save(); rr(x, p.y, CW, CH, 10); c.clip();
    ([['a', r.a, m.sa], ['b', r.b, m.sb]] as const).forEach(([side, w, sc], i) => {
      const y = p.y + i * RH, win = !isBye && m.win === side, lose = !isBye && !!m.win && !win;
      if (win) { c.fillStyle = P.winBg; c.fillRect(x, y, CW, RH); }
      c.fillStyle = win ? P.fg : lose || typeof w !== 'number' ? P.lose : P.soft;
      c.font = `${win ? 700 : 500} 14px ${family}`; c.textBaseline = 'middle';
      txt(nm(w), rtl ? x + CW - 12 : x + 12, y + RH / 2 + 1, 'start', CW - 56);
      if (sc || win) { c.font = `800 14px ${family}`; c.fillStyle = win && !sc ? P.win : P.fg; c.textAlign = 'end'; txt(sc || '✓', rtl ? x + 12 : x + CW - 12, y + RH / 2 + 1, rtl ? 'start' : 'end', 30); }
    });
    c.fillStyle = P.line2; c.fillRect(x, p.y + RH, CW, 1);
    c.restore();
    c.lineWidth = live ? 2.5 : 1; c.strokeStyle = live ? '#3d7bff' : P.border; rr(x, p.y, CW, CH, 10); c.stroke();
    if (live) { c.fillStyle = '#3d7bff'; c.font = `800 10px ${family}`; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillRect(x + CW / 2 - 24, p.y - 8, 48, 16); c.fillStyle = '#fff'; c.fillText(rtl ? 'الآن' : 'LIVE', x + CW / 2, p.y); }
    c.globalAlpha = 1;
  }

  // champion: next to the last match, joined to it by a line
  const lp = lastId ? pos.get(lastId) : undefined;
  if (champ !== null && lp) {
    const x = X(champCol * (CW + GX)), y = lp.y;
    const lx1 = rtl ? X(lp.x) : X(lp.x) + CW, lx2 = rtl ? x + CW : x;
    c.lineWidth = 1.5; c.strokeStyle = '#3d7bff'; c.beginPath(); c.moveTo(lx1, y + RH); c.lineTo(lx2, y + RH); c.stroke();
    c.save(); c.shadowColor = 'rgba(61,123,255,.5)'; c.shadowBlur = 26;
    rr(x, y, CW, CH, 14);
    const gr = c.createLinearGradient(x, y, x + CW, y + CH); gr.addColorStop(0, '#1a1f6a'); gr.addColorStop(1, '#0b0f3a');
    c.fillStyle = gr; c.fill(); c.restore();
    c.lineWidth = 2.5; c.strokeStyle = '#3d7bff'; rr(x, y, CW, CH, 14); c.stroke();
    c.fillStyle = '#fff'; c.textBaseline = 'middle';
    trophy(c, x + CW / 2, y + 20, 22);
    c.font = `800 17px ${family}`; txt(br.players[champ], x + CW / 2, y + 45, 'center', CW - 24);
  }
  c.fillStyle = P.dim; c.font = `600 12px ${family}`; c.textBaseline = 'middle';
  brandMark(c, W, H - 46, rtl, family);
  c.textAlign = 'start';
  return cv;
}

/** Small canvas helper: a dark card with a title bar, used by the leaderboard and group-table images. */
function tableCanvas(opts: { title: string; sub: string; lang: 'ar' | 'en'; scale: number; blocks: { label?: string; head: string[]; rows: string[][]; widths: number[]; hi?: number; hiColor?: string }[]; footer: boolean; champ?: string }): HTMLCanvasElement {
  const { lang, scale } = opts, rtl = lang === 'ar';
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const W = 920, RHt = 34;
  const tops: number[] = [];
  let y = HEAD - 6;
  for (const b of opts.blocks) { y += b.label ? 26 : 0; tops.push(y); y += RHt * (b.rows.length + 1) + 22; }
  const H = y + (opts.champ ? 50 : 0) + (opts.footer ? FOOT : 20);
  const k = fit(scale, W, H);
  const cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const c = cv.getContext('2d')!; c.scale(k, k); c.direction = rtl ? 'rtl' : 'ltr';
  const al = rtl ? 'right' : 'left';
  const rr = (x: number, y0: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y0, w, h, r); };
  const txt = (str: string, x: number, y0: number, align: 'left' | 'right' | 'center', maxW: number) => { let t = str; while (t.length > 1 && c.measureText(t).width > maxW) t = t.slice(0, -1); c.textAlign = align; c.fillText(t === str ? t : `${t}…`, x, y0); };
  bg(c, W, H, rtl); c.fillStyle = '#3d7bff'; c.fillRect(0, 0, W, 4);
  c.fillStyle = P.fg; c.font = `800 28px ${family}`; c.textBaseline = 'alphabetic'; txt(opts.title, rtl ? W - PAD : PAD, 56, al, W - PAD * 2);
  c.fillStyle = P.mut; c.font = `600 13px ${family}`; txt(opts.sub, rtl ? W - PAD : PAD, 80, al, 400);
  const TW = W - PAD * 2;
  opts.blocks.forEach((b, bi) => {
    const top = tops[bi], th = RHt * (b.rows.length + 1);
    if (b.label) { c.fillStyle = P.mut; c.font = `700 12px ${family}`; c.textBaseline = 'middle'; txt(b.label, rtl ? W - PAD : PAD, top - 12, al, 300); }
    const widths = [...b.widths]; widths[1] = TW - widths.reduce((t, w, i) => (i === 1 ? t : t + w), 0);
    rr(PAD, top, TW, th, 12); c.fillStyle = P.panel; c.fill();
    c.save(); rr(PAD, top, TW, th, 12); c.clip();
    c.fillStyle = P.head; c.fillRect(PAD, top, TW, RHt);
    [b.head, ...b.rows].forEach((vals, ri) => {
      const ry = top + ri * RHt, head = ri === 0;
      if (!head && b.hi !== undefined && ri - 1 < b.hi) { c.fillStyle = b.hiColor ?? 'rgba(61,123,255,.18)'; c.fillRect(PAD, ry, TW, RHt); }
      let off = 0;
      vals.forEach((v, i) => {
        const w = widths[i]; const bx = rtl ? W - PAD - off - w : PAD + off;
        c.fillStyle = head ? P.mut : i === 1 || i === vals.length - 1 ? P.fg : P.soft;
        c.font = `${head || i === 1 || i === vals.length - 1 ? 700 : 500} ${head ? 12 : 14}px ${family}`; c.textBaseline = 'middle';
        if (i === 1) txt(v, rtl ? bx + w - 8 : bx + 8, ry + RHt / 2 + 1, al, w - 16); else txt(v, bx + w / 2, ry + RHt / 2 + 1, 'center', w - 4);
        off += w;
      });
      if (!head) { c.fillStyle = P.line; c.fillRect(PAD, ry, TW, 1); }
    });
    c.restore(); c.lineWidth = 1; c.strokeStyle = P.border; rr(PAD, top, TW, th, 12); c.stroke();
  });
  if (opts.champ) { c.fillStyle = P.fg; c.font = `800 15px ${family}`; c.textBaseline = 'middle'; const cy = H - (opts.footer ? FOOT : 20) - 24; trophy(c, rtl ? W - PAD - 10 : PAD + 10, cy, 19); txt(opts.champ, rtl ? W - PAD - 30 : PAD + 30, cy, al, TW - 30); }
  if (opts.footer) { c.fillStyle = P.dim; c.font = `600 12px ${family}`; c.textBaseline = 'middle'; brandMark(c, W, H - 46, rtl, family); }
  c.textAlign = 'start';
  return cv;
}

/** Leaderboard: ranking + the score of every round. */
function ffaCanvas(br: Bracket, { title, lang, scale = 2 }: Opts): HTMLCanvasElement {
  const ar = lang === 'ar', R = br.fs ?? [], rows = ffaRows(br), ch = ffaChampion(br);
  const head = ['#', ar ? 'اللاعب' : 'Player', ...R.map((_, i) => (ar ? `ج${i + 1}` : `R${i + 1}`)), ar ? 'المجموع' : 'Total'];
  const rw = Math.max(40, Math.min(70, Math.floor(520 / Math.max(1, R.length))));
  return tableCanvas({ title, lang, scale, footer: true, sub: (ar ? 'لوحة صدارة' : 'Leaderboard') + (br.opts?.low ? (ar ? ' · الأقل أفضل' : ' · lower is better') : ''), champ: ch !== null ? br.players[ch] : undefined,
    blocks: [{ head, widths: [40, 0, ...R.map(() => rw), 80], hi: ch !== null ? 1 : undefined, rows: rows.map((r, i) => [String(i + 1), br.players[r.p], ...R.map((x) => x[r.p] || '–'), String(r.total)]) }] });
}

/** Groups: the tables of every group, then the knockout tree (if started) underneath. */
async function groupsBlob(br: Bracket, o: Opts): Promise<Blob> {
  const ar = o.lang === 'ar', adv = br.opts?.adv ?? 2;
  const blocks = (br.groups ?? []).map((_, g) => {
    const sb = groupSub(br, g), S = standings(sb);
    return { label: `${ar ? 'المجموعة' : 'GROUP'} ${groupLabel(g)}`, head: ['#', ar ? 'اللاعب' : 'Player', ar ? 'لعب' : 'P', ar ? 'فوز' : 'W', ar ? 'تعادل' : 'D', ar ? 'خسارة' : 'L', '+/−', ar ? 'نقاط' : 'Pts'], widths: [40, 0, 44, 44, 44, 44, 56, 58], hi: adv, hiColor: 'rgba(39,194,122,.16)',
      rows: S.map((s, i) => [String(i + 1), sb.players[s.p], String(s.played), String(s.w), String(s.d), String(s.l), `${s.gf - s.ga > 0 ? '+' : ''}${s.gf - s.ga}`, String(s.pts)]) };
  });
  const k = koSub(br), ch = champion(br);
  const top = tableCanvas({ title: o.title, lang: o.lang, scale: o.scale ?? 2, footer: !k, sub: ar ? 'مجموعات ثم إقصائيات' : 'Groups & knockout', blocks, champ: !k && ch !== null ? br.players[ch] : undefined });
  if (!k) return canvasBlob(top);
  const tree = await treeCanvas(k, { ...o, title: ar ? 'الإقصائيات' : 'Knockout' });
  const W = Math.max(top.width, tree.width), H = top.height + tree.height;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!; c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
  c.drawImage(top, ar ? W - top.width : 0, 0); c.drawImage(tree, ar ? W - tree.width : 0, top.height);
  return canvasBlob(cv);
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
