import { body, json, str, type Ctx } from '../_lib';

/**
 * Plato Bounce, the hero arcade game: a weekly leaderboard.
 *  GET  /api/arcade  -> { week, endsAt, rows: [{ n, s }] }   top 10 of the current week
 *  POST /api/arcade  { name, score, ms } -> { ok, best, rank, week, endsAt, rows }
 * Weeks start on Saturday 00:00 Riyadh time (UTC+3). Each name keeps its best score of the week.
 * Scores come from the browser, so the checks below only make cheating tedious, not impossible.
 */
const DAY = 86_400_000, RIYADH = 3 * 3_600_000, TOP = 10;
const weekIndex = (t: number) => Math.floor(((t + RIYADH) / DAY - 2) / 7); // Saturday = day 2 after the epoch's Thursday
const weekEnd = (w: number) => ((w + 1) * 7 + 2) * DAY - RIYADH;
const NAME_OK = /^[\p{L}\p{N} _.\-]{1,12}$/u;

interface Row { name: string; score: number }

async function top(env: Ctx['env'], week: number) {
  const { results } = await env.DB.prepare('SELECT name, score FROM arcade_scores WHERE week=? ORDER BY score DESC, updated_at ASC LIMIT ?').bind(week, TOP).all<Row>();
  return results.map((r) => ({ n: r.name, s: r.score }));
}

async function ipHash(req: Request) {
  const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`plato-arcade:${ip}`));
  return Array.from(new Uint8Array(d).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestGet = async ({ env }: Ctx) => {
  const week = weekIndex(Date.now());
  return json({ week, endsAt: weekEnd(week), rows: await top(env, week) });
};

export const onRequestPost = async ({ request, env }: Ctx) => {
  const b = await body(request);
  const name = str(b.name, 40).replace(/\s+/g, ' ');
  const score = Math.floor(Number(b.score)), ms = Math.floor(Number(b.ms));
  if (!NAME_OK.test(name)) return json({ ok: false, error: 'name' }, 400);
  // A tap needs the ball to come back down a little, so scores faster than ~7 taps a second are not real.
  if (!Number.isFinite(score) || score < 1 || score > 400 || !Number.isFinite(ms) || ms < 0 || ms > 20 * 60_000 || score * 140 > ms + 600) return json({ ok: false, error: 'score' }, 400);

  const now = Date.now(), week = weekIndex(now), ip = await ipHash(request);
  await env.DB.prepare('DELETE FROM arcade_hits WHERE at < ?').bind(now - 3_600_000).run();
  const hits = await env.DB.prepare('SELECT COUNT(*) AS n FROM arcade_hits WHERE ip_hash=? AND at > ?').bind(ip, now - 600_000).first<{ n: number }>();
  if ((hits?.n ?? 0) >= 20) return json({ ok: false, error: 'slow' }, 429);
  await env.DB.prepare('INSERT INTO arcade_hits (ip_hash, at) VALUES (?, ?)').bind(ip, now).run();

  const key = name.toLowerCase();
  await env.DB.prepare(
    `INSERT INTO arcade_scores (week, name_key, name, score, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(week, name_key) DO UPDATE SET
       name = CASE WHEN excluded.score > score THEN excluded.name ELSE name END,
       updated_at = CASE WHEN excluded.score > score THEN excluded.updated_at ELSE updated_at END,
       score = MAX(score, excluded.score)`,
  ).bind(week, key, name, score, now).run();
  await env.DB.prepare('DELETE FROM arcade_scores WHERE week < ?').bind(week - 8).run(); // keep two months of history

  const mine = await env.DB.prepare('SELECT score FROM arcade_scores WHERE week=? AND name_key=?').bind(week, key).first<{ score: number }>();
  const best = mine?.score ?? score;
  const above = await env.DB.prepare('SELECT COUNT(*) AS n FROM arcade_scores WHERE week=? AND score > ?').bind(week, best).first<{ n: number }>();
  return json({ ok: true, best, rank: (above?.n ?? 0) + 1, week, endsAt: weekEnd(week), rows: await top(env, week) });
};
