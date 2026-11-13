import { useMemo, useState } from 'react';
import RegisterDialog from './RegisterDialog';
import { getGame } from '../data/games';
import { useGames } from '../hooks/useGames';
import { useTournaments } from '../hooks/useTournaments';
import { sortTournaments, statusOf, type Tournament, type TournamentStatus } from '../data/tournaments';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/I18nProvider';
import type { Dict } from '../i18n/translations';
import { ArrowIcon } from './icons';

type Tab = 'all' | TournamentStatus;
const TABS: Tab[] = ['all', 'live', 'upcoming', 'completed'];
const TAB_KEY: Record<Tab, keyof Dict> = { all: 'tabAll', live: 'tabLive', upcoming: 'tabUpcoming', completed: 'tabDone' };
const ST_KEY: Record<TournamentStatus, keyof Dict> = { live: 'stLive', upcoming: 'stUpcoming', completed: 'stDone' };
const ST_COLOR: Record<TournamentStatus, string> = { live: '#27c27a', upcoming: '#ffb02e', completed: '#8d8d9b' };

function StatusPill({ s }: { s: TournamentStatus }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[.78rem] font-bold" style={{ borderColor: ST_COLOR[s], color: s === 'completed' ? 'var(--muted)' : 'var(--text)', background: s === 'live' ? 'rgba(39,194,122,.18)' : 'var(--chip-bg)' }}>
      <i aria-hidden="true" className={`h-2 w-2 rounded-full ${s === 'live' ? 'animate-pulse' : ''}`} style={{ background: ST_COLOR[s] }} />
      {t[ST_KEY[s]]}
    </span>
  );
}

