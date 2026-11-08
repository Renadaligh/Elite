import type { ReactNode } from 'react';
import { getGame } from '../data/games';
import { useGames } from '../hooks/useGames';
import { useTournaments } from '../hooks/useTournaments';
import { statusOf, tournamentsForGame } from '../data/tournaments';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowIcon } from './icons';

const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';
const card = { background: 'var(--glass)', borderColor: 'var(--glass-b)' };
const ST = { live: 'stLive', upcoming: 'stUpcoming', completed: 'stDone' } as const;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-4 text-[1.35rem] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

/** Game page (#/games/<id>): a short header, then how to play, a tip, a video and the game's tournaments. Empty sections are hidden. */
export default function GamePage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  useGames();
  const g = getGame(id);
  const { items: allTours } = useTournaments();
  const tours = g ? tournamentsForGame(allTours, g.id) : [];
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
  const lvl = g.level ? { easy: t.lvEasy, medium: t.lvMedium, hard: t.lvHard }[g.level] : '';
  const facts = [
    g.players && [t.gfPlayers, g.players],
    g.minutes && [t.gfMinutes, `${g.minutes} ${t.gfMin}`],
    lvl && [t.gfLevel, lvl],
  ].filter(Boolean) as string[][];
  const video = g.videos?.find((v) => v.youtubeId);
  const hasHow = !!g.howToPlay?.length;
  const hasSide = !!video || tours.length > 0;
  const empty = !hasHow && !g.tip && !hasSide;

  return (
    <article className="page-in relative isolate min-h-[100svh] overflow-x-clip" style={{ background: 'var(--bg)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem]" style={{ background: `radial-gradient(ellipse 70% 22rem at 50% 0, color-mix(in srgb, ${tone} 26%, transparent), transparent)` }} />
      <div className={`mx-auto max-w-[72rem] pb-[clamp(3rem,8vw,6rem)] pt-[clamp(8rem,14vw,11rem)] ${WRAP}`}>
        <div className="mb-10">{back}</div>

        <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-center" style={{ borderColor: 'var(--glass-b)' }}>
          <span className="relative h-36 w-36 shrink-0 overflow-hidden rounded-3xl sm:h-44 sm:w-44" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`, boxShadow: `0 20px 50px -22px ${tone}` }}>
            {g.image && <img src={g.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          </span>
          <div className="min-w-0">
            <span className="inline-block rounded-full border px-3.5 py-1 text-[.82rem] font-semibold" style={{ borderColor: 'var(--glass-b)' }}>{g.genre[lang]}</span>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.4rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{g.name[lang]}</h1>
            <p className="mt-2 max-w-[40rem]" style={{ color: 'var(--muted)' }}>{g.tagline[lang]}</p>
            {!!facts.length && (
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {facts.map(([k, v]) => (
                  <li key={k} className="rounded-2xl border px-4 py-2 text-[.8rem]" style={card}><span style={{ color: 'var(--muted)' }}>{k}</span><b className="block text-[1rem]">{v}</b></li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {empty && <p className="mt-10" style={{ color: 'var(--muted)' }}>{t.gameSoon}</p>}

        {!empty && (
          <div className={`mt-9 grid gap-9 ${hasSide && (hasHow || g.tip) ? 'lg:grid-cols-[1.4fr_1fr]' : ''}`}>
            {(hasHow || g.tip) && (
              <div className="grid content-start gap-7">
                {hasHow && (
                  <Block title={t.secHow}>
                    <ol className="grid gap-2.5">
                      {g.howToPlay!.map((s, i) => (
                        <li key={i} className="flex items-start gap-4 rounded-2xl border p-4" style={card}>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[.9rem] font-bold text-white" style={{ background: 'linear-gradient(135deg, #ff3347, #d90f26)' }}>{i + 1}</span>
                          <span className="pt-0.5">{s[lang]}</span>
                        </li>
                      ))}
                    </ol>
                  </Block>
                )}
                {g.tip && (
                  <aside className="rounded-xl border-s-[3px] px-4 py-3.5" style={{ borderColor: '#ff4455', background: 'rgba(255,51,71,.07)' }}>
                    <b style={{ color: '#ff4455' }}>{t.secTip}: </b>{g.tip[lang]}
                  </aside>
                )}
              </div>
            )}

            {hasSide && (
              <div className="grid content-start gap-8">
                {video && (
                  <Block title={t.secVideos}>
                    <div className="aspect-video overflow-hidden rounded-2xl border" style={card}>
                      <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`} title={video.title[lang]} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  </Block>
                )}
                {tours.length > 0 && (
                  <Block title={t.secTournaments}>
                    <ul className="grid gap-2.5">
                      {tours.map((x) => (
                        <li key={x.id} className="rounded-2xl border p-4" style={card}>
                          <div className="font-semibold">{x.name[lang]}</div>
                          <div className="mt-1 text-[.88rem]" style={{ color: 'var(--muted)' }}><time dateTime={x.startsAt}>{date(x.startsAt)}</time> · {t[ST[statusOf(x, now)]]}</div>
                        </li>
                      ))}
                    </ul>
                    <a href="#tournaments" className="mt-3 inline-block text-[.95rem] font-semibold" style={{ color: 'var(--link-on)' }}>{t.viewTournaments}</a>
                  </Block>
                )}
              </div>
            )}
          </div>
        )}
        <div className="mt-10">{back}</div>
      </div>
    </article>
  );
}
