import type { ReactNode } from 'react';
import { getGame, SHOW_EXAMPLE_GAMES } from '../data/games';
import { useGames } from '../hooks/useGames';
import { useTournaments } from '../hooks/useTournaments';
import { statusOf, tournamentsForGame } from '../data/tournaments';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowIcon } from './icons';

const MASK = 'linear-gradient(180deg, #000 0%, #000 44%, rgba(0,0,0,.62) 62%, rgba(0,0,0,.28) 80%, transparent 100%)';
const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 first:mt-0" aria-label={title}>
      <h2 className="mb-5 text-[clamp(1.4rem,2.6vw,2rem)] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

const ST = { live: 'stLive', upcoming: 'stUpcoming', completed: 'stDone' } as const;
const card = { background: 'var(--glass)', borderColor: 'var(--glass-b)' };

/** Game details page (#/games/<id>). Optional sections disappear when the game has no data for them. */
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

  const shots = g.screenshots?.length ? g.screenshots : SHOW_EXAMPLE_GAMES ? [null, null, null] : [];
  const tone = g.tone ?? g.colors[0];
  const tile = { background: `linear-gradient(160deg, ${g.colors[0]}55, ${g.colors[1]})`, borderColor: 'var(--glass-b)' };

  return (
    <article className="page-in relative isolate min-h-[100svh] overflow-x-clip" style={{ background: 'var(--bg)' }}>
      {/* Ambient glow: the page under the banner keeps a faint tint of the artwork instead of going flat white. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60rem]" style={{ background: `radial-gradient(ellipse 85% 34rem at 50% 20rem, color-mix(in srgb, ${tone} 30%, transparent), transparent 100%)` }} />
      <header className={`on-art relative isolate pb-16 pt-[clamp(6.5rem,12vw,9rem)] ${WRAP}`}>
        {/* Backdrop: the art, blurred, reaching 9rem below the banner and fading out, so the colours melt into the page instead of ending in a hard edge. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 overflow-hidden" style={{ height: 'calc(100% + 3rem)', background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`, WebkitMaskImage: MASK, maskImage: MASK }}>
          {g.image && <img src={g.image} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl saturate-150" />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.38) 0%, rgba(0,0,0,.46) 52%, rgba(0,0,0,0) 78%)' }} />
        </div>
        <div className="mb-6 text-white">{back}</div>
        <span className="inline-block rounded-full border px-3.5 py-1 text-[.82rem] font-semibold" style={{ borderColor: 'rgba(255,255,255,.4)', background: 'rgba(0,0,0,.25)' }}>{g.genre[lang]}</span>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{g.name[lang]}</h1>
        <p className="mt-3 max-w-[40rem] text-[1.05rem]" style={{ color: 'rgba(255,255,255,.88)' }}>{g.tagline[lang]}</p>
      </header>

      <div className={`mx-auto max-w-[72rem] pb-[clamp(3rem,8vw,6rem)] pt-28 ${WRAP}`}>
        <Block title={t.secOverview}><p className="max-w-[48rem] leading-relaxed" style={{ color: 'var(--muted)' }}>{g.overview[lang]}</p></Block>

        {!!g.howToPlay?.length && (
          <Block title={t.secHow}>
            <ol className="grid gap-3 md:grid-cols-2">
              {g.howToPlay.map((s, i) => (
                <li key={i} className="flex items-start gap-4 rounded-2xl border p-4" style={card}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold text-white" style={{ background: 'linear-gradient(135deg, #ff3347, #d90f26)' }}>{i + 1}</span>
                  <span className="pt-1">{s[lang]}</span>
                </li>
              ))}
            </ol>
          </Block>
        )}

        {!!g.mechanics?.length && (
          <Block title={t.secMechanics}>
            <ul className="grid gap-3 md:grid-cols-3">
              {g.mechanics.map((m, i) => <li key={i} className="rounded-2xl border p-5" style={card}>{m[lang]}</li>)}
            </ul>
          </Block>
        )}

        {shots.length > 0 && (
          <Block title={t.secShots}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shots.map((src, i) => (
                <li key={i} className="aspect-video overflow-hidden rounded-2xl border" style={tile}>
                  {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[.9rem]" style={{ color: 'var(--muted)' }}>{t.shotSoon}</div>}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {!!g.videos?.length && (
          <Block title={t.secVideos}>
            <ul className="grid gap-4 md:grid-cols-2">
              {g.videos.map((v, i) => (
                <li key={i}>
                  <div className="aspect-video overflow-hidden rounded-2xl border" style={tile}>
                    {v.youtubeId
                      ? <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`} title={v.title[lang]} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
                      : <div className="grid h-full place-items-center text-[.9rem]" style={{ color: 'var(--muted)' }}>{t.videoSoon}</div>}
                  </div>
                  <p className="mt-2 font-semibold">{v.title[lang]}</p>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {tours.length > 0 && (
          <Block title={t.secTournaments}>
            <ul className="grid gap-3 md:grid-cols-2">
              {tours.map((x, i) => (
                <li key={i} className="rounded-2xl border p-5" style={card}>
                  <div className="font-semibold">{x.name[lang]}</div>
                  <div className="mt-1 text-[.9rem]" style={{ color: 'var(--muted)' }}><time dateTime={x.startsAt}>{date(x.startsAt)}</time> · {t[ST[statusOf(x, now)]]}</div>
                </li>
              ))}
            </ul>
            <a href="#tournaments" className="mt-4 inline-block text-[.95rem] font-semibold" style={{ color: 'var(--link-on)' }}>{t.viewTournaments}</a>
          </Block>
        )}


        {SHOW_EXAMPLE_GAMES && <p className="mt-10 text-[.8rem]" style={{ color: 'var(--muted)', opacity: 0.75 }}>{t.gamesExample}</p>}
        <div className="mt-8">{back}</div>
      </div>
    </article>
  );
}
