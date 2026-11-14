import { useLayoutEffect, useMemo, useRef, useState } from 'react';
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

const ST_BG: Record<TournamentStatus, string> = { live: '#ef4565', upcoming: '#18a77a', completed: 'var(--tc-chip)' };

function StatusPill({ s }: { s: TournamentStatus }) {
  const { t } = useI18n();
  const solid = s !== 'completed';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[.78rem] font-bold backdrop-blur-sm" style={{ background: ST_BG[s], color: solid ? '#fff' : 'var(--text)' }}>
      {s === 'live' && <i aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-white" />}
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

/** Image on top (full colour, no overlay) with the status chips on it; the text sits below on a plain surface. */
function Media({ x, s, eager }: { x: Tournament; s: TournamentStatus; eager?: boolean }) {
  useGames();
  const { lang } = useI18n();
  const g = getGame(x.gameId);
  const c = g?.colors ?? ['#3d7bff', '#1a1f6a'];
  return (
    <div className="tc-im" style={x.image ? undefined : { background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }}>
      {x.image && <img src={x.image} alt="" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" className="tc-img" style={{ objectPosition: x.imagePos || undefined }} />}
      <div className="tc-chips"><StatusPill s={s} />{x.tier === 'major' && <MajorBadge />}{x.community && <span className="comm-badge" title={x.community.organizer || undefined}>{lang === 'ar' ? 'مجتمع' : 'Community'}</span>}</div>
    </div>
  );
}

/** Team tournaments: the winning team's player names as pills on ONE line; whatever does not fit goes behind «show all» (one long name may take the whole line). */
function WinnerMembers({ x }: { x: Tournament }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(1);
  const box = useRef<HTMLUListElement>(null);
  const meas = useRef<HTMLDivElement>(null);
  const members = useMemo(() => (x.mode === 'team' ? (x.winnerMembers ?? []).flatMap((m) => m.split('|')).map((m) => m.trim()).filter(Boolean) : []), [x.mode, x.winnerMembers]);
  const key = members.join('|');
  useLayoutEffect(() => {
    const c = box.current, m = meas.current;
    if (!c || !m || open) return;
    const calc = () => {
      const W = c.clientWidth, GAP = 6;
      const kids = Array.from(m.children) as HTMLElement[];
      const b = kids.pop()?.offsetWidth ?? 0;
      const ws = kids.map((k) => k.offsetWidth);
      const total = ws.reduce((a, w, i) => a + w + (i ? GAP : 0), 0);
      if (total <= W) { setN(ws.length); return; }
      let k = 0, used = 0;
      while (k < ws.length) { const nx = used + (k ? GAP : 0) + ws[k]; if (nx + GAP + b > W) break; used = nx; k++; }
      setN(Math.max(1, k));
    };
    calc();
    const ro = new ResizeObserver(calc); ro.observe(c);
    return () => ro.disconnect();
  }, [key, lang, open]);
  if (!members.length) return null;
  const shown = open ? members : members.slice(0, n);
  const pill = 'min-w-0 truncate rounded-full px-2.5 py-1 text-[.8rem]';
  const more = members.length > n;
  return (
    <div className="relative mt-2.5 min-w-0 max-w-full">
      <ul ref={box} className={`flex gap-1.5 ${open ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}>
        {shown.map((m, i) => <li key={`${m}-${i}`} dir="auto" className={pill} style={{ background: 'var(--tc-pill)' }}>{m}</li>)}
        {(open ? members.length > 1 : more) && <li className="shrink-0"><button type="button" className="rounded-full px-2.5 py-1 text-[.8rem] font-bold" style={{ color: 'var(--link-on)' }} onClick={() => setOpen((v) => !v)}>{open ? t.chShowLess : t.chShowAll}</button></li>}
      </ul>
      {/* hidden twin used only to measure how many names fit on one line */}
      <div ref={meas} aria-hidden="true" className="pointer-events-none invisible absolute start-0 top-0 flex w-max gap-1.5">
        {members.map((m, i) => <span key={`${m}-${i}`} dir="auto" className="whitespace-nowrap rounded-full px-2.5 py-1 text-[.8rem]">{m}</span>)}
        <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[.8rem] font-bold">{t.chShowAll}</span>
      </div>
    </div>
  );
}

function TourCard({ x, s, feat, eager }: { x: Tournament; s: TournamentStatus; feat?: boolean; eager?: boolean }) {
  const { t, lang } = useI18n();
  const fmt = useFmt();
  useGames();
  const g = getGame(x.gameId);
  const showCd = s === 'upcoming' || (feat && s === 'live');
  return (
    <article className={`tc ${feat ? 'tc-feat md:mb-6' : ''}`}>
      <Media x={x} s={s} eager={eager} />
      <div className="tc-body">
        {g && <span className="text-[.82rem] font-semibold" style={{ color: 'var(--muted)' }}>{g.name[lang]}</span>}
        <h3 className={`${feat ? 'text-[clamp(1.3rem,2.4vw,1.9rem)] font-extrabold' : 'text-[1.15rem] font-bold'} mt-0.5 leading-snug [overflow-wrap:anywhere]`}>{x.name[lang]}</h3>
        <p className="mt-1 text-[.88rem]" style={{ color: 'var(--muted)' }}><time dateTime={x.startsAt}>{fmt(x.startsAt)}</time></p>
        <Facts x={x} />
        {showCd && <div className="mt-4"><Countdown to={s === 'live' ? x.endsAt : x.startsAt} label={s === 'live' ? t.tEndsIn : t.tStartsIn} /></div>}
        {s === 'completed' && x.winner && <p className="tc-win"><span style={{ color: 'var(--muted)' }}>{t.tWinner}</span><b>{x.winner[lang]}</b></p>}
        {s === 'completed' && x.winner && <WinnerMembers x={x} />}
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

      <div role="group" aria-label={t.tournTitle} className="gm-filters mb-7 flex flex-wrap gap-2.5">
        {TABS.map((k) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={(e) => { setTab(k); try { e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch { /* ignore */ } }} className="rounded-full border px-4 py-2 text-[.9rem] font-semibold transition-colors" style={chip(tab === k)}>
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
          {featured && <TourCard feat eager x={featured.x} s={featured.s} />}
          {rest.length > 0 && <div className="m-cont">{rest.map((r, i) => <TourCard key={r.x.id} x={r.x} s={r.s} eager={i < 4} />)}</div>}
        </div>
      )}
    </section>
  );
}
