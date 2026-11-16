import { useState, type ReactNode } from 'react';
import { getGame } from '../data/games';
import { useGames } from '../hooks/useGames';
import { useTournaments } from '../hooks/useTournaments';
import { statusOf, tournamentsForGame, type TournamentStatus } from '../data/tournaments';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowIcon } from './icons';
import { useImageTones } from '../hooks/useImageTones';
import { Register } from './TournamentsSection';

const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';
const card = { background: 'var(--glass)', borderColor: 'transparent' };
const ST = { live: 'stLive', upcoming: 'stUpcoming', completed: 'stDone' } as const;
const TONE = { live: '#27c27a', upcoming: '#ffb02e', completed: '#9aa0b8' } as const;
type Tab = 'all' | TournamentStatus;
const TABS: Tab[] = ['all', 'live', 'upcoming', 'completed'];
const TAB_KEY = { all: 'tabAll', live: 'tabLive', upcoming: 'tabUpcoming', completed: 'tabDone' } as const;

function Block({ title, children, bare }: { title: string; children: ReactNode; bare?: boolean }) {
  return (
    <section aria-label={title} className="mt-10">
      {!bare && <h2 className="mb-4 text-[1.35rem] font-extrabold">{title}</h2>}
      {children}
    </section>
  );
}

type GText = NonNullable<import('../data/games').Game['texts']>[number];
const isBullets = (b: string) => { const l = b.split('\n').filter(Boolean); return l.length > 1 && l.every((x) => x.startsWith('• ')); };
const bullets = (b: string) => b.split('\n').filter(Boolean).map((x) => x.replace(/^•\s*/, ''));
/** The about section as a lead, chips for quick facts, a goal callout and divided sections (tips as ticks, tournament notes as numbered steps). Falls back to plain divided sections for custom paragraphs. */
function GameTexts({ texts, lang }: { texts: GText[]; lang: 'ar' | 'en' }) {
  const items = texts.map((x) => ({ title: x.title[lang], body: x.body[lang], isGoal: x.title.ar === 'الهدف' || x.title.en === 'Goal' })).filter((x) => x.title || x.body);
  const facts = items.length > 2 && !isBullets(items[0].body) && items[0].body.split('\n').filter(Boolean).length <= 5 && items[0].body.split('\n').every((l) => l.length <= 60) ? items[0] : null;
  const rest = facts ? items.slice(1) : items;
  const lastBullets = rest.map((x, i) => (isBullets(x.body) ? i : -1)).filter((i) => i >= 0).pop();
  let leadDone = false;
  return (
    <div className="gt">
      {facts && <div className="gt-chips" role="list" aria-label={facts.title}>{facts.body.split('\n').filter(Boolean).map((f, i) => <span key={i} role="listitem" className="gt-chip">{f}</span>)}</div>}
      {rest.map((x, i) => {
        if (isBullets(x.body)) {
          const steps = i === lastBullets && i > 0;
          const List = steps ? 'ol' : 'ul';
          return <section key={i} className="gt-sec">{x.title && <h2>{x.title}</h2>}<List className={steps ? 'gt-steps' : 'gt-ck'}>{bullets(x.body).map((b, k) => <li key={k}>{b}</li>)}</List></section>;
        }
        if (x.isGoal) return <div key={i} className="gt-goal">{x.title && <b>{x.title}: </b>}{x.body}</div>;
        if (!leadDone) { leadDone = true; return <p key={i} className="gt-lead">{x.body}</p>; }
        return <section key={i} className="gt-sec">{x.title && <h2>{x.title}</h2>}<p className="whitespace-pre-line">{x.body}</p></section>;
      })}
    </div>
  );
}

