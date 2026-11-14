import { addFfaRound, dropFfaRound, ffaChampion, ffaRows, setFfaScore, type Bracket } from '../data/bracket';
import { TrophyIcon } from './icons';
import { Nm } from './LeagueView';
import { useI18n } from '../i18n/I18nProvider';

/** Leaderboard / free-for-all: sorted standings on top, then a players × rounds score grid (editable with `onChange`). */
export default function FfaView({ bracket: br, onChange, onRename }: { bracket: Bracket; onChange?: (b: Bracket) => void; onRename?: (i: number, v: string) => void }) {
  const { lang, dir } = useI18n();
  const ar = lang === 'ar';
  const rows = ffaRows(br), champ = ffaChampion(br), R = br.fs ?? [];
  const th = 'px-2 py-2 text-center font-semibold';
  return (
    <div className="lg" dir={dir}>
      <div className="lg-table-wrap">
        <table className="lg-table">
          <thead><tr><th className={th}>#</th><th className={`${th} !text-start`}>{ar ? 'اللاعب' : 'Player'}</th><th className={th}>{ar ? 'الجولات' : 'Rounds'}</th><th className={th}>{ar ? 'الأفضل' : 'Best'}</th><th className={th}>{ar ? 'المجموع' : 'Total'}</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.p} className={i === 0 && champ !== null ? 'is-top' : ''}>
              <td className="px-2 py-2 text-center" style={{ color: 'var(--muted)' }}>{i + 1}</td>
              <td className="px-2 py-2 font-semibold"><Nm name={br.players[r.p]} onRename={onRename ? (v) => onRename(r.p, v) : undefined} />{i === 0 && champ !== null && <TrophyIcon className="br-crown" aria-label="winner" />}</td>
              <td className="px-2 py-2 text-center">{r.played}</td>
              <td className="px-2 py-2 text-center">{r.best ?? '—'}</td>
              <td className="px-2 py-2 text-center font-bold">{r.total}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <p className="mb-2 mt-5 text-[.85rem] font-semibold" style={{ color: 'var(--muted)' }}>{ar ? 'نتائج الجولات' : 'Round scores'}{br.opts?.low ? (ar ? ' · الأقل أفضل' : ' · lower is better') : ''}</p>
      <div className="lg-table-wrap lg-scroll">
        <table className="lg-table">
          <thead><tr><th className={`${th} !text-start`}>{ar ? 'اللاعب' : 'Player'}</th>{R.map((_, i) => <th key={i} className={th}>{ar ? `ج${i + 1}` : `R${i + 1}`}</th>)}</tr></thead>
          <tbody>{br.players.map((name, p) => (
            <tr key={p}>
              <td className="whitespace-nowrap px-2 py-1.5 font-semibold">{name}</td>
              {R.map((r, i) => (
                <td key={i} className="px-1 py-1 text-center">
                  {onChange ? <input dir="ltr" inputMode="decimal" maxLength={6} className="lg-in" value={r[p] ?? ''} aria-label={`${name} ${i + 1}`} onChange={(e) => onChange(setFfaScore(br, i, p, e.target.value))} /> : <span>{r[p] || '—'}</span>}
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {onChange && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="lg-btn on" onClick={() => onChange(addFfaRound(br))}>{ar ? 'إضافة جولة' : 'Add round'}</button>
          {R.length > 1 && <button type="button" className="lg-btn" onClick={() => { if (window.confirm(ar ? 'حذف آخر جولة؟' : 'Remove the last round?')) onChange(dropFfaRound(br)); }}>{ar ? 'حذف آخر جولة' : 'Remove last round'}</button>}
        </div>
      )}
    </div>
  );
}
