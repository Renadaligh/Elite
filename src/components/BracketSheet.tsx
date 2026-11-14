import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { hasBye, isCurrent, layout, resolve, type BMatch, type Bracket, type Who } from '../data/bracket';

/** The whole bracket on one white "sheet", drawn as an SVG (like a printable bracket image): crisp at any zoom.
 *  Phone: fits the screen width, pinch to zoom. Desktop: as large as readable; if wider than the page, hold the mouse and drag sideways. */
const BW = 232, SEED = 28, RH = 25, GAP = 66, NUMW = 24, P = 72, HEAD = 30, SEC_GAP = 56, PAD = 10;

function rName(ar: boolean, br: 'W' | 'L', round: number, total: number) {
  if (br === 'L') return ar ? `الخاسرين ${round}` : `Losers R${round}`;
  const left = total - round;
  if (left === 0) return ar ? 'النهائي' : 'Final';
  if (left === 1) return ar ? 'نصف النهائي' : 'Semifinals';
  if (left === 2) return ar ? 'ربع النهائي' : 'Quarterfinals';
  return ar ? `الجولة ${round}` : `Round ${round}`;
}

interface Pos { x: number; y: number }

export default function BracketSheet({ bracket, title, lang }: { bracket: Bracket; title: string; lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const wrap = useRef<HTMLDivElement>(null);
  const scr = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  const [phone, setPhone] = useState(false);

  const g = useMemo(() => {
    const L = layout(bracket);
    const R = resolve(bracket);
    const pos = new Map<string, Pos>();
    const nums = new Map<string, number>();
    let n = 0;
    const heads: { x: number; y: number; label: string }[] = [];
    const place = (rounds: BMatch[][], y0: number, tag: 'W' | 'L') => {
      let bottom = y0;
      rounds.forEach((ms, r) => {
        const x = PAD + r * (BW + NUMW + GAP);
        if (ms.some((m) => !hasBye(R, m.id))) heads.push({ x, y: y0 - HEAD, label: rName(ar, tag, ms[0].round, rounds.length) });
        ms.forEach((m, i) => {
          if (!hasBye(R, m.id)) nums.set(m.id, ++n);
          const fy = [m.a, m.b].map((s) => ('w' in s ? pos.get(s.w) : undefined)).filter((p): p is Pos => !!p);
          const y = fy.length === 2 ? (fy[0].y + fy[1].y) / 2 : fy.length === 1 ? fy[0].y : y0 + (i + 0.5) * P * (r === 0 || !rounds[r - 1] ? 1 : Math.max(1, rounds[r - 1].length / ms.length));
          pos.set(m.id, { x, y });
          bottom = Math.max(bottom, y + RH + 8);
        });
      });
      return bottom;
    };
    const top = PAD + HEAD;
    let bottom = place(L.winners, top, 'W');
    let cols = L.winners.length;
    if (L.losers.length) {
      const y0 = bottom + SEC_GAP + HEAD;
      bottom = place(L.losers, y0, 'L');
      cols = Math.max(cols, L.losers.length);
    }
    if (L.final) {
      const feeders = [L.final.a, L.final.b].map((s) => ('w' in s ? pos.get(s.w) : undefined)).filter((p): p is Pos => !!p);
      const x = PAD + cols * (BW + NUMW + GAP);
      const y = feeders.length ? feeders.reduce((a, p) => a + p.y, 0) / feeders.length : top + P / 2;
      pos.set(L.final.id, { x, y }); nums.set(L.final.id, ++n);
      heads.push({ x, y: top - HEAD, label: ar ? 'النهائي الكبير' : 'Grand final' });
      cols += 1;
    }
    const W = PAD * 2 + cols * (BW + NUMW + GAP) - GAP;
    return { L, R, pos, nums, heads, W, H: bottom + PAD };
  }, [bracket, ar]);

  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const q = window.matchMedia('(max-width: 767px)');
    const on = () => { setAvail(el.clientWidth); setPhone(q.matches); };
    on();
    const ro = new ResizeObserver(on); ro.observe(el);
    q.addEventListener('change', on);
    return () => { ro.disconnect(); q.removeEventListener('change', on); };
  }, []);

  // desktop: hold the mouse and drag to move sideways when the bracket is wider than the page
  useEffect(() => {
    const el = scr.current; if (!el) return;
    let on = false, moved = false, sx = 0, sl = 0;
    const down = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth) return; on = true; moved = false; sx = e.clientX; sl = el.scrollLeft; };
    const move = (e: PointerEvent) => { if (!on) return; const dx = e.clientX - sx; if (!moved && Math.abs(dx) < 4) return; moved = true; el.classList.add('is-panning'); el.scrollLeft = sl - dx; };
    const up = () => { on = false; el.classList.remove('is-panning'); };
    el.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const inner = Math.max(0, avail - 28);
  const fitS = inner > 0 ? inner / g.W : 1;
  const scale = phone ? Math.min(1, fitS) : Math.min(1, Math.max(0.66, fitS));
  const name = (w: Who) => (typeof w === 'number' ? bracket.players[w] ?? '' : w === 'bye' ? 'BYE' : '');
  const seed = (w: Who) => (typeof w === 'number' ? String(w + 1) : '');

  const matchEl = (m: BMatch) => {
    const p = g.pos.get(m.id)!; const r = g.R.get(m.id);
    if (!r) return null;
    const rows = [{ w: r.a, win: m.win === 'a' || (r.win === r.a && r.a !== null && r.b === 'bye'), sc: m.sa }, { w: r.b, win: m.win === 'b' || (r.win === r.b && r.b !== null && r.a === 'bye'), sc: m.sb }];
    const hasWin = !!m.win;
    return (
      <g key={m.id}>
        {isCurrent(bracket, m.id) && !m.win && <text className="bs-live" x={p.x} y={p.y - RH - 4} fontSize="10" fontWeight="800">● LIVE</text>}
        {rows.map((row, k) => {
          const y = p.y - RH + k * RH;
          const bye = row.w === 'bye';
          return (
            <g key={k}>
              <rect className="bs-seed" x={p.x} y={y + 1} width={SEED} height={RH - 2} />
              <text className="bs-sn" x={p.x + SEED / 2} y={y + RH / 2 + 4} fontSize="11" textAnchor="middle">{seed(row.w)}</text>
              <rect className={row.win ? 'bs-row win' : 'bs-row'} x={p.x + SEED} y={y + 1} width={BW - SEED} height={RH - 2} />
              <svg x={p.x + SEED + 8} y={y + 1} width={BW - SEED - 40} height={RH - 2} overflow="hidden">
                <text className={`bs-nm${row.win ? ' win' : ''}${bye ? ' bye' : hasWin && !row.win ? ' lose' : ''}`} x="0" y={RH / 2 + 3} fontSize="13">{name(row.w)}</text>
              </svg>
              {row.sc ? <text className="bs-sc" x={p.x + BW - 8} y={y + RH / 2 + 4} fontSize="12" fontWeight="700" textAnchor="end">{row.sc}</text> : row.win && m.win ? <text className="bs-ck" x={p.x + BW - 9} y={y + RH / 2 + 4} fontSize="12" fontWeight="800" textAnchor="end">✓</text> : null}
            </g>
          );
        })}
        <text className="bs-no" x={p.x + BW + 5} y={p.y + 4} fontSize="10">{g.nums.get(m.id)}</text>
      </g>
    );
  };
  const lines: JSX.Element[] = [];
  for (const m of bracket.matches) {
    const c = g.pos.get(m.id); if (!c || hasBye(g.R, m.id)) continue;
    const xs = [m.a, m.b].map((s) => ('w' in s && !hasBye(g.R, s.w) ? g.pos.get(s.w) : undefined)).filter((q): q is Pos => !!q);
    for (const f of xs) {
      const x1 = f.x + BW + NUMW, x2 = c.x, xm = x1 + (x2 - x1) / 2;
      lines.push(<path key={`${m.id}-${f.x}-${f.y}`} d={`M${x1},${f.y} H${xm} V${c.y} H${x2}`} className="bs-ln" fill="none" strokeWidth="1" />);
    }
  }
  const all = [...g.L.winners.flat(), ...g.L.losers.flat(), ...(g.L.final ? [g.L.final] : [])].filter((m) => !hasBye(g.R, m.id));

  return (
    <div ref={wrap} className="bs-sheet" dir="ltr">
      <div className="bs-top"><b dir="auto">{title}</b><span>plato-ar.com</span></div>
      <div ref={scr} className="bs-scroll">
        <svg width={g.W * scale} height={g.H * scale} viewBox={`0 0 ${g.W} ${g.H}`} role="img" aria-label={title} fontFamily="Outfit, Tajawal, system-ui, sans-serif">
          {g.heads.map((h, i) => (
            <g key={i}><rect className="bs-hd" x={h.x} y={h.y} width={BW} height={HEAD - 6} rx="6" /><text className="bs-ht" x={h.x + BW / 2} y={h.y + (HEAD - 6) / 2 + 4} fontSize="12" fontWeight="600" textAnchor="middle">{h.label}</text></g>
          ))}
          {lines}
          {all.map(matchEl)}
        </svg>
      </div>
    </div>
  );
}