/** Game page (#/games/<id>): header with tags, then about (≤2 texts), videos (≤4), images (≤4) and the game's tournaments. Sections with nothing added are not shown. */
export default function GamePage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  useGames();
  const g = getGame(id);
  const tones = useImageTones(g?.image);
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
      <section className={`min-h-[100svh] pb-16 pt-[clamp(6.5rem,12vw,9rem)] ${WRAP}`} style={{ backgroundColor: 'var(--bg)' }}>
        <p className="mb-6 text-xl">{t.gameNotFound}</p>{back}
      </section>
    );
  }

  const tone = tones?.[0] ?? g.tone ?? g.colors[0];
  const tone2 = tones?.[1] ?? tone;
  const rows = tournamentsForGame(allTours, g.id).map((x) => ({ x, s: statusOf(x, now) }))
    .sort((a, b) => ({ live: 0, upcoming: 1, completed: 2 })[a.s] - ({ live: 0, upcoming: 1, completed: 2 })[b.s] || Date.parse(b.x.startsAt) - Date.parse(a.x.startsAt));
  const count = (k: Tab) => (k === 'all' ? rows.length : rows.filter((r) => r.s === k).length);
  const list = tab === 'all' ? rows : rows.filter((r) => r.s === tab);
  const tag = rows.some((r) => r.s === 'live') ? t.gTagLive : rows.some((r) => r.s === 'upcoming') ? t.gTagUpcoming : '';
  const chip = (on: boolean) => ({ color: on ? '#fff' : 'var(--muted)', background: on ? 'linear-gradient(135deg, #3d7bff, #5b5ff0)' : 'var(--glass)', borderColor: 'transparent' });

  return (
    <article className="page-in relative isolate min-h-[100svh] overflow-x-clip" style={{ backgroundColor: 'var(--bg)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] transition-opacity duration-700" style={{ background: `radial-gradient(ellipse 62% 24rem at 30% 0, color-mix(in srgb, ${tone} 34%, transparent), transparent), radial-gradient(ellipse 58% 22rem at 75% 0, color-mix(in srgb, ${tone2} 26%, transparent), transparent)` }} />
      <div className={`mx-auto max-w-[72rem] pb-[clamp(3rem,8vw,6rem)] pt-[clamp(8rem,14vw,11rem)] ${WRAP}`}>
        <div className="mb-10">{back}</div>

        <header className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-center">
          <span className="relative aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-3xl sm:w-44" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`, boxShadow: `0 20px 50px -22px ${tone}` }}>
            {g.image ? <img src={g.image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 22%' }} /> : <span aria-hidden="true" className="absolute inset-0" style={{ background: `url(${import.meta.env.BASE_URL}brand/cube-v2.png) 50% 50% / 52% no-repeat` }} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border px-3.5 py-1 text-[.82rem] font-semibold" style={{ borderColor: 'transparent', background: 'var(--chip-bg)' }}>{g.genre[lang]}</span>
              {tag && <span className="rounded-full border px-3.5 py-1 text-[.82rem] font-semibold" style={{ borderColor: 'transparent', background: 'var(--chip-bg)', color: 'var(--link-on)' }}>{tag}</span>}
            </div>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.4rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{g.name[lang]}</h1>
            <p className="mt-2 max-w-[40rem]" style={{ color: 'var(--muted)' }}>{g.tagline[lang]}</p>
          </div>
        </header>

        {!!g.texts?.length && <Block title={t.gSecAbout} bare>
          <GameTexts texts={g.texts} lang={lang} />
        </Block>}

        {!!g.videos?.length && <Block title={t.gSecVideos}>
          {(
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.videos.map((v, i) => (
                <li key={i}>
                  <div className="aspect-video overflow-hidden rounded-2xl border" style={card}>
                    {v.src
                      ? <video className="h-full w-full bg-black object-contain" src={v.src} controls playsInline preload="metadata" aria-label={v.title[lang]} />
                      : <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`} title={v.title[lang]} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />}
                  </div>
                  {v.title[lang] && <p className="mt-2 text-[.9rem] font-semibold">{v.title[lang]}</p>}
                </li>
              ))}
            </ul>
          )}
        </Block>}

        {!!g.images?.length && <Block title={t.gSecImages}>
          {(
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.images.map((src, i) => (
                <li key={i} className="aspect-video overflow-hidden rounded-2xl border" style={card}>
                  <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          )}
        </Block>}

        {!!rows.length && <Block title={t.gSecTours}>
          {(
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
                      <span className="w-max rounded-full border px-2.5 py-0.5 text-[.72rem] font-bold" style={{ color: TONE[s], borderColor: 'transparent', background: 'var(--chip-bg)' }}>{t[ST[s]]}</span>
                      <div className="mt-1 font-semibold">{x.name[lang]}</div>
                      <div className="text-[.85rem]" style={{ color: 'var(--muted)' }}><time dateTime={x.startsAt}>{date(x.startsAt)}</time>{s === 'completed' && x.endsAt ? <> – <time dateTime={x.endsAt}>{date(x.endsAt)}</time></> : null}</div>
                      {s === 'completed' && x.winner && <div className="text-[.88rem]">{t.tWinner}: <b>{x.winner[lang]}</b></div>}
                      <Register x={x} s={s} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </Block>}

        <div className="mt-12">{back}</div>
      </div>
    </article>
  );
}
