import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { TrophyIcon } from './icons';
import { champion, isCurrent, isLeague, layout, resolve, type BMatch, type Bracket, type Resolved, type SeatRef, type Who } from '../data/bracket';
import { useI18n } from '../i18n/I18nProvider';
import LeagueView from './LeagueView';
import FfaView from './FfaView';
import GroupsView from './GroupsView';

/** Draws a bracket. With `onPick` (dashboard) a click on a player makes them the winner of that match. */
interface Props { bracket: Bracket; onPick?: (m: BMatch, side: 'a' | 'b') => void; selected?: string | null; /** league formats: edit callback (scores typed in the cards) */ onChange?: (b: Bracket) => void; live?: boolean; /** dashboard: typed scores beside the names */ onScore?: (m: BMatch, sa: string, sb: string) => void; /** dashboard: drag a first-round seat onto another to swap them */ onSwap?: (a: SeatRef, b: SeatRef) => void; /** dashboard: mark a ready match as «live now» (several at once are fine) */ onLive?: (m: BMatch) => void; /** dashboard: rename a player right on the tree (pencil beside the name) */ onRename?: (i: number, name: string) => void; /** public view page: full tree by default, round-header bar, fit to the screen */ pub?: boolean }

function roundName(lang: 'ar' | 'en', br: 'W' | 'L', round: number, total: number) {
  const ar = lang === 'ar';
  if (br === 'L') return ar ? `الخاسرين ${round}` : `Losers R${round}`;
  const left = total - round;
  if (left === 0) return ar ? 'النهائي' : 'Final';
  if (left === 1) return ar ? 'نصف النهائي' : 'Semifinals';
  if (left === 2) return ar ? 'ربع النهائي' : 'Quarterfinals';
  return ar ? `الجولة ${round}` : `Round ${round}`;
}

