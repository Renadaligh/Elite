import { useMemo, useState } from 'react';
import { statusOf, sortTournaments, type TournamentStatus } from '../data/tournaments';
import { useNow } from '../hooks/useNow';
import { useTournaments } from '../hooks/useTournaments';
import { useI18n } from '../i18n/I18nProvider';
import type { Dict } from '../i18n/translations';
import { TourCard } from './TournamentsSection';

type Tab = 'all' | TournamentStatus;
const TABS: Tab[] = ['all', 'live', 'upcoming', 'completed'];
const TAB_KEY: Record<Tab, keyof Dict> = { all: 'tabAll', live: 'tabLive', upcoming: 'tabUpcoming', completed: 'tabDone' };

/** "All tournaments" page (/tournaments): every tournament, filterable by status. */
export default function TournamentsPage() {
  const { t } = useI18n();
  const now = useNow(30000);
  const [tab, setTab] = useState<Tab>('all');
  const { items, status, retry } = useTournaments();
  const withStatus = useMemo(() => sortTournaments(items, now).map((x) => ({ x, s: statusOf(x, now) })), [items, now]);
  const count = (k: Tab) => (k === 'all' ? withStatus.length : withStatus.filter((r) => r.s === k).length);
  const list = tab === 'all' ? withStatus : withStatus.filter((r) => r.s === tab);
  const chip = (on: boolean) => ({ color: on ? '#fff' : 'var(--muted)', background: on ? 'linear-gradient(135deg, #3d7bff, #5b5ff0)' : 'var(--glass)', borderColor: on ? 'transparent' : 'var(--glass-b)' });

  return (
    <section aria-labelledby="tournaments-page-title" className="min-h-[100svh] px-[clamp(1.1rem,7vw,6.9rem)] pb-[clamp(3rem,8vw,6rem)] pt-[clamp(6.5rem,12vw,9rem)]" style={{ backgroundColor: 'var(--bg)' }}>
      <a href="#top" className="mb-6 inline-flex items-center gap-2 text-[.95rem]" style={{ color: 'var(--muted)' }}>
        <span aria-hidden="true" className="inline-block -scale-x-100 rtl:scale-x-100">→</span> {t.newsBack}
      </a>
      <h1 id="tournaments-page-title" className="font-display text-[clamp(2rem,5vw,3.6rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{t.tournTitle}</h1>
      <p className="mt-2 max-w-[40rem]" style={{ color: 'var(--muted)' }}>{t.tournSub}</p>

      <div role="group" aria-label={t.tournTitle} className="mt-7 flex flex-wrap gap-2.5">
        {TABS.map((k) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className="rounded-full border px-4 py-2 text-[.9rem] font-semibold transition-colors" style={chip(tab === k)}>
            {t[TAB_KEY[k]]} <span className="opacity-70">({count(k)})</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {status === 'loading' && <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="news-skel" />)}</div>}
        {status === 'error' && (
          <div role="alert" className="flex flex-wrap items-center gap-4 rounded-2xl border p-5" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
            <p>{t.tError}</p>
            <button type="button" className="btn-glass !px-5 !py-2.5" onClick={retry}>{t.newsRetry}</button>
          </div>
        )}
        {status === 'ready' && list.length === 0 && <p style={{ color: 'var(--muted)' }}>{t.tEmpty}</p>}
        {status === 'ready' && list.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.map((r, i) => <TourCard key={r.x.id} x={r.x} s={r.s} eager={i < 6} />)}</div>
        )}
      </div>
    </section>
  );
}
