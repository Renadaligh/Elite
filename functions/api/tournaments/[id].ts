import { body, denied, isAdmin, json, type Ctx } from '../../_lib';
import { parse } from './index';

export const onRequestPut = async ({ request, env, params }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  const v = parse(await body(request));
  if (!v) return json({ error: 'invalid' }, 400);
  if ((v.winner.en || v.winner.ar) && v.mode === 'team' && !v.members) return json({ error: 'members_required' }, 400);
  const base = [v.game_id, v.name.en, v.name.ar, v.format.en, v.format.ar, v.prize.en, v.prize.ar, v.startsAt, v.endsAt, v.filled, v.total, v.mode, v.register_url, v.image, v.winner.en, v.winner.ar, v.published];
  try {
    await env.DB.prepare('UPDATE tournaments SET game_id=?,name_en=?,name_ar=?,format_en=?,format_ar=?,prize_en=?,prize_ar=?,starts_at=?,ends_at=?,filled=?,total=?,mode=?,register_url=?,image=?,winner_en=?,winner_ar=?,published=?,tier=?,winner_members=? WHERE id=?').bind(...base, v.tier, v.members, params.id).run();
  } catch {
    // Database not migrated yet (no "tier" / "winner_members" column): save without them.
    try {
      await env.DB.prepare('UPDATE tournaments SET game_id=?,name_en=?,name_ar=?,format_en=?,format_ar=?,prize_en=?,prize_ar=?,starts_at=?,ends_at=?,filled=?,total=?,mode=?,register_url=?,image=?,winner_en=?,winner_ar=?,published=? WHERE id=?').bind(...base, params.id).run();
    } catch (e) { return json({ error: 'db', detail: String((e as Error).message).slice(0, 160) }, 500); }
  }
  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  await env.DB.prepare('DELETE FROM tournaments WHERE id=?').bind(params.id).run();
  return json({ ok: true });
};
