import { autoChampion, champion, setChampion, type Bracket } from '../data/bracket';
import { TrophyIcon } from './icons';

/** The tournament winner: worked out from the results, or chosen by the organiser from the player list. */
export default function WinnerCard({ bracket, lang, editable, onChange }: { bracket: Bracket; lang: 'ar' | 'en'; editable: boolean; onChange?: (b: Bracket) => void }) {
  const ar = lang === 'ar';
  const win = champion(bracket);
  const auto = autoChampion(bracket);
  const chosen = typeof bracket.champ === 'number' && win === bracket.champ;
  return (
    <div className={`wn-card ${win === null ? 'none' : ''}`} role="group" aria-label={ar ? 'الفائز' : 'Winner'}>
      <TrophyIcon className="wn-ico" />
      <div className="wn-txt">
        <small>{win === null ? (ar ? 'الفائز' : 'Winner') : ar ? 'بطل البطولة' : 'Champion'}</small>
        <b dir="auto">{win === null ? (ar ? 'لم يُحسم بعد' : 'Not decided yet') : bracket.players[win]}</b>
        {win !== null && <i>{chosen ? (ar ? 'اختاره المنظم' : 'Chosen by the organiser') : ar ? 'من النتائج' : 'From the results'}</i>}
      </div>
      {editable && onChange && (
        <label className="wn-sel">
          <span>{ar ? 'تحديد الفائز' : 'Set the winner'}</span>
          <select value={chosen ? String(bracket.champ) : ''} onChange={(e) => onChange(setChampion(bracket, e.target.value === '' ? null : Number(e.target.value)))}>
            <option value="">{auto === null ? (ar ? 'تلقائي (من النتائج)' : 'Automatic (from results)') : `${ar ? 'تلقائي' : 'Automatic'}: ${bracket.players[auto]}`}</option>
            {bracket.players.map((p, i) => <option key={i} value={i}>{p}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