/** Counts down to the start (upcoming) or to the end (live). Ticks every second. */
function Countdown({ to, label }: { to: string; label: string }) {
  const { t } = useI18n();
  const now = useNow(1000);
  const ms = Math.max(0, Date.parse(to) - now);
  const parts: [number, keyof Dict][] = [
    [Math.floor(ms / 864e5), 'cdDays'], [Math.floor(ms / 36e5) % 24, 'cdHours'], [Math.floor(ms / 6e4) % 60, 'cdMins'], [Math.floor(ms / 1e3) % 60, 'cdSecs'],
  ];
  return (
    <div>
      <div className="mb-2 text-[.82rem] font-semibold opacity-85">{label}</div>
      <div className="flex w-full gap-2 sm:gap-2.5" role="timer" aria-label={label}>
        {parts.map(([n, k]) => (
          <div key={k} className="min-w-0 flex-1 rounded-xl border px-1.5 py-2 text-center sm:min-w-[3.6rem] sm:flex-none sm:px-2.5" style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-b)' }}>
            <div className="text-[1.3rem] font-extrabold leading-none tabular-nums sm:text-[1.5rem]">{String(n).padStart(2, '0')}</div>
            <div className="mt-1 truncate text-[.7rem] opacity-80">{t[k]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function useFmt() {
  const { lang } = useI18n();
  const loc = lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB';
  return (iso: string) => new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

function Facts({ x }: { x: Tournament }) {
  const { t, lang } = useI18n();
  const full = x.slots.filled >= x.slots.total;
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[.9rem] [&>*]:min-w-0 [&_dd]:break-words">
      <div><dt className="opacity-70">{t.tPrize}</dt><dd className="font-bold">{x.prize[lang]}</dd></div>
      <div><dt className="opacity-70">{t.tFormat}</dt><dd className="font-bold">{x.format[lang]}</dd></div>
      <div className="col-span-2">
        <dt className="flex justify-between opacity-70"><span>{t.tTeams}</span><span>{full ? t.tFull : `${x.slots.filled}/${x.slots.total}`}</span></dt>
        <dd><div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--track)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (x.slots.filled / x.slots.total) * 100)}%`, background: 'linear-gradient(90deg,#3d7bff,#5b5ff0)' }} /></div></dd>
      </div>
    </dl>
  );
}

export function Register({ x, s }: { x: Tournament; s: TournamentStatus }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (s === 'live' && x.bracket) return <a href={`#/tournaments/${x.id}`} className="btn-primary mt-5 self-start">{t.tBracket} <ArrowIcon className="h-4 w-4 rtl:rotate-180" /></a>;
  if (s !== 'upcoming' || x.slots.filled >= x.slots.total) return null;
  if (x.registerUrl) return <a href={x.registerUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 self-start">{t.tRegister} <ArrowIcon className="h-4 w-4 rtl:rotate-180" /></a>;
  return (
    <>
      <button type="button" className="btn-primary mt-5 self-start" onClick={() => setOpen(true)}>{t.tRegister} <ArrowIcon className="h-4 w-4 rtl:rotate-180" /></button>
      {open && <RegisterDialog x={x} onClose={() => setOpen(false)} />}
    </>
  );
}

function MajorBadge() {
  return <span className="major-badge"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8Z" /></svg>Major</span>;
}

/** Dice mark, faint, in the bottom corner of a tournament card (same mark as the logo). */

function Featured({ x, s }: { x: Tournament; s: TournamentStatus }) {
  const { t, lang } = useI18n();
  const fmt = useFmt();
  useGames();
  const g = getGame(x.gameId);
  const c = g?.colors ?? ['#3d7bff', '#1a1f6a'];
  return (
    <article className="news-card on-art relative text-white md:mb-6" style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})`, border: 'none' }}>
      {x.image ? (
        <>
          <img src={x.image} alt="" loading="lazy" decoding="async" className="tour-img" style={{ objectPosition: x.imagePos || undefined }} />
          <div aria-hidden="true" className="tour-fade tour-fade-h" />
        </>
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.15))' }} aria-hidden="true" />
        </>
      )}
      <div className={`relative grid grid-cols-1 gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center ${x.image ? 'pt-20 lg:pt-8' : ''}`}>
        <div className="flex flex-col">
          <div className="mb-3 flex flex-wrap items-center gap-3"><StatusPill s={s} />{x.tier === 'major' && <MajorBadge />}{g && <span className="text-[.85rem] font-semibold opacity-90">{g.name[lang]}</span>}</div>
          <h3 className="text-[clamp(1.4rem,3vw,2.3rem)] font-extrabold leading-tight [overflow-wrap:anywhere]">{x.name[lang]}</h3>
          <p className="mt-1.5 text-[.95rem] opacity-85">{fmt(x.startsAt)}</p>
          <Facts x={x} />
          <Register x={x} s={s} />
        </div>
        <div className="min-w-0 lg:justify-self-end"><Countdown to={s === 'live' ? x.endsAt : x.startsAt} label={s === 'live' ? t.tEndsIn : t.tStartsIn} /></div>
      </div>
    </article>
  );
}

function Card({ x, s }: { x: Tournament; s: TournamentStatus }) {
  const { t, lang } = useI18n();
  const fmt = useFmt();
  useGames();
  const g = getGame(x.gameId);
  return (
    <article className="news-card news-card-hover">
      {x.image && (
        <>
          <img src={x.image} alt="" loading="lazy" decoding="async" className="tour-img" style={{ objectPosition: x.imagePos || undefined }} />
          <div aria-hidden="true" className="tour-fade" />
        </>
      )}
      <div className={`relative flex min-w-0 flex-1 flex-col p-5 ${x.image ? 'pt-12' : ''}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2"><StatusPill s={s} />{x.tier === 'major' && <MajorBadge />}</span>{g && <span className="text-[.82rem] font-semibold" style={{ color: 'var(--muted)' }}>{g.name[lang]}</span>}</div>
        <h3 className="text-[1.15rem] font-semibold leading-snug">{x.name[lang]}</h3>
        <p className="mt-1 text-[.88rem]" style={{ color: 'var(--muted)' }}><time dateTime={x.startsAt}>{fmt(x.startsAt)}</time></p>
        <Facts x={x} />
        {s === 'completed' && x.winner && <p className="mt-4 rounded-xl border px-3 py-2 text-[.88rem]" style={{ borderColor: 'var(--glass-b)' }}>{t.tWinner}: <b>{x.winner[lang]}</b></p>}
        <Register x={x} s={s} />
      </div>
    </article>
  );
}

/** Tournaments: live → upcoming → completed, with tabs and a countdown on the next/live event. */
export default function TournamentsSection() {
  const { t } = useI18n();
  const now = useNow(30000);
  const [tab, setTab] = useState<Tab>('all');
  const { items, status, retry } = useTournaments();
  const sorted = useMemo(() => sortTournaments(items, now), [items, now]);
  const withStatus = sorted.map((x) => ({ x, s: statusOf(x, now) }));
  const count = (k: Tab) => (k === 'all' ? withStatus.length : withStatus.filter((r) => r.s === k).length);
  const list = tab === 'all' ? withStatus : withStatus.filter((r) => r.s === tab);
  const featured = tab !== 'completed' && list[0] && list[0].s !== 'completed' ? list[0] : null;
  const rest = featured ? list.slice(1) : list;
  const chip = (on: boolean) => ({ color: on ? '#fff' : 'var(--muted)', background: on ? 'linear-gradient(135deg, #3d7bff, #5b5ff0)' : 'var(--glass)', borderColor: on ? 'transparent' : 'var(--glass-b)' });

  return (
    <section id="tournaments" aria-labelledby="tournaments-title" className="scroll-mt-20 px-[clamp(1.1rem,7vw,6.9rem)] py-[clamp(3rem,8vw,6rem)]" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="mb-7 max-w-[40rem]">
        <h2 id="tournaments-title" className="font-display text-[clamp(1.8rem,4vw,3.2rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{t.tournTitle}</h2>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>{t.tournSub}</p>
      </div>

      <div role="group" aria-label={t.tournTitle} className="mb-7 flex flex-wrap gap-2.5">
        {TABS.map((k) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className="rounded-full border px-4 py-2 text-[.9rem] font-semibold transition-colors" style={chip(tab === k)}>
            {t[TAB_KEY[k]]} <span className="opacity-70">({count(k)})</span>
          </button>
        ))}
      </div>

      {status === 'loading' && <div className="m-rail md:grid md:gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="news-skel" />)}</div>}
      {status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-4 rounded-2xl border p-5" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
          <p>{t.tError}</p>
          <button type="button" className="btn-glass !px-5 !py-2.5" onClick={retry}>{t.newsRetry}</button>
        </div>
      )}
      {status === 'ready' && list.length === 0 && <p style={{ color: 'var(--muted)' }}>{t.tEmpty}</p>}
      {status === 'ready' && list.length > 0 && (
        <div className="m-rail md:block">
          {featured && <Featured x={featured.x} s={featured.s} />}
          {rest.length > 0 && <div className="m-cont">{rest.map((r) => <Card key={r.x.id} x={r.x} s={r.s} />)}</div>}
        </div>
      )}
    </section>
  );
}
