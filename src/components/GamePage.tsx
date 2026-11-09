import { useState, type ReactNode } from 'react';
import { getGame } from '../data/games';
import { useGames } from '../hooks/useGames';
import { useTournaments } from '../hooks/useTournaments';
import { statusOf, tournamentsForGame, type TournamentStatus } from '../data/tournaments';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowIcon } from './icons';
import { Register } from './TournamentsSection';

const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';
const card = { background: 'var(--glass)', borderColor: 'var(--glass-b)' };
const ST = { live: 'stLive', upcoming: 'stUpcoming', completed: 'stDone' } as const;
const TONE = { live: '#27c27a', upcoming: '#ffb02e', completed: '#9aa0b8' } as const;
type Tab = 'all' | TournamentStatus;
const TABS: Tab[] = ['all', 'live', 'upcoming', 'completed'];
const TAB_KEY = { all: 'tabAll', live: 'tabLive', upcoming: 'tabUpcoming', completed: 'tabDone' } as const;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="mt-10">
      <h2 className="mb-4 text-[1.35rem] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

/** Game page (#/games/<id>): header with tags, then about (≤2 texts), videos (≤4), images (≤4) and the game's tournaments. Empty sections say "Coming soon". */
export default function GamePage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  useGames();
  const g = getGame(id);
  const { items: allTours } = useTournaments();
  const [tab, setTab] = useState<Tab>('all');
  const now = Date.now();
  const date = (d: string) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d));
  const back = (
    <a href="#games" className="inline-flex items-center gap-2 text-[.95rem]" style={{ color: 'var(--muted)' }}>
      <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" /> {t.gamesBack}
    </a>
  );

  if (!g) {
    return (
      <section className={`min-h-[100svh] pb-16 pt-[clamp(6.5rem,12vw,9rem)] ${WRAP}`} style={{ background: 'var(--bg)' }}>
        <p className="mb-6 text-xl">{t.gameNotFound}</p>{back}
      </section>
    );
  }

  const tone = g.tone ?? g.colors[0];
  const rows = tournamentsForGame(allTours, g.id).map((x) => ({ x, s: statusOf(x, now) }))
    .sort((a, b) => ({ live: 0, upcoming: 1, completed: 2 })[a.s] - ({ live: 0, upcoming: 1, completed: 2 })[b.s] || Date.parse(b.x.startsAt) - Date.parse(a.x.startsAt));
  const count = (k: Tab) => (k === 'all' ? rows.length : rows.filter((r) => r.s === k).length);
  const list = tab === 'all' ? rows : rows.filter((r) => r.s === tab);
  const tag = rows.some((r) => r.s === 'live') ? t.gTagLive : rows.some((r) => r.s === 'upcoming') ? t.gTagUpcoming : '';
  const soon = <p className="rounded-2xl border px-5 py-6" style={{ ...card, color: 'var(--muted)' }}>{t.gSoon}</p>;
  const chip = (on: boolean) => ({ color: on ? '#fff' : 'var(--muted)', background: on ? 'linear-gradient(135deg, #ff3347, #d90f26)' : 'var(--glass)', borderColor: on ? 'transparent' : 'var(--glass-b)' });

  return (
    <article className="page-in relative isolate min-h-[100svh] overflow-x-clip" style={{ background: 'var(--bg)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem]" style={{ background: `radial-gradient(ellipse 70% 22rem at 50% 0, color-mix(in srgb, ${tone} 26%, transparent), transparent)` }} />
      <div className={`mx-auto max-w-[72rem] pb-[clamp(3rem,8vw,6rem)] pt-[clamp(8rem,14vw,11rem)] ${WRAP}`}>
        <div className="mb-10">{back}</div>

        <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-center" style={{ borderColor: 'var(--glass-b)' }}>
          <span className="relative aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-3xl sm:w-44" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`, boxShadow: `0 20px 50px -22px ${tone}` }}>
            {g.image && <img src={g.image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 22%' }} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border px-3.5 py-1 text-[.82rem] font-semibold" style={{ borderColor: 'var(--glass-b)' }}>{g.genre[lang]}</span>
              {tag && <span className="rounded-full border px-3.5 py-1 text-[.82rem] font-semibold" style={{ borderColor: '#ff4455', color: '#ff4455' }}>{tag}</span>}
            </div>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.4rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{g.name[lang]}</h1>
            <p className="mt-2 max-w-[40rem]" style={{ color: 'var(--muted)' }}>{g.tagline[lang]}</p>
          </div>
        </header>

        <Block title={t.gSecAbout}>
          {g.texts?.length ? (
            <div className={`grid gap-4 ${g.texts.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {g.texts.map((x, i) => (
                <div key={i} className="rounded-2xl border p-5" style={card}>
                  {x.title[lang] && <h3 className="mb-2 text-[1.1rem] font-bold">{x.title[lang]}</h3>}
                  <p className="whitespace-pre-line leading-relaxed" style={{ color: 'var(--muted)' }}>{x.body[lang]}</p>
                </div>
              ))}
            </div>
          ) : soon}
        </Block>

        <Block title={t.gSecVideos}>
          {g.videos?.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.videos.map((v, i) => (
                <li key={i}>
                  <div className="aspect-video overflow-hidden rounded-2xl border" style={card}>
                    <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`} title={v.title[lang]} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                  {v.title[lang] && <p className="mt-2 text-[.9rem] font-semibold">{v.title[lang]}</p>}
                </li>
              ))}
            </ul>
          ) : soon}
        </Block>

        <Block title={t.gSecImages}>
          {g.images?.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.images.map((src, i) => (
                <li key={i} className="aspect-video overflow-hidden rounded-2xl border" style={card}>
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          ) : soon}
        </Block>

        <Block title={t.gSecTours}>
          {rows.length ? (
            <>
              <div role="group" aria-label={t.gSecTours} className="mb-4 flex flex-wrap gap-2.5">
                {TABS.map((k) => (
                  <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className="rounded-full border px-4 py-2 text-[.9rem] font-semibold transition-colors" style={chip(tab === k)}>
                    {t[TAB_KEY[k]]} <span className="opacity-70">({count(k)})</span>
                  </button>
                ))}
              </div>
              {list.length ? (
                <ul className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
                  {list.map(({ x, s }) => (
                    <li key={x.id} className="flex w-[17rem] shrink-0 snap-start flex-col gap-1.5 rounded-2xl border p-4" style={card}>
                      <span className="w-max rounded-full border px-2.5 py-0.5 text-[.72rem] font-bold" style={{ color: TONE[s], borderColor: TONE[s] }}>{t[ST[s]]}</span>
                      <div className="mt-1 font-semibold">{x.name[lang]}</div>
                      <div className="text-[.85rem]" style={{ color: 'var(--muted)' }}><time dateTime={x.startsAt}>{date(x.startsAt)}</time></div>
                      {s === 'completed' && x.winner && <div className="text-[.88rem]">{t.tWinner}: <b>{x.winner[lang]}</b></div>}
                      <Register x={x} s={s} />
                    </li>
                  ))}
                </ul>
              ) : soon}
            </>
          ) : soon}
        </Block>

        <div className="mt-12">{back}</div>
      </div>
    </article>
  );
}
