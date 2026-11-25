import { useEffect, useLayoutEffect, useMemo, useRef, useState, Fragment, type CSSProperties } from 'react';
import { PencilIcon, TrophyIcon } from './icons';
import { champion, hasBye, isDraft, isLeague, layout, matchNumbers, packSlots, nameKey, resolve, setWinner, type BMatch, type Bracket, type Resolved, type SeatRef, type Who } from '../data/bracket';
import { useI18n } from '../i18n/I18nProvider';
import LeagueView from './LeagueView';
import FfaView from './FfaView';
import GroupsView from './GroupsView';
import { DraftBox } from './AddPlayers';
import MatchCard from './MatchCard';

/** Draws a bracket. With `onPick` (dashboard) a click on a player makes them the winner of that match. */
interface Props { bracket: Bracket; onPick?: (m: BMatch, side: 'a' | 'b') => void; selected?: string | null; /** league formats: edit callback (scores typed in the cards) */ onChange?: (b: Bracket) => void; /** dashboard: matches get an edit icon that opens a card (names, scores, winner); gives the changed bracket back */ onApply?: (b: Bracket) => void; /** the card may rename players */ canRename?: boolean; /** dashboard: typed scores beside the names */ onScore?: (m: BMatch, sa: string, sb: string) => void; /** dashboard: drag a first-round seat onto another to swap them */ onSwap?: (a: SeatRef, b: SeatRef) => void; /** dashboard: rename a player right on the tree (pencil beside the name) */ onRename?: (i: number, name: string) => void; /** public view page: full tree by default, round-header bar, fit to the screen */ pub?: boolean }

function roundName(lang: 'ar' | 'en', br: 'W' | 'L', round: number, total: number) {
  const ar = lang === 'ar';
  if (br === 'L') return ar ? `الخاسرين ${round}` : `Losers R${round}`;
  const left = total - round;
  if (left === 0) return ar ? 'النهائي' : 'Final';
  if (left === 1) return ar ? 'نصف النهائي' : 'Semifinals';
  if (left === 2) return ar ? 'ربع النهائي' : 'Quarterfinals';
  return ar ? `الجولة ${round}` : `Round ${round}`;
}

/** Types a name letter by letter (used when a swap or a shuffle puts a new name in a seat). */
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const chars = [...text]; let i = 0; setN(0);
    const t = window.setInterval(() => { i += 1; setN(i); if (i >= chars.length) window.clearInterval(t); }, Math.max(28, Math.min(70, 700 / Math.max(1, chars.length))));
    return () => window.clearInterval(t);
  }, [text]);
  const chars = [...text];
  return <span className="br-typed"><span className="br-typed-sz" aria-hidden>{text}</span><span className="br-typed-on">{chars.slice(0, n).join('')}{n < chars.length && <i className="br-caret" />}</span></span>;
}

function Row({ typing, hit, seed, name, state, score, win, lose, onClick, onScore, slot, grip, crown, onRename }: { typing?: boolean; hit?: boolean; seed?: number; crown?: boolean; onRename?: (v: string) => void; name: string; state: 'bye' | 'tbd' | 'ok'; score?: string; win: boolean; lose: boolean; onClick?: () => void; onScore?: (v: string) => void; slot?: string; grip?: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={`br-row ${hit ? 'is-hit' : ''} ${onClick ? 'can' : ''} ${win ? 'is-win' : ''} ${lose ? 'is-lose' : ''} ${state !== 'ok' ? 'is-empty' : ''}`} data-slot={slot} data-drag={grip ? slot : undefined}>
      {seed !== undefined && <span className="br-seed" aria-hidden="true">{seed}</span>}
      {grip && <span className="br-grip" data-grip={slot} aria-hidden="true">⠿</span>}
      {editing && onRename ? (
        <input className="br-rn" autoFocus dir="auto" maxLength={80} defaultValue={name} aria-label={name}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => { onRename(e.currentTarget.value); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); else if (e.key === 'Escape') { e.currentTarget.value = name; e.currentTarget.blur(); } }} />
      ) : (
        <>
          <button type="button" disabled={!onClick} onClick={onClick} className="br-pick"><span className="br-name" style={name.length > 20 ? { fontSize: `${Math.max(0.68, 20 / name.length)}em` } : undefined}>{typing && state === 'ok' ? <Typed text={name} /> : name}</span>{crown && <TrophyIcon className="br-crown" />}</button>
          {onRename && <button type="button" className="br-edit" aria-label="Rename" title="Rename" onClick={(e) => { e.stopPropagation(); setEditing(true); }}><PencilIcon className="br-pen" /></button>}
        </>
      )}
      {onScore ? <input className="br-sc" dir="ltr" inputMode="decimal" maxLength={4} value={score ?? ''} aria-label={name} onChange={(e) => onScore(e.target.value)} />
        : score ? <span className="br-score">{score}</span> : win ? <span className="br-score br-check">✓</span> : null}
    </div>
  );
}

function useNarrow() {
  const q = '(max-width: 767px)';
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const on = () => setN(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, []);
  return n;
}

