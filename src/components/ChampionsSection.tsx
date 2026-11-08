import { useMemo, useState } from 'react';
import { getGame } from '../data/games';
import { useGames } from '../hooks/useGames';
import { statusOf, type Tournament } from '../data/tournaments';
import { useTournaments } from '../hooks/useTournaments';
import { useI18n } from '../i18n/I18nProvider';
import SectionShell from './SectionShell';

const TOP = 4;
const ARCHIVE_STEP = 8;

/** Tournament date: one day → "20 October 2026"; several days → "18 – 20 October 2026" (or both months when they differ). */
function useDate() {
  const { lang } = useI18n();
  const loc = lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB';
  return (x: Tournament) => {
    const f = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
    const a = new Date(x.startsAt), b = new Date(x.endsAt);
    if (f.format(a) === f.format(b)) return f.format(a);
    const d = new Intl.DateTimeFormat(loc, { day: 'numeric', timeZone: 'Asia/Riyadh' });
    const ym = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
    // Same month: "18 – 20 October 2026"; otherwise both full dates.
    return ym.format(a) === ym.format(b) ? `${d.format(a)} – ${d.format(b)} ${ym.format(a)}` : `${f.format(a)} – ${f.format(b)}`;
  };
}

const BASE = import.meta.env.BASE_URL;
const ninjaMask = { WebkitMask: `url(${BASE}brand/ninja.png) center / contain no-repeat`, mask: `url(${BASE}brand/ninja.png) center / contain no-repeat` } as const;

/** Winner's name, plus the team members (team tournaments). */
const useWinner = (x: Tournament) => {
  const { lang } = useI18n();
  const isTeam = x.mode === 'team';
  return { name: x.winner?.[lang] ?? '', isTeam, members: isTeam ? (x.winnerMembers ?? []).filter((m) => m.trim()) : [] };
};

/** One unified Elite card for every winner (no photo needed): mountains + ninja mark, solo/team badge, name, team members. */
function ChampionCard({ x }: { x: Tournament }) {
  const { t, lang } = useI18n();
  const date = useDate();
  useGames();
  const g = getGame(x.gameId);
  const w = useWinner(x);
  return (
    <article className="champ-card group" style={{ ['--champ-bg' as string]: `url(${BASE}art/hero-scene.webp)` }}>
      <div className="flex items-center justify-between">
        <span aria-hidden="true" className="inline-block h-[1.3rem] w-[2.1rem] bg-white" style={ninjaMask} />
        <span className={`champ-mode ${w.isTeam ? 'is-team' : ''}`}>{w.isTeam ? t.chTeam : t.chSolo}</span>
      </div>
      <div className="flex-1" />
      <p className="champ-label">{t.chBadge}</p>
      <h3 dir="auto" className="champ-name">{w.name}</h3>
      {w.members.length > 0 && (
        <ul className="champ-members">{w.members.map((m, i) => <li key={`${m}-${i}`} dir="auto">{m}</li>)}</ul>
      )}
      <div className="champ-meta">
        <p className="text-[.95rem] font-bold text-white">{x.name[lang]}</p>
        <p><time dateTime={x.startsAt}>{date(x)}</time>{g ? ` · ${g.name[lang]}` : ''}</p>
        <p className="flex items-center justify-between gap-3"><span>{t.chPrize}</span><b className="text-white">{x.prize[lang]}</b></p>
      </div>
    </article>
  );
}

/** Compact row for older tournaments. */
function ArchiveRow({ x }: { x: Tournament }) {
  const { t, lang } = useI18n();
  const date = useDate();
  useGames();
  const g = getGame(x.gameId);
  const w = useWinner(x);
  return (
    <li className="flex items-center gap-4 rounded-2xl border p-3 pe-5" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: '#0a0a0d', border: '1px solid var(--glass-b)', color: '#fff' }}>
        <span aria-hidden="true" className="inline-block h-4 w-7 bg-current" style={ninjaMask} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span dir="auto" className="truncate text-[1.05rem] font-bold">{w.name}</span>
          <span className={`champ-mode shrink-0 !px-2 !py-0.5 !text-[.62rem] ${w.isTeam ? 'is-team' : ''}`}>{w.isTeam ? t.chTeam : t.chSolo}</span>
        </div>
        {w.members.length > 0 && <div dir="auto" className="truncate text-[.84rem]" style={{ color: 'var(--text)' }}>{w.members.join(' · ')}</div>}
        <div className="truncate text-[.88rem]" style={{ color: 'var(--muted)' }}>{x.name[lang]}{g ? ` · ${g.name[lang]}` : ''}</div>
      </div>
      <div className="hidden shrink-0 text-end text-[.82rem] sm:block" style={{ color: 'var(--muted)' }}>
        <div><time dateTime={x.startsAt}>{date(x)}</time></div>
        <div className="font-semibold" style={{ color: 'var(--link-on)' }}>{t.chPrize}: {x.prize[lang]}</div>
      </div>
    </li>
  );
}

/** Champions: winners of completed tournaments (set in the dashboard). The newest four are shown as portrait cards, older ones in a hall-of-fame list. */
export default function ChampionsSection() {
  const { t } = useI18n();
  const { items } = useTournaments();
  const [shown, setShown] = useState(ARCHIVE_STEP);
  const now = Date.now();
  const winners = useMemo(
    () => items.filter((x) => x.winner && (x.winner.en || x.winner.ar) && statusOf(x, now) === 'completed').sort((a, b) => Date.parse(b.endsAt) - Date.parse(a.endsAt)),
    [items, now],
  );
  const top = winners.slice(0, TOP);
  const rest = winners.slice(TOP);

  return (
    <SectionShell id="champions" title={t.chTitle} sub={t.chSub}>
      {!winners.length ? (
        <div className="grid min-h-[12rem] place-items-center rounded-3xl border p-8 text-center" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)', color: 'var(--muted)' }}>{t.chEmpty}</div>
      ) : (
        <>
          <h3 className="mb-5 text-[1.2rem] font-extrabold">{t.chLatest}</h3>
          <div className="m-rail md:grid md:gap-5 md:[grid-template-columns:repeat(auto-fill,minmax(min(100%,15.5rem),1fr))]">
            {top.map((x) => <ChampionCard key={x.id} x={x} />)}
          </div>
          {rest.length > 0 && (
            <div className="mt-12">
              <h3 className="mb-5 text-[1.2rem] font-extrabold">{t.chArchive}</h3>
              <ul className="grid gap-3 lg:grid-cols-2">{rest.slice(0, shown).map((x) => <ArchiveRow key={x.id} x={x} />)}</ul>
              {rest.length > ARCHIVE_STEP && (
                <button type="button" className="btn-glass mt-6" onClick={() => setShown((n) => (n >= rest.length ? ARCHIVE_STEP : n + ARCHIVE_STEP))}>
                  {shown >= rest.length ? t.chShowLess : t.chShowAll}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}
