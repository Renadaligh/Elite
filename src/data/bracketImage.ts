import { champion, ffaChampion, ffaRows, groupLabel, groupSub, isCurrent, isLeague, koSub, layout, leagueRounds, outcome, resolve, roundMatches, standings, type BMatch, type Bracket, type Who } from './bracket';

/** Draws a bracket straight onto a canvas (no libraries), so "save as image" works the same everywhere. */
const CW = 210, CH = 62, RH = CH / 2, GX = 60, GY = 18, PAD = 36, HEAD = 96, FOOT = 56;

interface Opts { title: string; lang: 'ar' | 'en'; scale?: number }

export async function bracketBlob(br: Bracket, o: Opts): Promise<Blob> {
  try { await document.fonts?.ready; } catch { /* fonts are optional */ }
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
  const k = Math.min(scale, 8000 / W, 16000 / H);
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

  c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#ff3347'; c.fillRect(0, 0, W, 4);
  c.fillStyle = '#fff'; c.font = `800 28px ${family}`; c.textBaseline = 'alphabetic';
  txt(title, rtl ? W - PAD : PAD, 56, al, W - PAD * 2);
  c.fillStyle = '#9aa0b8'; c.font = `600 13px ${family}`;
  txt(br.format === 'swiss' ? (rtl ? 'سويسري' : 'Swiss') : (rtl ? 'دوري' : 'Round robin'), rtl ? W - PAD : PAD, 80, al, 300);

  // standings
  const cols = [{ k: '#', w: 40 }, { k: rtl ? 'اللاعب' : 'Player', w: 0 }, { k: rtl ? 'لعب' : 'P', w: 44 }, { k: rtl ? 'فوز' : 'W', w: 44 }, { k: rtl ? 'تعادل' : 'D', w: 44 }, { k: rtl ? 'خسارة' : 'L', w: 44 }, { k: '+/−', w: 56 }, { k: rtl ? 'نقاط' : 'Pts', w: 58 }];
  const TW = W - PAD * 2; cols[1].w = TW - cols.reduce((t, q) => t + q.w, 0);
  rr(PAD, tableTop, TW, tableH, 12); c.fillStyle = '#101016'; c.fill();
  c.save(); rr(PAD, tableTop, TW, tableH, 12); c.clip();
  c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(PAD, tableTop, TW, RHt);
  const champ = champion(br);
  const drawRow = (vals: string[], ry: number, head: boolean, top: boolean) => {
    if (top) { c.fillStyle = 'rgba(255,51,71,.18)'; c.fillRect(PAD, ry, TW, RHt); }
    let off = 0;
    cols.forEach((col, i) => {
      c.fillStyle = head ? '#9aa0b8' : i === 7 || i === 1 ? '#fff' : '#d8d8e4';
      c.font = `${head || i === 7 || i === 1 ? 700 : 500} ${head ? 12 : 14}px ${family}`; c.textBaseline = 'middle';
      const bx = sx(PAD + off, col.w);
      if (i === 1) txt(vals[i], rtl ? bx + col.w - 8 : bx + 8, ry + RHt / 2 + 1, al, col.w - 16); else txt(vals[i], bx + col.w / 2, ry + RHt / 2 + 1, 'center', col.w - 4);
      off += col.w;
    });
    if (!head) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(PAD, ry, TW, 1); }
  };
  drawRow(cols.map((q) => q.k), tableTop, true, false);
  S.forEach((q, i) => drawRow([String(i + 1), br.players[q.p] || '—', String(q.played), String(q.w), String(q.d), String(q.l), `${q.gf - q.ga > 0 ? '+' : ''}${q.gf - q.ga}`, String(q.pts)], tableTop + RHt * (i + 1), false, i === 0 && champ !== null));
  c.restore();
  c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.14)'; rr(PAD, tableTop, TW, tableH, 12); c.stroke();

  // rounds
  rounds.forEach((r, ri) => {
    const y0 = secY[ri];
    c.fillStyle = '#9aa0b8'; c.font = `700 12px ${family}`; c.textBaseline = 'middle';
    txt(rtl ? `الجولة ${r}` : `ROUND ${r}`, rtl ? W - PAD : PAD, y0 + 8, al, 300);
    roundMatches(br, r).forEach((m, i) => {
      const col = i % 3, row = Math.floor(i / 3), bx = sx(PAD + col * (MW + 12), MW), by = y0 + 28 + row * (MH + 12);
      const bye = 'bye' in m.a || 'bye' in m.b, o = outcome(br, m), live = isCurrent(br, m.id) && !o;
      c.globalAlpha = bye ? 0.5 : 1;
      rr(bx, by, MW, MH, 10); c.fillStyle = '#14141a'; c.fill();
      c.save(); rr(bx, by, MW, MH, 10); c.clip();
      (['a', 'b'] as const).forEach((sd, i2) => {
        const slot = m[sd], isBye = 'bye' in slot, yy = by + i2 * MR, win = (o === sd) || (bye && !isBye && br.format === 'swiss'), lose = !!o && o !== sd && o !== 'draw';
        if (win && o !== 'draw') { c.fillStyle = 'rgba(255,51,71,.2)'; c.fillRect(bx, yy, MW, MR); }
        c.fillStyle = win && o !== 'draw' ? '#fff' : lose || isBye ? '#8b90a6' : '#e8e8f0'; c.font = `${win ? 700 : 500} 13px ${family}`; c.textBaseline = 'middle';
        txt(isBye ? 'BYE' : br.players[(slot as { p: number }).p] || '—', rtl ? bx + MW - 10 : bx + 10, yy + MR / 2 + 1, al, MW - 52);
        const sc = m[sd === 'a' ? 'sa' : 'sb'];
        if (sc && !bye) { c.font = `800 14px ${family}`; c.fillStyle = '#fff'; txt(sc, rtl ? bx + 10 : bx + MW - 10, yy + MR / 2 + 1, alEnd, 34); }
      });
      c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(bx, by + MR, MW, 1);
      c.restore();
      c.lineWidth = live ? 2.5 : 1; c.strokeStyle = live ? '#ff3347' : 'rgba(255,255,255,.14)'; rr(bx, by, MW, MH, 10); c.stroke();
      c.globalAlpha = 1;
    });
  });

  if (champ !== null) {
    const w = Math.min(TW, 360), x = rtl ? W - PAD - w : PAD, yy = H - FOOT - 4;
    c.fillStyle = '#fff'; c.font = `800 15px ${family}`; c.textBaseline = 'middle';
    txt(`🏆  ${br.players[champ]}`, rtl ? x + w : x, yy, al, w);
  }
  c.fillStyle = '#6c7088'; c.font = `600 12px ${family}`; c.textBaseline = 'middle';
  txt('Elite · plato-ar.com', rtl ? PAD : W - PAD, H - 22, rtl ? 'left' : 'right', 260);
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
  const k = Math.min(scale, 8000 / W, 16000 / H);
  const cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const c = cv.getContext('2d')!; c.scale(k, k); c.direction = rtl ? 'rtl' : 'ltr';
  const al = rtl ? 'right' : 'left';
  const rr = (x: number, y0: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y0, w, h, r); };
  const txt = (str: string, x: number, y0: number, align: 'left' | 'right' | 'center', maxW: number) => { let t = str; while (t.length > 1 && c.measureText(t).width > maxW) t = t.slice(0, -1); c.textAlign = align; c.fillText(t === str ? t : `${t}…`, x, y0); };
  c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H); c.fillStyle = '#ff3347'; c.fillRect(0, 0, W, 4);
  c.fillStyle = '#fff'; c.font = `800 28px ${family}`; c.textBaseline = 'alphabetic'; txt(opts.title, rtl ? W - PAD : PAD, 56, al, W - PAD * 2);
  c.fillStyle = '#9aa0b8'; c.font = `600 13px ${family}`; txt(opts.sub, rtl ? W - PAD : PAD, 80, al, 400);
  const TW = W - PAD * 2;
  opts.blocks.forEach((b, bi) => {
    const top = tops[bi], th = RHt * (b.rows.length + 1);
    if (b.label) { c.fillStyle = '#9aa0b8'; c.font = `700 12px ${family}`; c.textBaseline = 'middle'; txt(b.label, rtl ? W - PAD : PAD, top - 12, al, 300); }
    const widths = [...b.widths]; widths[1] = TW - widths.reduce((t, w, i) => (i === 1 ? t : t + w), 0);
    rr(PAD, top, TW, th, 12); c.fillStyle = '#101016'; c.fill();
    c.save(); rr(PAD, top, TW, th, 12); c.clip();
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(PAD, top, TW, RHt);
    [b.head, ...b.rows].forEach((vals, ri) => {
      const ry = top + ri * RHt, head = ri === 0;
      if (!head && b.hi !== undefined && ri - 1 < b.hi) { c.fillStyle = b.hiColor ?? 'rgba(255,51,71,.18)'; c.fillRect(PAD, ry, TW, RHt); }
      let off = 0;
      vals.forEach((v, i) => {
        const w = widths[i]; const bx = rtl ? W - PAD - off - w : PAD + off;
        c.fillStyle = head ? '#9aa0b8' : i === 1 || i === vals.length - 1 ? '#fff' : '#d8d8e4';
        c.font = `${head || i === 1 || i === vals.length - 1 ? 700 : 500} ${head ? 12 : 14}px ${family}`; c.textBaseline = 'middle';
        if (i === 1) txt(v, rtl ? bx + w - 8 : bx + 8, ry + RHt / 2 + 1, al, w - 16); else txt(v, bx + w / 2, ry + RHt / 2 + 1, 'center', w - 4);
        off += w;
      });
      if (!head) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(PAD, ry, TW, 1); }
    });
    c.restore(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.14)'; rr(PAD, top, TW, th, 12); c.stroke();
  });
  if (opts.champ) { c.fillStyle = '#fff'; c.font = `800 15px ${family}`; c.textBaseline = 'middle'; txt(`🏆  ${opts.champ}`, rtl ? W - PAD : PAD, H - (opts.footer ? FOOT : 20) - 24, al, TW); }
  if (opts.footer) { c.fillStyle = '#6c7088'; c.font = `600 12px ${family}`; c.textBaseline = 'middle'; txt('Elite · plato-ar.com', rtl ? PAD : W - PAD, H - 22, rtl ? 'left' : 'right', 260); }
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
  const c = cv.getContext('2d')!; c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H);
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
