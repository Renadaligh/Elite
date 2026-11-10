import { announceTournament } from '../../_discord';
import { body, denied, isAdmin, json, newId, num, safeUrl, str, type Ctx } from '../../_lib';

type Row = { id: string; game_id: string; name_en: string; name_ar: string; format_en: string; format_ar: string; prize_en: string; prize_ar: string; starts_at: string; ends_at: string; filled: number; total: number; mode: string; tier?: string; register_url: string; image: string; winner_en: string; winner_ar: string; winner_members?: string; image_pos?: string; bracket?: string; stream_url?: string; stream_live?: number; published: number };
/** The bracket is stored as JSON text; bad/empty text just means "no bracket". */
const bracketOf = (s?: string) => { try { return s ? JSON.parse(s) : undefined; } catch { return undefined; } };
const out = (r: Row, admin = false) => ({
  id: r.id, gameId: r.game_id, name: { en: r.name_en, ar: r.name_ar }, format: { en: r.format_en, ar: r.format_ar }, prize: { en: r.prize_en, ar: r.prize_ar },
  startsAt: r.starts_at, endsAt: r.ends_at, slots: { filled: r.filled, total: r.total }, mode: r.mode === 'team' ? 'team' : 'solo', tier: r.tier === 'major' ? 'major' : 'regular',
  registerUrl: r.register_url || undefined, image: r.image || undefined, imagePos: r.image_pos || undefined,
  winner: r.winner_en || r.winner_ar ? { en: r.winner_en || r.winner_ar, ar: r.winner_ar || r.winner_en } : undefined, winnerMembers: r.winner_members ? r.winner_members.split('\n') : undefined, published: !!r.published,
  // Finished tournaments keep their bracket in the database for the dashboard only; visitors never get it.
  bracket: admin || Date.now() <= Date.parse(r.ends_at) ? bracketOf(r.bracket) : undefined,
  // The stream link is only public while the dashboard toggle is on.
  streamLive: !!r.stream_live && !!r.stream_url, streamUrl: admin || (r.stream_live && r.stream_url) ? r.stream_url || undefined : undefined,
});

const pair = (v: unknown, max = 200) => { const o = (v ?? {}) as Record<string, unknown>; const en = str(o.en, max), ar = str(o.ar, max); return { en: en || ar, ar: ar || en }; };
/** Picked image position, e.g. "35% 60%" (what part of the picture the card shows). */
const posOf = (v: unknown) => { const m = /^(\d{1,3})% (\d{1,3})%$/.exec(String(v ?? '')); return m && +m[1] <= 100 && +m[2] <= 100 ? `${m[1]}% ${m[2]}%` : ''; };
const isoOk = (s: string) => !Number.isNaN(Date.parse(s));

export function parse(b: Record<string, unknown>) {
  const name = pair(b.name), format = pair(b.format), prize = pair(b.prize), winner = pair(b.winner);
  const startsAt = str(b.startsAt, 40), endsAt = str(b.endsAt, 40) || startsAt;
  if ((!name.en && !name.ar) || !isoOk(startsAt) || !isoOk(endsAt)) return null;
  const s = (b.slots ?? {}) as Record<string, unknown>;
  const total = Math.max(1, num(s.total, 1));
  const raw = Array.isArray(b.winnerMembers) ? b.winnerMembers.join('\n') : typeof b.winnerMembers === 'string' ? b.winnerMembers : '';
  const members = raw.split(/\r?\n/).map((m) => m.trim().slice(0, 40)).filter(Boolean).slice(0, 12).join('\n');
  return {
    game_id: str(b.gameId, 60).toLowerCase(), name, format, prize, winner, startsAt, endsAt,
    filled: Math.min(num(s.filled, 0), total), total, mode: b.mode === 'team' ? 'team' : 'solo', tier: b.tier === 'major' ? 'major' : 'regular',
    register_url: safeUrl(b.registerUrl), image: safeUrl(b.image), image_pos: posOf(b.imagePos), members, published: b.published === false ? 0 : 1,
  };
}

/** Registration is "open" for a published tournament that has not ended yet and has no winner. */
export const opens = (v: { published: number; endsAt: string; winner: { en: string; ar: string } }) => !!v.published && Date.now() <= Date.parse(v.endsAt) && !v.winner.en && !v.winner.ar;

export const onRequestGet = async ({ request, env }: Ctx) => {
  const all = isAdmin(request, env);
  const { results } = await env.DB.prepare(`SELECT * FROM tournaments ${all ? '' : 'WHERE published = 1'} ORDER BY starts_at DESC`).all<Row>();
  return json(results.map((r) => out(r, all)));
};

export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  const v = parse(await body(request));
  if (!v) return json({ error: 'invalid' }, 400);
  const id = newId();
  // A team winner must come with the members' names.
  if ((v.winner.en || v.winner.ar) && v.mode === 'team' && !v.members) return json({ error: 'members_required' }, 400);
  const base = [id, v.game_id, v.name.en, v.name.ar, v.format.en, v.format.ar, v.prize.en, v.prize.ar, v.startsAt, v.endsAt, v.filled, v.total, v.mode, v.register_url, v.image, v.winner.en, v.winner.ar, v.published];
  const head = 'INSERT INTO tournaments (id,game_id,name_en,name_ar,format_en,format_ar,prize_en,prize_ar,starts_at,ends_at,filled,total,mode,register_url,image,winner_en,winner_ar,published';
  const q = (n: number) => `VALUES (${Array(n).fill('?').join(',')})`;
  const tries: [string, unknown[]][] = [
    [`${head},tier,winner_members,image_pos) ${q(21)}`, [...base, v.tier, v.members, v.image_pos]],
    [`${head},tier,winner_members) ${q(20)}`, [...base, v.tier, v.members]],
    [`${head}) ${q(18)}`, base],
  ];
  // Older databases lack newer columns: fall back to fewer columns instead of failing.
  for (let i = 0; i < tries.length; i++) {
    try { await env.DB.prepare(tries[i][0]).bind(...tries[i][1]).run(); break; } catch (e) { if (i === tries.length - 1) return json({ error: 'db', detail: String((e as Error).message).slice(0, 160) }, 500); }
  }
  if (v.published && opens(v)) await announceTournament(env, request, id, v);
  return json({ ok: true, id });
};
