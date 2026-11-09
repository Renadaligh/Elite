import { getGame } from '../data/games';
import { streamEmbed } from '../data/stream';
import { statusOf } from '../data/tournaments';
import { useGames } from '../hooks/useGames';
import { useTournaments } from '../hooks/useTournaments';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowIcon } from './icons';
import BracketView from './BracketView';
import { resolve } from '../data/bracket';

const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';
const ST = { live: 'stLive', upcoming: 'stUpcoming', completed: 'stDone' } as const;
const TONE = { live: '#27c27a', upcoming: '#ffb02e', completed: '#9aa0b8' } as const;

/** Tournament page (#/tournaments/<id>): live stream (only while the dashboard switch is on) and the live bracket. Refreshes itself every 30 s. */
export default function TournamentPage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  useGames();
  const { items, status } = useTournaments();
  const x = items.find((i) => i.id === id);
  const back = (
    <a href="#tournaments" className="inline-flex items-center gap-2 text-[.95rem]" style={{ color: 'var(--muted)' }}>
      <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" /> {t.tBackTours}
    </a>
  );
  if (!x) {
    return (
      <section className={`min-h-[100svh] pb-16 pt-[clamp(6.5rem,12vw,9rem)] ${WRAP}`} style={{ background: 'var(--bg)' }}>
        <p className="mb-6 text-xl">{status === 'loading' ? '…' : t.tTourGone}</p>{back}
      </section>
    );
  }
  const s = statusOf(x, Date.now());
  const g = getGame(x.gameId);
  const cm = x.bracket?.cur && s !== 'completed' ? x.bracket.matches.find((m) => m.id === x.bracket!.cur && !m.win) : undefined;
  const cr = cm && x.bracket ? resolve(x.bracket).get(cm.id) : undefined;
  const pn = (w: unknown) => (typeof w === 'number' ? x.bracket!.players[w] : '');
  const embed = x.streamLive ? streamEmbed(x.streamUrl) : null;
  return (
    <article className={`page-in min-h-[100svh] pb-20 pt-[clamp(6.5rem,12vw,9rem)] ${WRAP}`} style={{ background: 'var(--bg)' }}>
      {back}
      <header className="mb-8 mt-5">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[.85rem] font-semibold">
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: TONE[s] }} />{t[ST[s]]}</span>
          {g && <span style={{ color: 'var(--muted)' }}>{g.name[lang]}</span>}
        </div>
        <h1 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-tight [overflow-wrap:anywhere]">{x.name[lang]}</h1>
        <p className="mt-1.5" style={{ color: 'var(--muted)' }}>{x.format[lang]}</p>
      </header>

      {x.streamLive && x.streamUrl && (
        <section aria-label={t.tStream} className="mb-10">
          <h2 className="mb-3 flex items-center gap-2 text-[1.2rem] font-extrabold"><i className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: '#ff3347' }} />{t.tStream}</h2>
          {embed ? <div className="stream-box"><iframe src={embed} title={t.tStream} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
            : <a href={x.streamUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">{t.tStreamOpen} <ArrowIcon className="h-4 w-4 rtl:rotate-180" /></a>}
        </section>
      )}

      <section aria-label={t.tBracketTitle}>
        <h2 className="mb-3 text-[1.2rem] font-extrabold">{t.tBracketTitle}</h2>
        {cr && typeof cr.a === 'number' && typeof cr.b === 'number' && (
          <p className="mb-4 inline-flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 text-[.95rem]" style={{ borderColor: '#ff3347', background: 'rgba(255,51,71,.1)' }}>
            <span className="rounded px-2 py-0.5 text-[.65rem] font-extrabold tracking-wider text-white" style={{ background: '#ff3347' }}>{lang === 'ar' ? 'الآن' : 'LIVE'}</span>
            <b>{pn(cr.a)}</b><span style={{ color: 'var(--muted)' }}>{lang === 'ar' ? 'ضد' : 'vs'}</span><b>{pn(cr.b)}</b>
          </p>
        )}
        {x.bracket && s !== 'completed' ? <BracketView bracket={x.bracket} />
          : <p className="rounded-2xl border px-5 py-6" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)', color: 'var(--muted)' }}>{t.tNoBracket}</p>}
      </section>
    </article>
  );
}
