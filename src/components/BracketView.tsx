import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { champion, isCurrent, isLeague, layout, resolve, type BMatch, type Bracket, type Resolved, type Who } from '../data/bracket';
import { useI18n } from '../i18n/I18nProvider';
import LeagueView from './LeagueView';

/** Draws a bracket. With `onPick` (dashboard) a click on a player makes them the winner of that match. */
interface Props { bracket: Bracket; onPick?: (m: BMatch, side: 'a' | 'b') => void; selected?: string | null; /** league formats: edit callback (scores typed in the cards) */ onChange?: (b: Bracket) => void; live?: boolean }

function roundName(lang: 'ar' | 'en', br: 'W' | 'L', round: number, total: number) {
  const ar = lang === 'ar';
  if (br === 'L') return ar ? `الخاسرين ${round}` : `Losers R${round}`;
  const left = total - round;
  if (left === 0) return ar ? 'النهائي' : 'Final';
  if (left === 1) return ar ? 'نصف النهائي' : 'Semifinals';
  if (left === 2) return ar ? 'ربع النهائي' : 'Quarterfinals';
  return ar ? `الجولة ${round}` : `Round ${round}`;
}

function Row({ name, state, score, win, lose, onClick }: { name: string; state: 'bye' | 'tbd' | 'ok'; score?: string; win: boolean; lose: boolean; onClick?: () => void }) {
  return (
    <button type="button" disabled={!onClick} onClick={onClick} className={`br-row ${win ? 'is-win' : ''} ${lose ? 'is-lose' : ''} ${state !== 'ok' ? 'is-empty' : ''}`}>
      <span className="br-name">{name}</span>
      {score ? <span className="br-score">{score}</span> : win ? <span className="br-score br-check">✓</span> : null}
    </button>
  );
}

function useNarrow() {
  const q = '(max-width: 767px)';
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const on = () => setN(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, []);
  return n;
}

export default function BracketView(p: Props) {
  return isLeague(p.bracket) ? <LeagueView bracket={p.bracket} onChange={p.onChange} live={p.live} /> : <TreeView {...p} />;
}

function TreeView({ bracket, onPick, selected }: Props) {
  const { lang, dir } = useI18n();
  const rtl = dir === 'rtl';
  const R = useMemo(() => resolve(bracket), [bracket]);
  const L = useMemo(() => layout(bracket), [bracket]);
  const champ = champion(bracket);
  const narrow = useNarrow();
  const [tree, setTree] = useState(false); // phone: user asked for the full tree
  const showTree = !narrow || tree;
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
      setLines(out); setSize({ w: root.scrollWidth, h: root.scrollHeight });
    };
    calc();
    const ro = new ResizeObserver(calc); if (wrap.current) ro.observe(wrap.current);
    document.fonts?.ready.then(calc).catch(() => undefined);
    return () => ro.disconnect();
  }, [bracket, R, lang, rtl, showTree]);

  const card = (m: BMatch) => {
    const r = R.get(m.id) as Resolved;
    const isBye = r.a === 'bye' || r.b === 'bye';
    const can = (w: Who) => !!onPick && typeof w === 'number' && !isBye;
    return (
      <div key={m.id} ref={(el) => { if (el) els.current.set(m.id, el); }} data-m={m.id} className={`br-match ${isBye ? 'is-bye' : ''} ${selected === m.id ? 'is-sel' : ''} ${isCurrent(bracket, m.id) && !m.win ? 'is-cur' : ''}`}>
        {isCurrent(bracket, m.id) && !m.win && <span className="br-live">{lang === 'ar' ? 'الآن' : 'LIVE'}</span>}
        <Row name={nm(r.a)} state={stateOf(r.a)} score={m.sa} win={!isBye && m.win === 'a'} lose={!isBye && m.win === 'b'} onClick={can(r.a) ? () => onPick!(m, 'a') : undefined} />
        <Row name={nm(r.b)} state={stateOf(r.b)} score={m.sb} win={!isBye && m.win === 'b'} lose={!isBye && m.win === 'a'} onClick={can(r.b) ? () => onPick!(m, 'b') : undefined} />
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
  const toggle = narrow && (
    <button type="button" className="br-toggle" onClick={() => setTree((v) => !v)}>{tree ? (lang === 'ar' ? 'عرض بالجولات' : 'Round view') : (lang === 'ar' ? 'عرض الشجرة كاملة' : 'Full tree')}</button>
  );

  if (!showTree) {
    return (
      <div className="br-mobile" dir={dir}>
        {toggle}
        {branches.length > 1 && <div className="br-chips">{branches.map((b) => chip(sbr === b, bname(b), () => { setSbr(b); setSrd(b === 'W' ? 1 : b === 'L' ? 1 : 1); }, b))}</div>}
        {sbr !== 'F' && <div className="br-chips">{rounds.map((ms) => chip(ms[0].round === rounds[ri]?.[0].round, roundName(lang, sbr as 'W' | 'L', ms[0].round, rounds.length), () => setSrd(ms[0].round), String(ms[0].round)))}</div>}
        <div className="br-list">
          {shown.length ? shown.map(card) : <p style={{ color: 'var(--muted)' }}>{lang === 'ar' ? 'ما فيه مباريات' : 'No matches'}</p>}
        </div>
        {champ !== null && <div className="br-champ"><span>🏆</span><b>{bracket.players[champ]}</b></div>}
      </div>
    );
  }

  return (
    <div className="br-scroll" dir={dir}>
      {toggle}
      <div className="br-wrap" ref={wrap}>
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
        {champ !== null && (
          <div className="br-champ"><span>🏆</span><b>{bracket.players[champ]}</b></div>
        )}
      </div>
    </div>
  );
}
