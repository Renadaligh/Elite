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

const TrophyIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5Z" /><path d="M8 6.5H5a3 3 0 0 0 3 4M16 6.5h3a3 3 0 0 1-3 4M12 13.5v3.5M8.5 20h7M10 17h4" />
  </svg>
);

/** Tall winner card (portrait, 9:16 art). No portrait → a game-coloured card with the winner's initial. */
function ChampionCard({ x }: { x: Tournament }) {
  const { t, lang } = useI18n();
  const date = useDate();
  useGames();
  const g = getGame(x.gameId);
  const c = g?.colors ?? ['#ff3347', '#4a0a12'];
  const winner = x.winner?.[lang] ?? '';
  return (
    <article className="group relative isolate aspect-[9/16] overflow-hidden rounded-3xl border shadow-[0_24px_50px_-26px_rgba(120,10,25,.7)] transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: 'var(--glass-b)', background: `linear-gradient(160deg, ${c[0]}, ${c[1]})` }}>
      {x.winnerImage
        ? <img src={x.winnerImage} alt={winner} loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        : <span aria-hidden="true" className="absolute inset-0 -z-10 grid place-items-center font-display text-[9rem] font-black leading-none text-white/20 rtl:font-sans">{winner.trim().charAt(0).toUpperCase()}</span>}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-[5] h-[58%]" style={{ background: 'linear-gradient(180deg, transparent, rgba(8,8,10,.78) 55%, rgba(8,8,10,.94))' }} />
      <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[.78rem] font-bold text-[#3a2600]" style={{ background: 'linear-gradient(135deg,#ffd54a,#ffb300)', boxShadow: '0 8px 18px -8px rgba(255,179,0,.9)' }}>
        <TrophyIcon className="h-3.5 w-3.5" />{t.chBadge}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        {g && <span className="mb-2 inline-block rounded-full border border-white/40 bg-black/25 px-2.5 py-0.5 text-[.74rem] font-semibold backdrop-blur-sm">{g.name[lang]}</span>}
        <h3 dir="auto" className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{winner}</h3>
        <p className="mt-1 text-[.92rem] text-white/85">{x.name[lang]}</p>
        <p className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/25 pt-3 text-[.8rem] text-white/80">
          <time dateTime={x.startsAt}>{date(x)}</time>
          <span className="font-semibold text-[#ffd54a]">{t.chPrize}: {x.prize[lang]}</span>
        </p>
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
  const c = g?.colors ?? ['#ff3347', '#4a0a12'];
  const winner = x.winner?.[lang] ?? '';
  return (
    <li className="flex items-center gap-4 rounded-2xl border p-3 pe-5" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      <span className="relative aspect-[9/16] h-16 shrink-0 overflow-hidden rounded-xl" style={{ background: `linear-gradient(160deg, ${c[0]}, ${c[1]})` }}>
        {x.winnerImage
          ? <img src={x.winnerImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          : <span aria-hidden="true" className="grid h-full w-full place-items-center text-xl font-black text-white/70">{winner.trim().charAt(0).toUpperCase()}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <div dir="auto" className="truncate text-[1.05rem] font-bold">{winner}</div>
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
