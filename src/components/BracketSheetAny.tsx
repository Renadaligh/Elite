import { TrophyIcon } from './icons';
import { ffaChampion, ffaRows, leagueChampion, groupLabel, groupSub, isCurrent, koSub, leagueRounds, outcome, roundMatches, standings, type BMatch, type Bracket } from '../data/bracket';
import BracketSheet from './BracketSheet';

/** Public view link for EVERY format, in the same sheet style as the elimination sheet:
 *  round robin / swiss = standings + every round, leaderboard = totals + score grid, groups = a table per group + the knockout sheet. */
type Lang = 'ar' | 'en';

function Head({ title }: { title: string }) {
  return <div className="bs-top"><b dir="auto">{title}</b><span>plato-ar.com</span></div>;
}

function Table({ br, adv, ar, champ }: { br: Bracket; adv?: number; ar: boolean; champ?: number | null }) {
  const S = standings(br);
  return (
    <div className="bs-tw"><table className="bs-tbl">
      <thead><tr><th>#</th><th className="l">{ar ? 'اللاعب' : 'Player'}</th><th>{ar ? 'لعب' : 'P'}</th><th>{ar ? 'فوز' : 'W'}</th><th>{ar ? 'تعادل' : 'D'}</th><th>{ar ? 'خسارة' : 'L'}</th><th>+/−</th><th>{ar ? 'نقاط' : 'Pts'}</th></tr></thead>
      <tbody>{S.map((s, i) => (
        <tr key={s.p} className={adv && i < adv ? 'adv' : ''}>
          <td>{i + 1}</td><td className="l" dir="auto">{br.players[s.p] || '—'}{champ === s.p && <TrophyIcon className="bs-cupi h-4 w-4" aria-label="winner" />}</td><td>{s.played}</td><td>{s.w}</td><td>{s.d}</td><td>{s.l}</td>
          <td dir="ltr">{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</td><td className="pts">{s.pts}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function Rounds({ br, ar }: { br: Bracket; ar: boolean }) {
  const card = (m: BMatch) => {
    const o = outcome(br, m);
    const cur = isCurrent(br, m.id) && !o;
    const side = (s: 'a' | 'b') => {
      const slot = m[s];
      const bye = 'bye' in slot;
      const v = m[s === 'a' ? 'sa' : 'sb'];
      return (
        <div key={s} className={`bs-mr${o === s ? ' win' : ''}${o && o !== s && o !== 'draw' ? ' lose' : ''}${bye ? ' bye' : ''}`}>
          <span dir="auto">{bye ? 'BYE' : br.players[(slot as { p: number }).p] || '—'}</span>{v ? <i>{v}</i> : null}
        </div>
      );
    };
    return <div key={m.id} className="bs-m">{cur && <em>● LIVE</em>}{side('a')}{side('b')}</div>;
  };
  return <>{leagueRounds(br).map((r) => (
    <div key={r} className="bs-rd"><h4 dir={ar ? "rtl" : "ltr"}>{ar ? `الجولة ${r}` : `Round ${r}`}</h4><div className="bs-mg">{roundMatches(br, r).map(card)}</div></div>
  ))}</>;
}

export default function BracketSheetAny({ bracket: br, title, lang }: { bracket: Bracket; title: string; lang: Lang }) {
  const ar = lang === 'ar';
  if (br.format === 'single' || br.format === 'double') return <BracketSheet bracket={br} title={title} lang={lang} />;

  if (br.format === 'rr' || br.format === 'swiss') {
    return <div className="bs-sheet bs-flow" dir="ltr"><Head title={title} /><Table br={br} ar={ar} champ={leagueChampion(br)} /><Rounds br={br} ar={ar} /></div>;
  }

  if (br.format === 'ffa') {
    const rows = ffaRows(br), R = br.fs ?? [];
    return (
      <div className="bs-sheet bs-flow" dir="ltr"><Head title={title} />
        <div className="bs-tw"><table className="bs-tbl">
          <thead><tr><th>#</th><th className="l">{ar ? 'اللاعب' : 'Player'}</th><th>{ar ? 'الجولات' : 'Rounds'}</th><th>{ar ? 'الأفضل' : 'Best'}</th><th>{ar ? 'المجموع' : 'Total'}</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={r.p} className={i === 0 ? 'adv' : ''}><td>{i + 1}</td><td className="l" dir="auto">{br.players[r.p]}{i === 0 && ffaChampion(br) === r.p && <TrophyIcon className="bs-cupi h-4 w-4" aria-label="winner" />}</td><td>{r.played}</td><td>{r.best ?? '—'}</td><td className="pts">{r.total}</td></tr>)}</tbody>
        </table></div>
        <div className="bs-rd"><h4 dir={ar ? "rtl" : "ltr"}>{ar ? 'نتائج الجولات' : 'Round scores'}{br.opts?.low ? (ar ? ' · الأقل أفضل' : ' · lower is better') : ''}</h4></div>
        <div className="bs-tw"><table className="bs-tbl">
          <thead><tr><th className="l">{ar ? 'اللاعب' : 'Player'}</th>{R.map((_, i) => <th key={i}>{ar ? `ج${i + 1}` : `R${i + 1}`}</th>)}</tr></thead>
          <tbody>{br.players.map((n, p) => <tr key={p}><td className="l" dir="auto">{n}</td>{R.map((r, i) => <td key={i}>{r[p] || '—'}</td>)}</tr>)}</tbody>
        </table></div>
      </div>
    );
  }

  // groups: a card per group (table + rounds), then the knockout sheet
  const k = koSub(br);
  return (
    <div className="bs-stack">
      {(br.groups ?? []).map((_, g) => {
        const sub = groupSub(br, g);
        return (
          <div key={g} className="bs-sheet bs-flow" dir="ltr">
            <Head title={`${title} · ${ar ? 'المجموعة' : 'Group'} ${groupLabel(g)}`} />
            <Table br={sub} adv={br.opts?.adv ?? 2} ar={ar} /><Rounds br={sub} ar={ar} />
          </div>
        );
      })}
      {k && <BracketSheet bracket={k} title={`${title} · ${ar ? 'الإقصائيات' : 'Knockout'}`} lang={lang} />}
    </div>
  );
}
