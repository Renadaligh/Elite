import { useState } from 'react';
import { dropKnockout, groupDone0, groupLabel, groupMerge, groupSub, groupsDone, koMerge, koSub, setWinner, startKnockout, type Bracket } from '../data/bracket';
import { useI18n } from '../i18n/I18nProvider';
import BracketView from './BracketView';
import LeagueView from './LeagueView';

/** Two stages: a tab per group (round robin tables) and a Knockout tab once the groups are finished. */
export default function GroupsView({ bracket: br, onChange, onRename, live }: { bracket: Bracket; onChange?: (b: Bracket) => void; onRename?: (i: number, v: string) => void; live?: boolean }) {
  const { lang, dir } = useI18n();
  const ar = lang === 'ar';
  const G = br.groups ?? [];
  const firstOpen = G.findIndex((_, g) => !groupDone0(br, g));
  const [pick, setPick] = useState<number | null>(null); // group index, or -1 = knockout
  const sel = pick !== null ? pick : br.ko ? -1 : Math.max(0, firstOpen);
  const done = groupsDone(br);
  const ksub = koSub(br);
  const start = onChange && !br.ko && done ? startKnockout(br) : null;
  const chip = (on: boolean, label: string, key: string, click: () => void) => <button key={key} type="button" className={`br-chip ${on ? 'on' : ''}`} onClick={click}>{label}</button>;
  return (
    <div dir={dir}>
      <div className="br-chips" style={{ marginBottom: 14 }}>
        {G.map((_, g) => chip(sel === g, `${ar ? 'المجموعة' : 'Group'} ${groupLabel(g)}${groupDone0(br, g) ? ' ✓' : ''}`, `g${g}`, () => setPick(g)))}
        {(br.ko || start) && chip(sel === -1, ar ? 'الإقصائيات' : 'Knockout', 'ko', () => setPick(-1))}
      </div>
      {sel >= 0 && G[sel] && (
        <>
          <p className="mb-3 text-[.8rem]" style={{ color: 'var(--muted)' }}>{ar ? `يتأهل من كل مجموعة: ${br.opts?.adv ?? 2}` : `${br.opts?.adv ?? 2} advance from each group`}</p>
          <LeagueView key={sel} onRename={onRename ? (i, v) => onRename(br.groups![sel][i], v) : undefined} bracket={groupSub(br, sel)} advance={br.opts?.adv ?? 2} live={live} onChange={onChange ? (s) => onChange(groupMerge(br, sel, s)) : undefined} />
        </>
      )}
      {sel === -1 && ksub && (
        <BracketView bracket={ksub} onPick={onChange ? (m, side) => onChange(koMerge(br, setWinner(ksub, m.id, m.win === side ? undefined : side))) : undefined} />
      )}
      {onChange && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {start && <button type="button" className="lg-btn on" onClick={() => { onChange(start); setPick(-1); }}>{ar ? 'بدء الإقصائيات' : 'Start knockout'}</button>}
          {!br.ko && !done && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }}>{ar ? 'أدخل كل نتائج المجموعات لبدء الإقصائيات' : 'Enter all group scores to start the knockout'}</span>}
          {br.ko && <button type="button" className="lg-btn" onClick={() => { if (window.confirm(ar ? 'حذف الإقصائيات وإعادة توليدها؟' : 'Remove the knockout and generate it again?')) { onChange(dropKnockout(br)); setPick(null); } }}>{ar ? 'إعادة الإقصائيات' : 'Redo knockout'}</button>}
        </div>
      )}
    </div>
  );
}
