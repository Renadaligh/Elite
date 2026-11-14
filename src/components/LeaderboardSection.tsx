import { useMemo } from 'react';
import { statusOf } from '../data/tournaments';
import { useTournaments } from '../hooks/useTournaments';
import { useI18n } from '../i18n/I18nProvider';
import SectionShell from './SectionShell';

const PTS = { regular: 3, major: 5 } as const;

interface Row { key: string; name: string; wins: number; pts: number; last: number }

/** Top 3 players by tournament wins. Same name (any letter case) = same player; team wins count for every member. Hidden until SHOW_LEADERBOARD is switched on in config/site.ts. */
export default function LeaderboardSection() {
  const { t, lang, dir } = useI18n();
  const { items } = useTournaments();
  const top = useMemo(() => {
    const now = Date.now();
    const rows = new Map<string, Row>();
    for (const x of items) {
      if (!x.winner || statusOf(x, now) !== 'completed') continue;
      const names = x.mode === 'team'
        ? (x.winnerMembers ?? []).flatMap((m) => m.split('|')).map((m) => m.trim()).filter(Boolean)
        : [(x.winner[lang] || x.winner.ar || x.winner.en || '').trim()].filter(Boolean);
      const when = Date.parse(x.endsAt) || 0;
      for (const name of new Set(names)) {
        const key = name.toLocaleLowerCase();
        const r = rows.get(key) ?? { key, name, wins: 0, pts: 0, last: 0 };
        r.wins += 1; r.pts += PTS[x.tier === 'major' ? 'major' : 'regular'];
        if (when >= r.last) { r.last = when; r.name = name; }
        rows.set(key, r);
      }
    }
    return [...rows.values()].sort((a, b) => b.pts - a.pts || b.wins - a.wins || b.last - a.last).slice(0, 3);
  }, [items, lang]);

  if (!top.length) return null;
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'Asia/Riyadh' });
  const order = top.length === 3 ? [1, 0, 2] : top.map((_, i) => i); // 1st in the middle
  return (
    <SectionShell id="leaderboard" title={t.lbTitle} sub={t.lbSub}>
      <div dir={dir} className="lb-pod">
        {order.map((i) => {
          const r = top[i];
          return (
            <article key={r.key} className={`lb-card lb-r${i + 1}`}>
              <span className="lb-medal">{i + 1}</span>
              <h3 dir="auto" className="lb-name">{r.name}</h3>
              <p className="lb-wins"><b>{r.wins}</b> {t.lbWins}</p>
              <span className="lb-pts">{r.pts} {t.lbPts}</span>
              <p className="lb-last">{t.lbLast}: {fmt.format(r.last)}</p>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
