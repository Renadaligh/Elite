import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { champion, layout, resolve, type BMatch, type Bracket, type Resolved, type Who } from '../data/bracket';
import { useI18n } from '../i18n/I18nProvider';

/** Draws a bracket. With `onPick` (dashboard) a click on a player makes them the winner of that match. */
interface Props { bracket: Bracket; onPick?: (m: BMatch, side: 'a' | 'b') => void; selected?: string | null }

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

export default function BracketView({ bracket, onPick, selected }: Props) {
  const { lang, dir } = useI18n();
  const rtl = dir === 'rtl';
  const R = useMemo(() => resolve(bracket), [bracket]);
  const L = useMemo(() => layout(bracket), [bracket]);
  const champ = champion(bracket);
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
  }, [bracket, R, lang, rtl]);

  const card = (m: BMatch) => {
    const r = R.get(m.id) as Resolved;
    const isBye = r.a === 'bye' || r.b === 'bye';
    const can = (w: Who) => !!onPick && typeof w === 'number' && !isBye;
    return (
      <div key={m.id} ref={(el) => { if (el) els.current.set(m.id, el); }} data-m={m.id} className={`br-match ${isBye ? 'is-bye' : ''} ${selected === m.id ? 'is-sel' : ''} ${bracket.cur === m.id && !m.win ? 'is-cur' : ''}`}>
        {bracket.cur === m.id && !m.win && <span className="br-live">{lang === 'ar' ? 'الآن' : 'LIVE'}</span>}
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

  return (
    <div className="br-scroll" dir={dir}>
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
