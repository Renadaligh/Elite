import { useState } from 'react';
import { PencilIcon, TrophyIcon } from './icons';
import { dropLastRound, isCurrent, leagueChampion, leagueRounds, nextSwissRound, outcome, roundDone, roundMatches, setLeagueScore, standings, toggleCurrent, type BMatch, type Bracket } from '../data/bracket';
import { useI18n } from '../i18n/I18nProvider';

/** Round robin / swiss: standings table + one round at a time. With `onChange` (dashboard / tool) scores are typed straight into the cards. */
interface Props { bracket: Bracket; onChange?: (b: Bracket) => void; /** pencil beside every name (dashboard / tool) */ onRename?: (i: number, v: string) => void; live?: boolean; /** highlight the top N rows (they qualify) */ advance?: number }

/** A player name with a pencil: tap it to rename in place (Enter / leaving the field saves). */
export function Nm({ name, onRename, className }: { name: string; onRename?: (v: string) => void; className?: string }) {
  const [ed, setEd] = useState(false);
  if (ed && onRename) return <input autoFocus dir="auto" maxLength={40} defaultValue={name} className="br-rn" onBlur={(e) => { onRename(e.currentTarget.value); setEd(false); }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
  return <span className={className}>{name}{onRename && <button type="button" className="br-edit" aria-label="Rename" title="Rename" onClick={() => setEd(true)}><PencilIcon className="br-pen" /></button>}</span>;
}

export default function LeagueView({ bracket: br, onChange, onRename, live, advance }: Props) {
  const { lang, dir } = useI18n();
  const ar = lang === 'ar';
  const rounds = leagueRounds(br);
  const firstOpen = rounds.find((r) => !roundDone(br, r)) ?? rounds[rounds.length - 1];
  const [pick, setPick] = useState<number | null>(null);
  const sel = pick !== null && rounds.includes(pick) ? pick : firstOpen;
  const S = standings(br);
  const champ = leagueChampion(br);
  const name = (p: number) => br.players[p] || '—';
  const total = br.format === 'swiss' ? br.opts?.rounds ?? rounds.length : rounds.length;
  const next = br.format === 'swiss' && onChange ? nextSwissRound(br) : null;
  const th = 'px-2 py-2 text-center font-semibold';

  const card = (m: BMatch) => {
    const bye = 'bye' in m.a || 'bye' in m.b;
    const o = outcome(br, m);
    const cur = isCurrent(br, m.id) && !o;
    const side = (s: 'a' | 'b') => {
      const slot = m[s];
      const isBye = 'bye' in slot;
      const v = m[s === 'a' ? 'sa' : 'sb'] ?? '';
      const win = o === s || (bye && !isBye && br.format === 'swiss');
      return (
        <div key={s} className={`br-row ${win && o !== 'draw' ? 'is-win' : ''} ${o && o !== s && o !== 'draw' ? 'is-lose' : ''} ${isBye ? 'is-empty' : ''}`}>
          {isBye ? <span className="br-name">BYE</span> : <Nm className="br-name" name={name((slot as { p: number }).p)} onRename={onRename ? (v) => onRename((slot as { p: number }).p, v) : undefined} />}
          {bye ? (isBye || br.format === 'rr' ? null : <span className="br-score br-check">✓</span>) : onChange ? (
            <input dir="ltr" inputMode="decimal" maxLength={4} className="lg-in" value={v} aria-label={isBye ? 'bye' : name((slot as { p: number }).p)}
              onChange={(e) => onChange(setLeagueScore(br, m.id, s === 'a' ? e.target.value : m.sa ?? '', s === 'b' ? e.target.value : m.sb ?? ''))} />
          ) : v ? <span className="br-score">{v}</span> : null}
        </div>
      );
    };
    return (
      <div key={m.id} className={`br-match ${bye ? 'is-bye' : ''} ${cur ? 'is-cur' : ''}`} data-m={m.id}>
        {cur && <span className="br-live">{ar ? 'الآن' : 'LIVE'}</span>}
        {side('a')}{side('b')}
        {onChange && live && !bye && !o && <button type="button" className={`br-livebtn ${cur ? 'on' : ''}`} aria-pressed={cur} title={cur ? (ar ? 'إلغاء "الآن"' : 'Unmark live') : (ar ? 'تحديد كمباراة حالية' : 'Mark as live')} onClick={() => onChange(toggleCurrent(br, m.id))}><i /></button>}
        {o === 'draw' && <span className="lg-draw">{ar ? 'تعادل' : 'Draw'}</span>}
      </div>
    );
  };

  return (
    <div className="lg" dir={dir}>
      <div className="lg-table-wrap">
        <table className="lg-table">
          <thead><tr>
            <th className={th}>#</th><th className={`${th} !text-start`}>{ar ? 'اللاعب' : 'Player'}</th>
            <th className={th} title={ar ? 'لعب' : 'Played'}>{ar ? 'لعب' : 'P'}</th><th className={th}>{ar ? 'فوز' : 'W'}</th><th className={th}>{ar ? 'تعادل' : 'D'}</th><th className={th}>{ar ? 'خسارة' : 'L'}</th>
            <th className={th}>+/−</th><th className={th}>{ar ? 'نقاط' : 'Pts'}</th>
          </tr></thead>
          <tbody>
            {S.map((s, i) => (
              <tr key={s.p} className={i === 0 && champ !== null && !advance ? 'is-top' : advance && i < advance ? 'is-adv' : ''}>
                <td className="px-2 py-2 text-center" style={{ color: 'var(--muted)' }}>{i + 1}</td>
                <td className="px-2 py-2 font-semibold"><Nm name={name(s.p)} onRename={onRename ? (v) => onRename(s.p, v) : undefined} />{i === 0 && champ !== null && !advance && <TrophyIcon className="br-crown" aria-label="winner" />}</td>
                <td className="px-2 py-2 text-center">{s.played}</td><td className="px-2 py-2 text-center">{s.w}</td><td className="px-2 py-2 text-center">{s.d}</td><td className="px-2 py-2 text-center">{s.l}</td>
                <td className="px-2 py-2 text-center" dir="ltr">{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</td>
                <td className="px-2 py-2 text-center font-bold">{s.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="br-chips" style={{ margin: '16px 0 10px' }}>
        {rounds.map((r) => <button key={r} type="button" className={`br-chip ${r === sel ? 'on' : ''}`} onClick={() => setPick(r)}>{ar ? `الجولة ${r}` : `Round ${r}`}{roundDone(br, r) ? ' ✓' : ''}</button>)}
      </div>
      {br.format === 'swiss' && <p className="mb-2 text-[.8rem]" style={{ color: 'var(--muted)' }}>{ar ? `الجولة ${rounds.length} من ${total}` : `Round ${rounds.length} of ${total}`}</p>}
      <div className="lg-grid">{roundMatches(br, sel).map(card)}</div>

      {onChange && br.format === 'swiss' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {next && <button type="button" className="lg-btn on" onClick={() => { onChange(next); setPick(null); }}>{ar ? 'إنشاء الجولة التالية' : 'Generate next round'}</button>}
          {!next && rounds.length < total && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }}>{ar ? 'أدخل كل نتائج الجولة الحالية لإنشاء التالية' : 'Enter every score of this round to generate the next one'}</span>}
          {rounds.length > 1 && <button type="button" className="lg-btn" onClick={() => { if (window.confirm(ar ? 'حذف آخر جولة؟' : 'Remove the last round?')) { onChange(dropLastRound(br)); setPick(null); } }}>{ar ? 'حذف آخر جولة' : 'Remove last round'}</button>}
        </div>
      )}
    </div>
  );
}
