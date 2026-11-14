import { useMemo, useRef, useState } from 'react';
import type { NewsTag } from '../data/news';
import { useCardsReveal } from '../hooks/useCardsReveal';
import { useNews } from '../hooks/useNews';
import { useI18n } from '../i18n/I18nProvider';
import NewsCard, { TAG_KEY } from './NewsCard';

const TAGS: NewsTag[] = ['update', 'tournament', 'community', 'event'];

/** "All news" page (#/news): every story, newest first, filterable by category. */
export default function NewsPage() {
  const { t } = useI18n();
  const { items, status, retry } = useNews(200);
  const [tag, setTag] = useState<NewsTag | 'all'>('all');
  const root = useRef<HTMLElement>(null);

  const shown = useMemo(() => (tag === 'all' ? items : items.filter((n) => n.tag === tag)), [items, tag]);
  const present = useMemo(() => TAGS.filter((x) => items.some((n) => n.tag === x)), [items]);
  useCardsReveal(root, status === 'ready', [shown]);

  const chip = (on: boolean) => ({ color: on ? '#fff' : 'var(--muted)', background: on ? 'linear-gradient(135deg, #3d7bff, #5b5ff0)' : 'var(--glass)', borderColor: on ? 'transparent' : 'var(--glass-b)' });

  return (
    <section ref={root} aria-labelledby="news-page-title" className="min-h-[100svh] px-[clamp(1.1rem,7vw,6.9rem)] pb-[clamp(3rem,8vw,6rem)] pt-[clamp(6.5rem,12vw,9rem)]" style={{ backgroundColor: 'var(--bg)' }}>
      <a href="#top" className="mb-6 inline-flex items-center gap-2 text-[.95rem]" style={{ color: 'var(--muted)' }}>
        <span aria-hidden="true" className="inline-block -scale-x-100 rtl:scale-x-100">→</span> {t.newsBack}
      </a>
      <h1 id="news-page-title" className="font-display text-[clamp(2rem,5vw,3.6rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{t.newsTitle}</h1>
      <p className="mt-2 max-w-[40rem]" style={{ color: 'var(--muted)' }}>{t.newsSub}</p>

      {status === 'ready' && present.length > 1 && (
        <div role="group" aria-label={t.newsFilter} className="mt-7 flex flex-wrap gap-2.5">
          {(['all', ...present] as const).map((x) => (
            <button key={x} type="button" aria-pressed={tag === x} onClick={() => setTag(x)} className="rounded-full border px-4 py-2 text-[.9rem] font-semibold transition-colors" style={chip(tag === x)}>
              {x === 'all' ? t.filterAll : t[TAG_KEY[x]]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {status === 'loading' && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="news-skel" />)}
          </div>
        )}
        {status === 'error' && (
          <div role="alert" className="flex flex-wrap items-center gap-4 rounded-2xl border p-5" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
            <p>{t.newsError}</p>
            <button type="button" className="btn-glass !px-5 !py-2.5" onClick={retry}>{t.newsRetry}</button>
          </div>
        )}
        {status === 'ready' && shown.length === 0 && <p style={{ color: 'var(--muted)' }}>{t.newsEmpty}</p>}
        {status === 'ready' && shown.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((n, i) => <NewsCard key={n.id} item={n} eager={i < 4} />)}
          </div>
        )}
      </div>
    </section>
  );
}
