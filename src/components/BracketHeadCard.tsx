import { podium, type Bracket } from '../data/bracket';
import type { ReactNode } from 'react';
import { useGames } from '../hooks/useGames';

/** Card above the tree: who organises it, the name, players / format / game / start, and the podium (1st, 2nd, 3rd) once it is known. */
export default function BracketHeadCard({ bracket, title, ownerName, avatar, formatLabel, lang, foot }: { bracket: Bracket; title: string; ownerName: string; avatar?: string; formatLabel: string; lang: 'ar' | 'en'; /** shown at the bottom of the card (the publish switch) */ foot?: ReactNode }) {
  const ar = lang === 'ar';
  const games = useGames();
  const info = bracket.info ?? {};
  const game = info.gameId ? games.find((g) => g.id === info.gameId)?.name[lang] ?? '' : '';
  const start = info.startsAt && !Number.isNaN(Date.parse(info.startsAt)) ? new Date(info.startsAt).toLocaleString(ar ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '';
  const who = (bracket.org || ownerName || '').trim();
  const row = (k: string, v: string, dir: 'auto' | 'rtl' | 'ltr' = 'auto') => (v ? <><dt>{k}</dt><dd dir={dir}>{v}</dd></> : null);
  return (
    <section className="hc" aria-label={title}>
      <div className="hc-org">
        {avatar ? <img className="hc-av" src={avatar} alt="" referrerPolicy="no-referrer" /> : <span className="hc-av" aria-hidden>{(who || '?').slice(0, 1).toUpperCase()}</span>}
        <div><small>{ar ? 'المنظم' : 'Organized by'}</small><b dir="auto">{who || '—'}</b></div>
      </div>
      <h2 className="hc-t" dir="auto">{title}</h2>
      <dl className="hc-dl">
        {row(ar ? 'اللاعبون' : 'Players', String(bracket.players.length), ar ? 'rtl' : 'ltr')}
        {row(ar ? 'النظام' : 'Format', formatLabel)}
        {row(ar ? 'اللعبة' : 'Game', game)}
        {row(ar ? 'التاريخ' : 'Start', start)}
      </dl>
      <PodiumRow bracket={bracket} lang={lang} />
      {foot ? <div className="hc-foot">{foot}</div> : null}
    </section>
  );
}

/** 1st, 2nd and 3rd place chips (2nd and 3rd only once they are known). Also shown under the public view of a bracket. */
export function PodiumRow({ bracket, lang, bare }: { bracket: Bracket; lang: 'ar' | 'en'; bare?: boolean }) {
  const ar = lang === 'ar';
  const [p1, p2, p3] = podium(bracket);
  const nm = (i: number | null) => (i === null ? '' : bracket.players[i] ?? '');
  return (
      <div className={`hc-pod${bare ? ' bare' : ''}`}>
        {p1 === null ? <span className="hc-pl p1 none"><small>{ar ? 'المركز الأول' : '1st place'}</small><b>{ar ? 'لم يُحسم بعد' : 'Not decided yet'}</b></span> : <span className="hc-pl p1"><small>{ar ? 'المركز الأول' : '1st place'}</small><b dir="auto">{nm(p1)}</b></span>}
        {p2 !== null && <span className="hc-pl p2"><small>{ar ? 'المركز الثاني' : '2nd place'}</small><b dir="auto">{nm(p2)}</b></span>}
        {p3 !== null && <span className="hc-pl p3"><small>{ar ? 'المركز الثالث' : '3rd place'}</small><b dir="auto">{nm(p3)}</b></span>}
      </div>
  );
}
