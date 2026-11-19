import { can, getAdmin } from '../../_admin';
import { bracketStatus } from '../../_bracket';
import { dayOf } from '../hit';
import { denied, json, type Ctx } from '../../_lib';

/** Dashboard summary for any signed-in admin: site visits per day (last 30) and everybody who registered for any tournament, all together.
 *  Registrations are only included for admins who may view them. */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await getAdmin(request, env); if (!a) return denied();
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(dayOf(Date.now() - i * 86400_000));
  let views: Record<string, { views: number; visits: number }> = {};
  let migrate = false;
  try {
    const { results } = await env.DB.prepare('SELECT day, views, visits FROM page_views WHERE day >= ?').bind(days[0]).all<{ day: string; views: number; visits: number }>();
    views = Object.fromEntries((results ?? []).map((r) => [r.day, r]));
  } catch { migrate = true; }
  const visits = days.map((d) => ({ day: d, views: views[d]?.views ?? 0, visits: views[d]?.visits ?? 0 }));

  // Every tournament that is really being held: the ones the team created on the site, plus every organiser's bracket whose registration button is on
  // (even if never published on the site), plus brackets behind an approved community tournament. Plain test brackets (registration off) are not counted.
  const tours = { live: 0, upcoming: 0, completed: 0, fromBrackets: 0 };
  try {
    const now = Date.now();
    const { results: site } = await env.DB.prepare("SELECT starts_at, ends_at, winner_en, winner_ar FROM tournaments WHERE published = 1 AND bracket_id = ''").all<{ starts_at: string; ends_at: string; winner_en: string; winner_ar: string }>();
    for (const t of site ?? []) {
      if (now < Date.parse(t.starts_at)) tours.upcoming++;
      else if (t.winner_en || t.winner_ar || now > Date.parse(t.ends_at)) tours.completed++;
      else tours.live++;
    }
    const { results: bs } = await env.DB.prepare("SELECT data FROM user_brackets WHERE id IN (SELECT bracket_id FROM bracket_join WHERE enabled = 1) OR id IN (SELECT bracket_id FROM tournaments WHERE bracket_id != '' AND published = 1 AND review = 'approved') LIMIT 5000").all<{ data: string }>();
    for (const b of bs ?? []) {
      let st: 'new' | 'live' | 'done' = 'new';
      try { st = bracketStatus(JSON.parse(b.data)); } catch { /* unreadable: counts as not started */ }
      tours[st === 'done' ? 'completed' : st === 'live' ? 'live' : 'upcoming']++; tours.fromBrackets++;
    }
  } catch { /* tables missing: counts stay 0 */ }

  let regs: { total: number; perDay: { day: string; n: number }[] } | null = null;
  if (can(a, 'regs', 'view')) {
    const per: Record<string, number> = {}; let total = 0;
    for (const t of ['registrations', 'bracket_signups']) {
      try {
        total += (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t}`).first<{ n: number }>())?.n ?? 0;
        const { results } = await env.DB.prepare(`SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS n FROM ${t} WHERE substr(created_at, 1, 10) >= ? GROUP BY d`).bind(days[0]).all<{ d: string; n: number }>();
        for (const r of results ?? []) per[r.d] = (per[r.d] ?? 0) + r.n;
      } catch { /* table missing */ }
    }
    regs = { total, perDay: days.map((d) => ({ day: d, n: per[d] ?? 0 })) };
  }
  return json({ visits, regs, tours, migrate });
};
