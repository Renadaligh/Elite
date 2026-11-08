import { body, denied, isAdmin, json, newId, num, safeUrl, str, type Ctx } from '../../_lib';

type Row = { id: string; game_id: string; name_en: string; name_ar: string; format_en: string; format_ar: string; prize_en: string; prize_ar: string; starts_at: string; ends_at: string; filled: number; total: number; mode: string; tier?: string; register_url: string; image: string; winner_en: string; winner_ar: string; winner_members?: string; published: number };
const out = (r: Row) => ({
  id: r.id, gameId: r.game_id, name: { en: r.name_en, ar: r.name_ar }, format: { en: r.format_en, ar: r.format_ar }, prize: { en: r.prize_en, ar: r.prize_ar },
  startsAt: r.starts_at, endsAt: r.ends_at, slots: { filled: r.filled, total: r.total }, mode: r.mode === 'team' ? 'team' : 'solo', tier: r.tier === 'major' ? 'major' : 'regular',
  registerUrl: r.register_url || undefined, image: r.image || undefined,
  winner: r.winner_en || r.winner_ar ? { en: r.winner_en || r.winner_ar, ar: r.winner_ar || r.winner_en } : undefined, winnerMembers: r.winner_members ? r.winner_members.split('
') : undefined, published: !!r.published,
});

const pair = (v: unknown, max = 200) => { const o = (v ?? {}) as Record<string, unknown>; const en = str(o.en, max), ar = str(o.ar, max); return { en: en || ar, ar: ar || en }; };
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
    register_url: safeUrl(b.registerUrl), image: safeUrl(b.image), members, published: b.published === false ? 0 : 1,
  };
}

export const onRequestGet = async ({ request, env }: Ctx) => {
  const all = isAdmin(request, env);
  const { results } = await env.DB.prepare(`SELECT * FROM tournaments ${all ? '' : 'WHERE published = 1'} ORDER BY starts_at DESC`).all<Row>();
  return json(results.map(out));
};

export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  const v = parse(await body(request));
  if (!v) return json({ error: 'invalid' }, 400);
  const id = newId();
  // A team winner must come with the members' names.
  if ((v.winner.en || v.winner.ar) && v.mode === 'team' && !v.members) return json({ error: 'members_required' }, 400);
  const base = [id, v.game_id, v.name.en, v.name.ar, v.format.en, v.format.ar, v.prize.en, v.prize.ar, v.startsAt, v.endsAt, v.filled, v.total, v.mode, v.register_url, v.image, v.winner.en, v.winner.ar, v.published];
  try {
    await env.DB.prepare('INSERT INTO tournaments (id,game_id,name_en,name_ar,format_en,format_ar,prize_en,prize_ar,starts_at,ends_at,filled,total,mode,register_url,image,winner_en,winner_ar,published,tier,winner_members) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...base, v.tier, v.members).run();
  } catch {
    // Database not migrated yet (no "tier" / "winner_members" column): save without them.
    try {
      await env.DB.prepare('INSERT INTO tournaments (id,game_id,name_en,name_ar,format_en,format_ar,prize_en,prize_ar,starts_at,ends_at,filled,total,mode,register_url,image,winner_en,winner_ar,published) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...base).run();
    } catch (e) { return json({ error: 'db', detail: String((e as Error).message).slice(0, 160) }, 500); }
  }
  return json({ ok: true, id });
};