export default function BracketView(p: Props) {
  const b = p.bracket;
  const { lang } = useI18n();
  if (isDraft(b)) return <DraftBox lang={lang} players={b.players} onRemove={p.onChange ? (i) => p.onChange?.({ ...b, players: b.players.filter((_, j) => j !== i) }) : undefined} />;
  if (isLeague(b)) return <LeagueView bracket={b} onChange={p.onChange} onRename={p.onRename} />;
  if (b.format === 'ffa') return <FfaView bracket={b} onChange={p.onChange} onRename={p.onRename} />;
  if (b.format === 'groups') return <GroupsView bracket={b} onChange={p.onChange} onRename={p.onRename} />;
  return <TreeView {...p} />;
}

const TREE_W = 900; // px: the width a small bracket aims for on desktop
function TreeView({ bracket, onPick, selected, pub, onScore, onSwap, onRename, onApply, canRename }: Props) {
  const uid = useRef(`bv${Math.random().toString(36).slice(2)}`).current;
  const { lang, dir } = useI18n();
  const rtl = dir === 'rtl';
  const R = useMemo(() => resolve(bracket), [bracket]);
  const L = useMemo(() => layout(bracket), [bracket]);
  const champ = champion(bracket);
  const f2on = bracket.matches.some((m) => m.id === 'F-2') && !hasBye(R, 'F-2');
  const finalId = f2on ? 'F-2' : (bracket.matches.find((m) => m.id === 'F-1') ?? bracket.matches.filter((m) => m.br === 'W').sort((x, y) => y.round - x.round)[0])?.id;
  const narrow = useNarrow();
  const [open, setOpen] = useState<string | null>(null);
  const [tree, setTree] = useState(true); // phone: the full tree is the default, the round list is optional
  const [byRounds, setByRounds] = useState(false); // public view: optional rounds list
  const showTree = pub ? !byRounds : !narrow || tree;
  // Public view on a phone: columns shrink so the whole tree fits the screen; very big brackets keep readable columns and scroll sideways.
  const box = useRef<HTMLDivElement>(null);
  const [bw, setBw] = useState(0);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const on = () => setBw(el.clientWidth);
    on(); const ro = new ResizeObserver(on); ro.observe(el); return () => ro.disconnect();
  }, [showTree]);
  const single = bracket.format !== 'double';
  // zoom (phone): the bracket's own sizes scale with --z, so the connector lines re-measure by themselves; pinch works on the tree only
  const ZMIN = 0.4, ZMAX = 2, Z0 = 0.65;
  const [z, setZ] = useState(Z0);
  const zoomable = narrow && showTree;
  const zref = useRef(z); zref.current = z;
  const setZc = (v: number) => setZ(Math.round(Math.min(ZMAX, Math.max(ZMIN, v)) * 100) / 100);
  // two-finger pinch zooms like a picture, around the fingers (one finger still scrolls); the anchor keeps the same spot of the tree under the fingers
  const anch = useRef<{ fx: number; fy: number; cx: number; cy: number } | null>(null);
  useLayoutEffect(() => {
    const el = box.current, a = anch.current; if (!el || !a) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollLeft = a.fx * el.scrollWidth - a.cx - (rtl ? el.scrollWidth - el.clientWidth : 0);
    el.scrollTop = a.fy * el.scrollHeight - a.cy;
  }, [z]);
  useEffect(() => {
    const el = box.current; if (!el || !zoomable) return;
    let d0 = 1, z0 = 1, on = false;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1;
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      on = true; d0 = dist(e.touches); z0 = zref.current;
      const r = el.getBoundingClientRect(), rtl = getComputedStyle(el).direction === 'rtl';
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      const nx = el.scrollLeft + (rtl ? el.scrollWidth - el.clientWidth : 0);
      anch.current = { fx: (nx + cx) / el.scrollWidth, fy: (el.scrollTop + cy) / el.scrollHeight, cx, cy };
    };
    const move = (e: TouchEvent) => { if (!on || e.touches.length !== 2) return; e.preventDefault(); setZc(z0 * (dist(e.touches) / d0)); };
    const end = (e: TouchEvent) => { if (e.touches.length < 2) { on = false; anch.current = null; } };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', end); };
  }, [zoomable, showTree]);
  // «Top N»: show only the last rounds of a big single-elimination bracket (like Challonge's Full / Top 32 / Top 16 / Top 8)
  const [top, setTop] = useState(0);
  const m1 = L.winners[0]?.length ?? 0;
  const topOpts = bracket.format === 'single' ? [32, 16, 8].filter((n) => n / 2 < m1) : [];
  const topN = topOpts.includes(top) ? top : 0;
  const Wv = topN ? L.winners.filter((ms) => ms.length <= topN / 2) : L.winners;
  const nF = (L.final ? 1 : 0) + (L.final2 && f2on ? 1 : 0);
  const nCols = Wv.length + nF;
  const fitStyle = (() => {
    // Desktop: shrink the columns so the whole tree fits the width (like Challonge); very big brackets keep readable columns and scroll sideways.
    if (!narrow && showTree && bw) {
      const n = Math.max(Wv.length, L.losers.length) + nF;
      if (!n) return undefined;
      const g = 22, av = bw - 24;
      const maxLen = bracket.players.reduce((q, p) => Math.max(q, [...p].length), 6);
      const nat = Math.min(320, Math.max(150, Math.round(maxLen * 7.6 + 78))); // widest a column can get (name + grip + score box)
      const tc = n; // columns on screen
      const cAvail = Math.floor((av - g * (tc - 1)) / tc); // the most a column can take so everything fits
      const cWant = tc >= 6 ? 220 : Math.floor((TREE_W - g * (tc - 1)) / tc); // a small bracket opens at a comfortable size (about as wide as the stream); a big one (32+ players) gets Challonge-sized columns
      const cw = cAvail < nat ? Math.max(cAvail, 142) : Math.min(cAvail, Math.max(nat, Math.min(cWant, 236)));
      return { '--cw': `${cw}px`, '--gap': `${g}px`, '--fs': `${cw >= 210 ? 14 : cw >= 190 ? 13 : cw >= 160 ? 12 : 11.5}px` } as CSSProperties;
    }
    if (!narrow || !single || !bw || !nCols || !showTree) return undefined;
    const gap = 16, avail = bw - 20;
    let cw = Math.floor((avail - gap * (nCols - 1)) / nCols);
    if (cw < 58) cw = 84;
    const fs = cw >= 104 ? 12.5 : cw >= 78 ? 10.5 : 8.5;
    return { '--cw': `${cw}px`, '--gap': `${gap}px`, '--fs': `${fs}px` } as CSSProperties;
  })();
  // Phone list view: pick a branch + round; opens on the round of the current match (else the first round still to play).
  const playable = (m: BMatch) => { const r = R.get(m.id); return !!r && r.a !== 'bye' && r.b !== 'bye'; };
  const start = useMemo(() => {
    const open = bracket.matches.find((m) => { if (m.br === 'T' || m.br === 'P') return false; const r = R.get(m.id); return !m.win && playable(m) && typeof r?.a === 'number' && typeof r?.b === 'number'; });
    const last = L.final ?? L.winners[L.winners.length - 1]?.[0];
    const m0 = open ?? last;
    return { br: (m0?.br === 'T' || m0?.br === 'P' ? 'W' : m0?.br) ?? 'W', round: m0?.round ?? 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sbr, setSbr] = useState<'W' | 'L' | 'F' | 'P'>(start.br);
  const [srd, setSrd] = useState(start.round);
  const wrap = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const [lines, setLines] = useState<{ d: string; on: boolean }[]>([]);
  const [nums, setNums] = useState<{ x: number; y: number; n: number }[]>([]);
  const NO = useMemo(() => matchNumbers(bracket), [bracket]);
  // search: a player's name (highlights every row of that player) or a match number (highlights the match)
  const [q, setQ] = useState('');
  const qs = q.trim();
  const hitP = useMemo(() => { const k = nameKey(qs); const out = new Set<number>(); if (k && !/^\d+$/.test(k)) bracket.players.forEach((p, i) => { if (nameKey(p).includes(k)) out.add(i); }); return out; }, [qs, bracket.players]);
  const hitM = useMemo(() => { const out = new Set<string>(); if (/^\d+$/.test(qs)) NO.forEach((n, id) => { if (n === Number(qs)) out.add(id); }); return out; }, [qs, NO]);
  const nHits = hitM.size || (hitP.size ? bracket.matches.filter((m) => { const r = R.get(m.id); return !!r && ((typeof r.a === 'number' && hitP.has(r.a)) || (typeof r.b === 'number' && hitP.has(r.b))); }).length : 0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // tell the editor page how wide the tree is (--tw), so the boxes under it can match it; they are siblings of .st-stage, so the variable goes on the parent too
  useEffect(() => {
    const st = box.current?.closest<HTMLElement>('.st-stage'); if (!st || !size.w) return undefined;
    const host = st.parentElement;
    st.style.setProperty('--tw', `${size.w}px`); host?.style.setProperty('--tw', `${size.w}px`);
    return () => { st.style.removeProperty('--tw'); host?.style.removeProperty('--tw'); };
  }, [size.w]);

  const nm = (w: Who) => (w === 'bye' ? 'BYE' : w === null ? (lang === 'ar' ? 'لم يُحدد' : 'TBD') : bracket.players[w] || '—');
  const stateOf = (w: Who): 'bye' | 'tbd' | 'ok' => (w === 'bye' ? 'bye' : w === null ? 'tbd' : 'ok');

  // Connector lines are measured from the real card positions, so any layout stays correct.
  useLayoutEffect(() => {
    const calc = () => {
      const root = wrap.current; if (!root) return;
      // Byes: hidden first-round matches take no room (like Challonge) – the winners rounds are packed tight and positioned by hand.
      const bodies = Array.from(root.querySelectorAll<HTMLElement>('.br-stack .br-sec:first-child .br-col-body'));
      const wr = L.winners;
      const packed = wr.length > 0 && wr.some((ms) => ms.some((m) => hasBye(R, m.id))) && bodies.length === wr.length;
      for (const bd of bodies) { bd.classList.toggle('br-abs', packed); if (!packed) { bd.style.removeProperty('height'); Array.from(bd.children).forEach((c) => (c as HTMLElement).style.removeProperty('top')); } }
      if (packed) {
        const first = wr.flat().find((m) => !hasBye(R, m.id));
        const fe = first ? els.current.get(first.id) : undefined;
        const h = fe?.offsetHeight || 0;
        if (h) {
          const gap = Math.max(6, Math.round(h * 0.25));
          const Pp = h + gap, ys = new Map<string, number>();
          let H = 0;
          const sl = packSlots(wr, R);
          for (const [id, v] of sl) { const y = v * Pp; ys.set(id, y); H = Math.max(H, y + h); }
          bodies.forEach((bd) => { bd.style.height = `${H}px`; });
          for (const [id, y] of ys) { const el = els.current.get(id); if (el) el.style.top = `${y}px`; }
        }
      }
      const o = root.getBoundingClientRect();
      const out: { d: string; on: boolean }[] = [];
      const nn: { x: number; y: number; n: number }[] = [];
      for (const m of bracket.matches) {
        if (hasBye(R, m.id)) continue;
        const to = els.current.get(m.id); if (!to) continue;
        const tb = to.getBoundingClientRect();
        const no = NO.get(m.id); if (no !== undefined) nn.push({ x: (rtl ? tb.left - 6 : tb.right + 6) - o.left, y: tb.top + tb.height / 2 - o.top - 3, n: no });
        for (const s of [m.a, m.b]) {
          if (!('w' in s) || hasBye(R, s.w)) continue;
          const from = els.current.get(s.w); if (!from) continue;
          const fb = from.getBoundingClientRect();
          const x1 = (rtl ? fb.left : fb.right) - o.left, y1 = fb.top + fb.height / 2 - o.top, x2 = (rtl ? tb.right : tb.left) - o.left, y2 = tb.top + tb.height / 2 - o.top, mx = (x1 + x2) / 2;
          out.push({ d: `M${x1} ${y1} H${mx} V${y2} H${x2}`, on: R.get(s.w)?.win != null });
        }
      }
      const mainEl = root.querySelector<HTMLElement>('.br-main');
      setLines(out); setNums(nn); setSize({ w: mainEl?.offsetWidth ?? root.offsetWidth, h: mainEl?.offsetHeight ?? root.offsetHeight });
    };
    calc();
    const ro = new ResizeObserver(calc); if (wrap.current) ro.observe(wrap.current);
    document.fonts?.ready.then(calc).catch(() => undefined);
    return () => ro.disconnect();
  }, [bracket, R, NO, lang, rtl, showTree]);
  // jump to the first result
  useEffect(() => {
    if (!qs) return;
    const t = window.setTimeout(() => box.current?.querySelector('.br-row.is-hit, .br-match.is-hit')?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }), 120);
    return () => window.clearTimeout(t);
  }, [qs, bracket]);

  // a swap or a shuffle puts other names in the first-round seats: those names are typed out (same players, other seats; renames, adds and removals do not count)
  const seen = useRef<{ k: string; m: Map<string, string> } | null>(null);
  const [typing, setTyping] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const cur = new Map<string, string>();
    for (const m of bracket.matches) {
      if (m.br !== 'W' || m.round !== 1) continue;
      const r = R.get(m.id); if (!r) continue;
      for (const sd of ['a', 'b'] as const) { const w = r[sd]; if (typeof w === 'number') cur.set(`${m.id}|${sd}`, bracket.players[w]); }
    }
    const k = [...bracket.players].sort().join('\u0001'), prev = seen.current;
    seen.current = { k, m: cur };
    if (!prev || prev.k !== k) return undefined;
    const ch = new Set<string>();
    cur.forEach((v, key) => { const o = prev.m.get(key); if (o !== undefined && o !== v) ch.add(key); });
    if (!ch.size) return undefined;
    setTyping(ch);
    const t = window.setTimeout(() => setTyping(new Set()), 1600);
    return () => window.clearTimeout(t);
  }, [bracket]); // eslint-disable-line react-hooks/exhaustive-deps
  const swapRef = useRef(onSwap); swapRef.current = onSwap; const hasSwap = !!onSwap;
  // Drag a first-round player onto another seat to swap the two: hold the player's row (mouse: just drag; touch: press and hold) or use the grip. Works with mouse and touch.
  useEffect(() => {
    if (!hasSwap) return;
    const parse = (v: string | undefined): SeatRef | null => { if (!v) return null; const [id, side] = v.split('|'); return side === 'a' || side === 'b' ? { id, side } : null; };
    let ghost: HTMLElement | null = null, from: SeatRef | null = null, over: HTMLElement | null = null, pid = -1, grabEl: HTMLElement | null = null, srcRow: HTMLElement | null = null;
    let pend: { ref: SeatRef; row: HTMLElement; x: number; y: number; id: number; touch: boolean; timer?: number } | null = null;
    const root = () => document.querySelector<HTMLElement>(`[data-bv="${uid}"]`);
    const clear = () => { over?.classList.remove('is-drop'); over = null; };
    const eat = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
    const endPend = () => { if (pend?.timer) window.clearTimeout(pend.timer); pend = null; };
    const end = (drop: boolean) => {
      endPend();
      const tgt = over && parse(over.dataset.slot);
      const a = from, wasDrag = !!from; ghost?.remove(); ghost = null; clear(); document.body.classList.remove('br-dragging'); srcRow?.classList.remove('is-dragging');
      try { if (grabEl && pid >= 0) grabEl.releasePointerCapture(pid); } catch { /* ignore */ }
      from = null; grabEl = null; pid = -1; srcRow = null;
      if (wasDrag) { document.addEventListener('click', eat, { capture: true, once: true }); window.setTimeout(() => document.removeEventListener('click', eat, true), 400); }
      if (drop && a && tgt && !(a.id === tgt.id && a.side === tgt.side)) swapRef.current?.(a, tgt);
    };
    const begin = (ref: SeatRef, row: HTMLElement, el: HTMLElement, id: number, x: number, y: number, touch: boolean) => {
      from = ref; grabEl = el; pid = id; srcRow = row;
      try { el.setPointerCapture(id); } catch { /* ignore */ }
      ghost = document.createElement('div'); ghost.className = 'br-ghost'; ghost.textContent = row.querySelector('.br-name')?.textContent ?? '';
      ghost.style.left = `${x}px`; ghost.style.top = `${y}px`; document.body.appendChild(ghost); document.body.classList.add('br-dragging'); row.classList.add('is-dragging');
      if (touch) try { navigator.vibrate?.(12); } catch { /* ignore */ }
    };
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (e.button > 0 || t.closest('input,textarea,select,a,.br-toggle,.br-edit,.br-medit')) return;
      const grip = t.closest<HTMLElement>('[data-grip]');
      const row = (grip?.closest('.br-row') ?? t.closest('.br-row[data-drag]')) as HTMLElement | null;
      if (!row || root()?.contains(row) !== true) return;
      const ref = parse(row.dataset.drag); if (!ref) return;
      if (grip) { e.preventDefault(); begin(ref, row, grip, e.pointerId, e.clientX, e.clientY, e.pointerType !== 'mouse'); return; }
      const touch = e.pointerType !== 'mouse';
      pend = { ref, row, x: e.clientX, y: e.clientY, id: e.pointerId, touch };
      if (touch) pend.timer = window.setTimeout(() => { if (pend) { const q = pend; pend = null; begin(q.ref, q.row, q.row, q.id, q.x, q.y, true); } }, 280);
    };
    const move = (e: PointerEvent) => {
      if (pend && !from) {
        const d = Math.hypot(e.clientX - pend.x, e.clientY - pend.y);
        if (pend.touch) { if (d > 10) endPend(); } else if (d > 5) { const q = pend; endPend(); begin(q.ref, q.row, q.row, q.id, e.clientX, e.clientY, false); }
      }
      if (!from || !ghost) return;
      ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`;
      const t = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('.br-row[data-slot]') ?? null;
      if (t !== over) { clear(); if (t && root()?.contains(t) && t !== srcRow) { over = t; t.classList.add('is-drop'); } }
      // edge auto-scroll: the page up/down, the bracket sideways
      const sc = root(); const r = sc?.getBoundingClientRect();
      if (e.clientY < 70) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
      if (r && sc) { if (e.clientX < r.left + 50) sc.scrollLeft -= 14; else if (e.clientX > r.right - 50) sc.scrollLeft += 14; }
    };
    const up = () => end(true), cancel = () => end(false);
    const noScroll = (e: TouchEvent) => { if (from && e.cancelable) e.preventDefault(); };
    const noMenu = (e: Event) => { if (from || pend) e.preventDefault(); };
    document.addEventListener('pointerdown', down); document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', cancel);
    document.addEventListener('touchmove', noScroll, { passive: false }); document.addEventListener('contextmenu', noMenu);
    return () => {
      document.removeEventListener('pointerdown', down); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancel);
      document.removeEventListener('touchmove', noScroll); document.removeEventListener('contextmenu', noMenu); end(false);
    };
  }, [hasSwap, uid]);

  // desktop: grab the bracket with the mouse and drag it in any direction (sideways inside the bracket, up/down moves the page)
  useEffect(() => {
    const el = box.current; if (!el) return;
    let on = false, moved = false, sx = 0, sy = 0, sl = 0, sp = 0;
    const eat = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as HTMLElement).closest('.br-toggle,.br-edit,.br-medit,input,textarea,select,a,[data-grip],.br-row[data-drag]')) return; // dragging a player swaps seats; empty space pans
      on = true; moved = false; sx = e.clientX; sy = e.clientY; sl = el.scrollLeft; sp = window.scrollY;
    };
    const move = (e: PointerEvent) => {
      if (!on) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved) { if (Math.hypot(dx, dy) < 6) return; moved = true; el.classList.add('is-panning'); try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
      el.scrollLeft = sl - dx; window.scrollTo(window.scrollX, sp - dy);
    };
    const up = () => {
      if (!on) return; on = false;
      if (moved) { el.classList.remove('is-panning'); el.addEventListener('click', eat, { capture: true, once: true }); setTimeout(() => el.removeEventListener('click', eat, true), 0); }
    };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, [showTree]);

  const card = (m: BMatch) => {
    const r = R.get(m.id) as Resolved;
    const isBye = r.a === 'bye' || r.b === 'bye';
    const can = (w: Who) => (!!onApply || !!onPick) && typeof w === 'number' && !isBye;
    // dashboard: one tap on a name = winner (tap the winner again to undo); the pencil still opens the full card
    const pickW = (side: 'a' | 'b') => (onApply ? onApply(setWinner(bracket, m.id, m.win === side ? undefined : side)) : onPick!(m, side));
    const seat = (side: 'a' | 'b') => {
      const none = { slot: undefined, grip: false }, v = m[side];
      if (!onSwap || m.win) return none;
      if ('p' in v || 'bye' in v) return { slot: `${m.id}|${side}`, grip: 'p' in v };
      // a player who advanced from round 1 by a bye (round 2 onward) can be moved too: he really sits in the bye match's seat, so that seat is what moves
      if ('w' in v) {
        const f = bracket.matches.find((x) => x.id === v.w);
        const ps = f && !f.win ? ('p' in f.a && 'bye' in f.b ? 'a' : 'p' in f.b && 'bye' in f.a ? 'b' : null) : null;
        if (f && ps) return { slot: `${f.id}|${ps}`, grip: true };
      }
      return none;
    };
    const sc = !onApply && !!onScore && !isBye && typeof r.a === 'number' && typeof r.b === 'number';
    const sa = seat('a'), sb = seat('b');
    const crowned = (side: 'a' | 'b') => champ !== null && m.id === finalId && !isBye && m.win === side; // the trophy sits next to the champion's name in the last match
    return (
      <div key={m.id} ref={(el) => { if (el) els.current.set(m.id, el); else els.current.delete(m.id); }} data-m={m.id} className={`br-match ${hitM.has(m.id) ? 'is-hit' : ''} ${isBye ? 'is-bye is-ghost' : ''} ${selected === m.id || open === m.id ? 'is-sel' : ''}`}>
        {onApply && !isBye && typeof r.a === 'number' && typeof r.b === 'number' ? (
          <div className="br-mwrap">
            <div className="br-mrows">
          <Row typing={typing.has(`${m.id}|a`)} hit={typeof r.a === 'number' && hitP.has(r.a)} seed={typeof r.a === 'number' ? r.a + 1 : undefined} name={nm(r.a)} state={stateOf(r.a)} score={m.sa} win={!isBye && m.win === 'a'} lose={!isBye && m.win === 'b'} onClick={can(r.a) ? () => pickW('a') : undefined} onScore={sc ? (v) => onScore!(m, v, m.sb ?? '') : undefined} slot={sa.slot} grip={sa.grip} crown={crowned('a')} onRename={!onApply && onRename && typeof r.a === 'number' ? (v) => onRename(r.a as number, v) : undefined} />
          <Row typing={typing.has(`${m.id}|b`)} hit={typeof r.b === 'number' && hitP.has(r.b)} seed={typeof r.b === 'number' ? r.b + 1 : undefined} name={nm(r.b)} state={stateOf(r.b)} score={m.sb} win={!isBye && m.win === 'b'} lose={!isBye && m.win === 'a'} onClick={can(r.b) ? () => pickW('b') : undefined} onScore={sc ? (v) => onScore!(m, m.sa ?? '', v) : undefined} slot={sb.slot} grip={sb.grip} crown={crowned('b')} onRename={!onApply && onRename && typeof r.b === 'number' ? (v) => onRename(r.b as number, v) : undefined} />
            </div>
            <button type="button" className="br-medit" aria-label={lang === 'ar' ? 'تعديل نتيجة المباراة' : 'Edit match result'} title={lang === 'ar' ? 'تعديل' : 'Edit'} onClick={() => setOpen(m.id)}><PencilIcon className="br-pen" /></button>
          </div>
        ) : (
          <>
          <Row typing={typing.has(`${m.id}|a`)} hit={typeof r.a === 'number' && hitP.has(r.a)} seed={typeof r.a === 'number' ? r.a + 1 : undefined} name={nm(r.a)} state={stateOf(r.a)} score={m.sa} win={!isBye && m.win === 'a'} lose={!isBye && m.win === 'b'} onClick={can(r.a) ? () => pickW('a') : undefined} onScore={sc ? (v) => onScore!(m, v, m.sb ?? '') : undefined} slot={sa.slot} grip={sa.grip} crown={crowned('a')} onRename={!onApply && onRename && typeof r.a === 'number' ? (v) => onRename(r.a as number, v) : undefined} />
          <Row typing={typing.has(`${m.id}|b`)} hit={typeof r.b === 'number' && hitP.has(r.b)} seed={typeof r.b === 'number' ? r.b + 1 : undefined} name={nm(r.b)} state={stateOf(r.b)} score={m.sb} win={!isBye && m.win === 'b'} lose={!isBye && m.win === 'a'} onClick={can(r.b) ? () => pickW('b') : undefined} onScore={sc ? (v) => onScore!(m, m.sa ?? '', v) : undefined} slot={sb.slot} grip={sb.grip} crown={crowned('b')} onRename={!onApply && onRename && typeof r.b === 'number' ? (v) => onRename(r.b as number, v) : undefined} />
          </>
        )}
      </div>
    );
  };
  const placeLabel = (m: BMatch) => { const a = m.pl ?? 0, z = a + (m.gs ?? 2) - 1; return lang === 'ar' ? `المركز ${a}–${z}` : `Places ${a}–${z}`; };
  const placeCaption = (m: BMatch) => <div className="br-round br-pcap">{placeLabel(m)}</div>;
  const section = (title: string, rounds: BMatch[][], br: 'W' | 'L') => (
    <div className="br-sec">
      {title && <div className="br-sec-title">{title}</div>}
      <div className="br-cols">
        {rounds.map((ms, i) => (
          <div key={i} className="br-col">
            <div className="br-round">{roundName(lang, br, ms[0].round, br === 'W' ? L.winners.length : rounds.length)}</div>
            <div className="br-col-body">{ms.map(card)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const branches: ('W' | 'L' | 'F' | 'P')[] = [...(bracket.format === 'double' ? ['W', 'L', ...(L.final ? ['F'] : [])] : ['W']) as ('W' | 'L' | 'F')[], ...(L.place.length ? ['P' as const] : [])];
  const bname = (b: 'W' | 'L' | 'F' | 'P') => (b === 'P' ? (lang === 'ar' ? 'المراكز' : 'Places') : b === 'W' ? (bracket.format === 'double' ? (lang === 'ar' ? 'الفائزين' : 'Winners') : '') : b === 'L' ? (lang === 'ar' ? 'الخاسرين' : 'Losers') : (lang === 'ar' ? 'النهائي الكبير' : 'Grand final'));
  const placeCols = (() => { const o = new Map<number, BMatch[]>(); for (const m of L.place) o.set(m.round, [...(o.get(m.round) ?? []), m]); return [...o.entries()].sort((x, y) => x[0] - y[0]).map((e) => e[1]); })();
  const rounds = sbr === 'W' ? L.winners : sbr === 'L' ? L.losers : sbr === 'P' ? placeCols : L.final ? [[L.final, ...(L.final2 ? [L.final2] : [])]] : [];
  const ri = Math.max(0, rounds.findIndex((ms) => ms[0].round === srd));
  const shown = (rounds[ri] ?? []).filter(playable);
  const chip = (on: boolean, label: string, click: () => void, key: string) => (
    <button key={key} type="button" onClick={click} className={`br-chip ${on ? 'on' : ''}`}>{label}</button>
  );
  const toggle = pub ? (
    <button type="button" className="br-toggle" onClick={() => setByRounds((v) => !v)}>{byRounds ? (lang === 'ar' ? 'عرض الشجرة' : 'Tree view') : (lang === 'ar' ? 'عرض بالجولات' : 'View by rounds')}</button>
  ) : narrow && (
    <button type="button" className="br-toggle" onClick={() => setTree((v) => !v)}>{tree ? (lang === 'ar' ? 'عرض بالجولات' : 'Round view') : (lang === 'ar' ? 'عرض الشجرة كاملة' : 'Full tree')}</button>
  );

  const topSel = topOpts.length > 0 && (
    <select className="br-toggle br-top" value={topN} aria-label="Top" onChange={(e) => setTop(Number(e.target.value))}>
      <option value={0}>{lang === 'ar' ? 'الشجرة كاملة' : 'Full bracket'}</option>
      {topOpts.map((n) => <option key={n} value={n}>{lang === 'ar' ? `أفضل ${n}` : `Top ${n}`}</option>)}
    </select>
  );

  // placement matches: one column per round, laid out under the section they belong to; a caption (e.g. «المركز 9–12») stands over each group
  const placeSec = (() => {
    if (!L.place.length || topN) return null;
    const secs = (['W', 'L'] as const).filter((x) => L.place.some((m) => m.sec === x));
    return secs.map((sec) => {
      const ms = L.place.filter((m) => m.sec === sec && !hasBye(R, m.id));
      const nCol = Math.max(0, ...ms.map((m) => m.round));
      if (!ms.length) return null;
      return (
        <div key={sec} className="br-sec br-place">
          <div className="br-sec-title">{lang === 'ar' ? 'مباريات تحديد المراكز' : 'Placement matches'}</div>
          <div className="br-cols">
            {Array.from({ length: nCol }, (_, i) => i + 1).map((rd) => {
              const col = ms.filter((m) => m.round === rd);
              const groups = [...new Set(col.map((m) => m.g))];
              return (
                <div key={rd} className="br-col">
                  <div className="br-round">&nbsp;</div>
                  <div className="br-col-body br-pbody">
                    {groups.map((g) => { const gm = col.filter((m) => m.g === g); return <div key={g} className="br-pgrp">{placeCaption(gm[0])}{gm.map(card)}</div>; })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  })();

  const openM = open ? bracket.matches.find((m) => m.id === open) : undefined;
  const matchCard = onApply && openM ? <MatchCard bracket={bracket} match={openM} canRename={canRename} onApply={onApply} onClose={() => setOpen(null)} /> : null;

  if (!showTree) {
    return (
      <div className="br-mobile" dir={dir} data-bv={uid}>
        {toggle}
        {branches.length > 1 && <div className="br-chips">{branches.map((b) => chip(sbr === b, bname(b), () => { setSbr(b); setSrd(b === 'P' ? (L.place[0]?.round ?? 1) : b === 'F' ? 1 : 1); }, b))}</div>}
        {sbr !== 'F' && <div className="br-chips">{rounds.map((ms) => chip(ms[0].round === rounds[ri]?.[0].round, sbr === 'P' ? (lang === 'ar' ? `جولة ${ms[0].round}` : `Round ${ms[0].round}`) : roundName(lang, sbr as 'W' | 'L', ms[0].round, rounds.length), () => setSrd(ms[0].round), String(ms[0].round)))}</div>}
        <div className="br-list">
          {shown.length ? (sbr === 'P' ? shown.map((m) => <Fragment key={m.id}>{placeCaption(m)}{card(m)}</Fragment>) : shown.map(card)) : <p style={{ color: 'var(--muted)' }}>{lang === 'ar' ? 'لا توجد مباريات' : 'No matches'}</p>}
          {L.third && playable(L.third) && sbr === 'W' && ri === rounds.length - 1 && <><div className="br-round" style={{ marginTop: '.75rem' }}>{lang === 'ar' ? 'المركز الثالث' : '3rd place'}</div>{card(L.third)}</>}
        </div>
        {champ !== null && <div className="br-champ"><TrophyIcon className="h-5 w-5 shrink-0" style={{ color: '#ffc93c' }} /><b>{bracket.players[champ]}</b></div>}
        {matchCard}
      </div>
    );
  }

  return (
    <div className={`br-outer ${pub ? 'br-out-pv' : ''}`} dir={dir}>
      <div className="br-bar">{toggle}{topSel}
        <span className="br-sbox"><input type="search" className="br-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === 'ar' ? 'ابحث باسم لاعب أو رقم مباراة' : 'Search a player or match no.'} aria-label={lang === 'ar' ? 'بحث' : 'Search'} />{qs && <i className="br-scount">{nHits ? nHits : (lang === 'ar' ? 'لا نتيجة' : 'None')}</i>}</span>
        {zoomable && !pub && <span className="br-zbar" role="group" aria-label={lang === 'ar' ? 'تكبير' : 'Zoom'}>
          <button type="button" aria-label={lang === 'ar' ? 'تصغير' : 'Zoom out'} onClick={() => setZc(z - 0.15)}>−</button>
          <button type="button" aria-label={lang === 'ar' ? 'ملاءمة' : 'Reset zoom'} onClick={() => setZ(Z0)}>{Math.round(z * 100)}%</button>
          <button type="button" aria-label={lang === 'ar' ? 'تكبير' : 'Zoom in'} onClick={() => setZc(z + 0.15)}>+</button>
        </span>}
      </div>
    <div ref={box} data-bv={uid} className={`br-scroll ${pub ? 'pv' : ''} ${fitStyle ? 'br-fit' : ''} ${pub && single ? 'pv-bar' : ''} ${zoomable ? 'br-zm' : ''}`} style={zoomable ? ({ ...fitStyle, '--z': z } as CSSProperties) : fitStyle} dir={dir}>
      <div className="br-wrap" ref={wrap} style={{ '--nc': Math.max(Wv.length, L.losers.length) + nF + 1 } as CSSProperties}>
        <svg className="br-lines" width={size.w} height={size.h} aria-hidden>
          {lines.map((l, i) => <path key={i} d={l.d} className={l.on ? 'on' : ''} />)}
          {nums.map((t) => <text key={t.n} className="br-no" x={t.x} y={t.y} textAnchor={rtl ? 'end' : 'start'}>{t.n}</text>)}
        </svg>
        <div className="br-main">
          <div className="br-stack">
            {section(bracket.format === 'double' ? (lang === 'ar' ? 'فرع الفائزين' : 'Winners bracket') : '', Wv, 'W')}
            {L.losers.length > 0 && section(lang === 'ar' ? 'فرع الخاسرين' : 'Losers bracket', L.losers, 'L')}
            {placeSec}
            {L.third && !hasBye(R, L.third.id) && !topN && (
              <div className="br-sec br-third">
                <div className="br-cols" style={{ justifyContent: 'flex-end' }}>
                  <div className="br-col">
                    <div className="br-round">{lang === 'ar' ? 'المركز الثالث' : '3rd place'}</div>
                    <div className="br-col-body">{card(L.third)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {L.final && (
            <div className="br-col br-final">
              <div className="br-round">{lang === 'ar' ? 'النهائي الكبير' : 'Grand final'}</div>
              <div className="br-col-body">{card(L.final)}</div>
            </div>
          )}
          {L.final2 && f2on && (
            <div className="br-col br-final">
              <div className="br-round">{lang === 'ar' ? 'النهائي الكبير (إعادة)' : 'Grand final (reset)'}</div>
              <div className="br-col-body">{card(L.final2)}</div>
            </div>
          )}
        </div>
      </div>
      {matchCard}
    </div>
    </div>
  );
}