function Row({ name, state, score, win, lose, onClick, onScore, slot, grip, crown, onRename }: { crown?: boolean; onRename?: (v: string) => void; name: string; state: 'bye' | 'tbd' | 'ok'; score?: string; win: boolean; lose: boolean; onClick?: () => void; onScore?: (v: string) => void; slot?: string; grip?: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={`br-row ${onClick ? 'can' : ''} ${win ? 'is-win' : ''} ${lose ? 'is-lose' : ''} ${state !== 'ok' ? 'is-empty' : ''}`} data-slot={slot} data-drag={grip ? slot : undefined}>
      {grip && <span className="br-grip" data-grip={slot} aria-hidden="true">⠿</span>}
      {editing && onRename ? (
        <input className="br-rn" autoFocus dir="auto" maxLength={40} defaultValue={name} aria-label={name}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => { onRename(e.currentTarget.value); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); else if (e.key === 'Escape') { e.currentTarget.value = name; e.currentTarget.blur(); } }} />
      ) : (
        <>
          <button type="button" disabled={!onClick} onClick={onClick} className="br-pick"><span className="br-name">{name}</span>{crown && <TrophyIcon className="br-crown" />}</button>
          {onRename && <button type="button" className="br-edit" aria-label="✎" title="✎" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>✎</button>}
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
  if (isLeague(b)) return <LeagueView bracket={b} onChange={p.onChange} live={p.live} />;
  if (b.format === 'ffa') return <FfaView bracket={b} onChange={p.onChange} />;
  if (b.format === 'groups') return <GroupsView bracket={b} onChange={p.onChange} live={p.live} />;
  return <TreeView {...p} />;
}

const TREE_W = 900; // px: the width a small bracket aims for on desktop
function TreeView({ bracket, onPick, selected, pub, onScore, onSwap, onLive, onRename }: Props) {
  const uid = useRef(`bv${Math.random().toString(36).slice(2)}`).current;
  const { lang, dir } = useI18n();
  const rtl = dir === 'rtl';
  const R = useMemo(() => resolve(bracket), [bracket]);
  const L = useMemo(() => layout(bracket), [bracket]);
  const champ = champion(bracket);
  const finalId = (bracket.matches.find((m) => m.br === 'F') ?? bracket.matches.filter((m) => m.br === 'W').sort((x, y) => y.round - x.round)[0])?.id;
  const narrow = useNarrow();
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
  const nCols = L.winners.length + (L.final ? 1 : 0);
  const fitStyle = (() => {
    // Desktop: shrink the columns so the whole tree fits the width (like Challonge); very big brackets keep readable columns and scroll sideways.
    if (!narrow && showTree && bw) {
      const n = Math.max(L.winners.length, L.losers.length) + (L.final ? 1 : 0);
      if (!n) return undefined;
      const g = 14, av = bw - 24;
      const maxLen = bracket.players.reduce((q, p) => Math.max(q, [...p].length), 6);
      const nat = Math.min(320, Math.max(150, Math.round(maxLen * 7.6 + 78))); // widest a column can get (name + grip + score box)
      const tc = n; // columns on screen
      const cAvail = Math.floor((av - g * (tc - 1)) / tc); // the most a column can take so everything fits
      const cWant = Math.floor((TREE_W - g * (tc - 1)) / tc); // a small bracket opens at a comfortable size, about as wide as the stream
      const cw = cAvail < nat ? Math.max(cAvail, 142) : Math.min(cAvail, Math.max(nat, Math.min(cWant, 236)));
      return { '--cw': `${cw}px`, '--gap': `${g}px`, '--fs': `${cw >= 210 ? 14 : cw >= 190 ? 13 : cw >= 160 ? 12 : 11.5}px` } as CSSProperties;
    }
    if (!narrow || !single || !bw || !nCols || !showTree) return undefined;
    const gap = 12, avail = bw - 20;
    let cw = Math.floor((avail - gap * (nCols - 1)) / nCols);
    if (cw < 58) cw = 84;
    const fs = cw >= 104 ? 12.5 : cw >= 78 ? 10.5 : 8.5;
    return { '--cw': `${cw}px`, '--gap': `${gap}px`, '--fs': `${fs}px` } as CSSProperties;
  })();
  // Phone list view: pick a branch + round; opens on the round of the current match (else the first round still to play).
  const playable = (m: BMatch) => { const r = R.get(m.id); return !!r && r.a !== 'bye' && r.b !== 'bye'; };
  const start = useMemo(() => {
    const open = bracket.matches.find((m) => isCurrent(bracket, m.id) && !m.win) ?? bracket.matches.find((m) => { const r = R.get(m.id); return !m.win && playable(m) && typeof r?.a === 'number' && typeof r?.b === 'number'; });
    const last = L.final ?? L.winners[L.winners.length - 1]?.[0];
    const m0 = open ?? last;
    return { br: m0?.br ?? 'W', round: m0?.round ?? 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sbr, setSbr] = useState<'W' | 'L' | 'F'>(start.br);
  const [srd, setSrd] = useState(start.round);
  const wrap = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const [lines, setLines] = useState<{ d: string; on: boolean }[]>([]);
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
      const o = root.getBoundingClientRect();
      const out: { d: string; on: boolean }[] = [];
      for (const m of bracket.matches) {
        const to = els.current.get(m.id); if (!to) continue;
        const tb = to.getBoundingClientRect();
        for (const s of [m.a, m.b]) {
          if (!('w' in s)) continue;
          const from = els.current.get(s.w); if (!from) continue;
          const fb = from.getBoundingClientRect();
          const x1 = (rtl ? fb.left : fb.right) - o.left, y1 = fb.top + fb.height / 2 - o.top, x2 = (rtl ? tb.right : tb.left) - o.left, y2 = tb.top + tb.height / 2 - o.top, mx = (x1 + x2) / 2;
          out.push({ d: `M${x1} ${y1} H${mx} V${y2} H${x2}`, on: R.get(s.w)?.win != null });
        }
      }
      const mainEl = root.querySelector<HTMLElement>('.br-main');
      setLines(out); setSize({ w: mainEl?.offsetWidth ?? root.offsetWidth, h: mainEl?.offsetHeight ?? root.offsetHeight });
    };
    calc();
    const ro = new ResizeObserver(calc); if (wrap.current) ro.observe(wrap.current);
    document.fonts?.ready.then(calc).catch(() => undefined);
    return () => ro.disconnect();
  }, [bracket, R, lang, rtl, showTree]);

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
      if (e.button > 0 || t.closest('input,textarea,select,a,.br-toggle,.br-livebtn,.br-edit')) return;
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
      if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as HTMLElement).closest('.br-toggle,.br-livebtn,.br-edit,input,textarea,select,a,[data-grip],.br-row[data-drag]')) return;
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
    const can = (w: Who) => !!onPick && typeof w === 'number' && !isBye;
    const seat = (side: 'a' | 'b') => { const v = m[side]; return !!onSwap && !m.win && ('p' in v || 'bye' in v) ? { slot: `${m.id}|${side}`, grip: 'p' in v } : { slot: undefined, grip: false }; };
    const sc = !!onScore && !isBye && typeof r.a === 'number' && typeof r.b === 'number';
    const sa = seat('a'), sb = seat('b');
    const crowned = (side: 'a' | 'b') => champ !== null && m.id === finalId && !isBye && m.win === side; // the trophy sits next to the champion's name in the last match
    return (
      <div key={m.id} ref={(el) => { if (el) els.current.set(m.id, el); }} data-m={m.id} className={`br-match ${isBye ? 'is-bye' : ''} ${selected === m.id ? 'is-sel' : ''} ${isCurrent(bracket, m.id) && !m.win ? 'is-cur' : ''}`}>
        {onLive && !m.win && !isBye && typeof r.a === 'number' && typeof r.b === 'number' && (
          <button type="button" className={`br-livebtn ${isCurrent(bracket, m.id) ? 'on' : ''}`} aria-pressed={isCurrent(bracket, m.id)} title={lang === 'ar' ? 'مباشر الآن' : 'Live now'} aria-label={lang === 'ar' ? 'تحديد المباراة كمباشرة الآن' : 'Mark match as live now'} onClick={(e) => { e.stopPropagation(); onLive(m); }}><i /></button>
        )}
        {isCurrent(bracket, m.id) && !m.win && <span className="br-live">{lang === 'ar' ? 'الآن' : 'LIVE'}</span>}
        <Row name={nm(r.a)} state={stateOf(r.a)} score={m.sa} win={!isBye && m.win === 'a'} lose={!isBye && m.win === 'b'} onClick={can(r.a) ? () => onPick!(m, 'a') : undefined} onScore={sc ? (v) => onScore!(m, v, m.sb ?? '') : undefined} slot={sa.slot} grip={sa.grip} crown={crowned('a')} onRename={onRename && typeof r.a === 'number' ? (v) => onRename(r.a as number, v) : undefined} />
        <Row name={nm(r.b)} state={stateOf(r.b)} score={m.sb} win={!isBye && m.win === 'b'} lose={!isBye && m.win === 'a'} onClick={can(r.b) ? () => onPick!(m, 'b') : undefined} onScore={sc ? (v) => onScore!(m, m.sa ?? '', v) : undefined} slot={sb.slot} grip={sb.grip} crown={crowned('b')} onRename={onRename && typeof r.b === 'number' ? (v) => onRename(r.b as number, v) : undefined} />
        {onPick && <span className="br-id">{m.id}</span>}
      </div>
    );
  };
  const section = (title: string, rounds: BMatch[][], br: 'W' | 'L') => (
    <div className="br-sec">
      {title && <div className="br-sec-title">{title}</div>}
      <div className="br-cols">
        {rounds.map((ms, i) => (
          <div key={i} className="br-col">
            <div className="br-round">{roundName(lang, br, ms[0].round, rounds.length)}</div>
            <div className="br-col-body">{ms.map(card)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const branches: ('W' | 'L' | 'F')[] = bracket.format === 'double' ? ['W', 'L', 'F'] : ['W'];
  const bname = (b: 'W' | 'L' | 'F') => (b === 'W' ? (bracket.format === 'double' ? (lang === 'ar' ? 'الفائزين' : 'Winners') : '') : b === 'L' ? (lang === 'ar' ? 'الخاسرين' : 'Losers') : (lang === 'ar' ? 'النهائي الكبير' : 'Grand final'));
  const rounds = sbr === 'W' ? L.winners : sbr === 'L' ? L.losers : L.final ? [[L.final]] : [];
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

  if (!showTree) {
    return (
      <div className="br-mobile" dir={dir} data-bv={uid}>
        {toggle}
        {branches.length > 1 && <div className="br-chips">{branches.map((b) => chip(sbr === b, bname(b), () => { setSbr(b); setSrd(b === 'W' ? 1 : b === 'L' ? 1 : 1); }, b))}</div>}
        {sbr !== 'F' && <div className="br-chips">{rounds.map((ms) => chip(ms[0].round === rounds[ri]?.[0].round, roundName(lang, sbr as 'W' | 'L', ms[0].round, rounds.length), () => setSrd(ms[0].round), String(ms[0].round)))}</div>}
        <div className="br-list">
          {shown.length ? shown.map(card) : <p style={{ color: 'var(--muted)' }}>{lang === 'ar' ? 'ما فيه مباريات' : 'No matches'}</p>}
        </div>
        {champ !== null && <div className="br-champ"><TrophyIcon className="h-5 w-5 shrink-0" style={{ color: '#ffc93c' }} /><b>{bracket.players[champ]}</b></div>}
      </div>
    );
  }

  return (
    <div ref={box} data-bv={uid} className={`br-scroll ${pub ? 'pv' : ''} ${fitStyle ? 'br-fit' : ''} ${pub && single ? 'pv-bar' : ''}`} style={fitStyle} dir={dir}>
      {toggle}
      <div className="br-wrap" ref={wrap} style={{ '--nc': Math.max(L.winners.length, L.losers.length) + (L.final ? 1 : 0) + 1 } as CSSProperties}>
        <svg className="br-lines" width={size.w} height={size.h} aria-hidden>
          {lines.map((l, i) => <path key={i} d={l.d} className={l.on ? 'on' : ''} />)}
        </svg>
        <div className="br-main">
          <div className="br-stack">
            {section(bracket.format === 'double' ? (lang === 'ar' ? 'فرع الفائزين' : 'Winners bracket') : '', L.winners, 'W')}
            {L.losers.length > 0 && section(lang === 'ar' ? 'فرع الخاسرين' : 'Losers bracket', L.losers, 'L')}
          </div>
          {L.final && (
            <div className="br-col br-final">
              <div className="br-round">{lang === 'ar' ? 'النهائي الكبير' : 'Grand final'}</div>
              <div className="br-col-body">{card(L.final)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
