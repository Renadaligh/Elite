import React, { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server.browser';
import BracketTreeSvg, { treeGeometry } from '../src/components/BracketTreeSvg';
import {
  champion, ffaRows, groupLabel, groupSub, isDraft, koSub, leagueRounds,
  outcome, roundMatches, standings, type Bracket,
} from '../src/data/bracket';

type Cell = string | number;
type Lang = 'ar' | 'en';

function Table({ title, headers, rows, widths, ar }: {
  title: string; headers: Cell[]; rows: Cell[][]; widths: number[]; ar: boolean;
}) {
  const width = widths.reduce((sum, w) => sum + w, 0);
  const height = 38 + (rows.length + 1) * 30;
  const offsets = widths.map((_, i) => widths.slice(0, i).reduce((sum, w) => sum + w, 0));
  return <svg width={width} height={height} data-width={width} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} direction="ltr">
    <text className="bs-nm" x={width / 2} y="24" textAnchor="middle" fontWeight="700">{title}</text>
    {[headers, ...rows].map((row, i) => <g key={i}>
      {row.map((value, j) => {
        const w = widths[j];
        const x = ar ? width - offsets[j] - w : offsets[j];
        return <svg key={j} x={x} y={38 + i * 30} width={w} height="30" overflow="hidden">
          <rect className={i ? 'bs-row' : 'bs-hd'} x="1" y="1" width={w - 2} height="28" rx="4" />
          <text className={i ? 'bs-nm' : 'bs-ht'} x={w / 2} y="20" textAnchor="middle" fontSize={w < 80 ? 12 : 14}>{value}</text>
        </svg>;
      })}
    </g>)}
  </svg>;
}

function League({ bracket, ar }: { bracket: Bracket; ar: boolean }) {
  const winner = champion(bracket);
  const name = (p: number) => bracket.players[p] || '—';
  return <>
    <Table title={ar ? 'الترتيب' : 'Standings'} ar={ar}
      headers={['#', ...(ar ? ['اللاعب', 'لعب', 'فوز', 'تعادل', 'خسارة', '+/−', 'نقاط'] : ['Player', 'P', 'W', 'D', 'L', '+/−', 'Pts'])]}
      widths={[44, 330, 64, 64, 64, 64, 64, 64]}
      rows={standings(bracket).map((s, i) => [i + 1, name(s.p) + (s.p === winner ? ' ★' : ''), s.played, s.w, s.d, s.l, s.gf - s.ga, s.pts])} />
    {leagueRounds(bracket).map(round => <Table key={round} ar={ar} title={ar ? `الجولة ${round}` : `Round ${round}`}
      headers={ar ? ['اللاعب', 'النتيجة', 'اللاعب'] : ['Player', 'Score', 'Player']} widths={[330, 108, 330]}
      rows={roundMatches(bracket, round).map(match => {
        const result = outcome(bracket, match);
        return [
          ('p' in match.a ? name(match.a.p) : 'BYE') + (result === 'a' ? ' ✓' : ''),
          `${match.sa || '—'} : ${match.sb || '—'}`,
          ('p' in match.b ? name(match.b.p) : 'BYE') + (result === 'b' ? ' ✓' : ''),
        ];
      })} />)}
  </>;
}

export function publicBracketSvg(bracket: Bracket, title: string, lang: Lang) {
  const ar = lang === 'ar';
  const tree = (b: Bracket, label: string) => <BracketTreeSvg bracket={b} title={label} lang={lang} uid="match" geometry={treeGeometry(b, ar)} />;
  let content: ReactNode;
  if (isDraft(bracket)) {
    content = <Table ar={ar} title={ar ? 'لم تبدأ البطولة بعد' : 'The tournament has not started'} headers={[ar ? 'اللاعب' : 'Player']}
      widths={[340]} rows={bracket.players.map(player => [player])} />;
  } else if (bracket.format === 'single' || bracket.format === 'double') {
    content = tree(bracket, title);
  } else if (bracket.format === 'groups') {
    const knockout = koSub(bracket);
    content = <>
      {(bracket.groups ?? []).map((_, i) => <section key={i}>
        <h2>{ar ? 'المجموعة' : 'Group'} {groupLabel(i)}</h2><League bracket={groupSub(bracket, i)} ar={ar} />
      </section>)}
      {knockout && <section><h2>{ar ? 'الإقصائيات' : 'Knockout'}</h2>{tree(knockout, title)}</section>}
    </>;
  } else if (bracket.format === 'ffa') {
    const rounds = bracket.fs ?? [];
    const winner = champion(bracket);
    content = <>
      <Table ar={ar} title={ar ? 'الترتيب' : 'Standings'}
        headers={ar ? ['#', 'اللاعب', 'الجولات', 'الأفضل', 'المجموع'] : ['#', 'Player', 'Rounds', 'Best', 'Total']} widths={[44, 330, 84, 84, 84]}
        rows={ffaRows(bracket).map((r, i) => [i + 1, bracket.players[r.p] + (r.p === winner ? ' ★' : ''), r.played, r.best ?? '—', r.total])} />
      {rounds.length > 0 && <Table ar={ar} title={ar ? 'نتائج الجولات' : 'Round scores'}
        headers={[ar ? 'اللاعب' : 'Player', ...rounds.map((_, i) => (ar ? 'ج' : 'R') + (i + 1))]}
        widths={[330, ...rounds.map(() => 68)]} rows={bracket.players.map((player, p) => [player, ...rounds.map(r => r[p] || '—')])} />}
    </>;
  } else {
    content = <League bracket={bracket} ar={ar} />;
  }
  const winner = champion(bracket);
  const winnerName = winner !== null && bracket.players[winner] ? bracket.players[winner] : null;
  return renderToStaticMarkup(<>
    <div className="bracket-meta">
      {bracket.org && <p className="bracket-organizer">{ar ? 'تنظيم' : 'Organised by'} · <bdi>{bracket.org}</bdi></p>}
      {winnerName && <div className="bracket-champion"><span className="bracket-champion-icon" aria-hidden="true">🏆</span><div className="bracket-champion-copy"><span className="bracket-champion-label">{ar ? 'بطل البطولة' : 'Tournament champion'}</span><bdi className="bracket-champion-name">{winnerName}</bdi></div></div>}
    </div>
    {content}
  </>);
}
