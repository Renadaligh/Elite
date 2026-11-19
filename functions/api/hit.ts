import { sameOrigin } from '../_auth';
import { json, type Ctx } from '../_lib';

/** Site visit counter. The page calls it once per page it shows: n=1 marks the first page of a browser session (a "visit").
 *  Only per-day totals are stored (table `page_views`): no IP, no cookie, no per-person data. Bots and other sites are ignored. */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|monitor/i;
export const dayOf = (ms = Date.now()) => new Date(ms + 3 * 3600_000).toISOString().slice(0, 10); // Riyadh day

export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request) || BOT.test(request.headers.get('user-agent') ?? '')) return json({ ok: true });
  let visit = 0;
  try { visit = (await request.json() as { n?: unknown }).n === 1 ? 1 : 0; } catch { /* no body: just a view */ }
  try {
    await env.DB.prepare('INSERT INTO page_views (day, views, visits) VALUES (?, 1, ?) ON CONFLICT(day) DO UPDATE SET views = views + 1, visits = visits + excluded.visits')
      .bind(dayOf(), visit).run();
  } catch { /* table not created yet: nothing to do */ }
  return json({ ok: true });
};
