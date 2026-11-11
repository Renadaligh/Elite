import { body, json, type Ctx } from '../../_lib';
import { guard } from '../../_admin';
import { announceTournament } from '../../_discord';
import { opens, parse } from './index';

export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'tournaments', 'edit'); if (a instanceof Response) return a;
  const v = parse(await body(request));
  if (!v) return json({ error: 'invalid' }, 400);
  if ((v.winner.en || v.winner.ar) && v.mode === 'team' && !v.members) return json({ error: 'members_required' }, 400);
  const was = await env.DB.prepare('SELECT published FROM tournaments WHERE id=?').bind(params.id).first<{ published: number }>();
  const base = [v.game_id, v.name.en, v.name.ar, v.format.en, v.format.ar, v.prize.en, v.prize.ar, v.startsAt, v.endsAt, v.filled, v.total, v.mode, v.register_url, v.image, v.winner.en, v.winner.ar, v.published];
  const head = 'UPDATE tournaments SET game_id=?,name_en=?,name_ar=?,format_en=?,format_ar=?,prize_en=?,prize_ar=?,starts_at=?,ends_at=?,filled=?,total=?,mode=?,register_url=?,image=?,winner_en=?,winner_ar=?,published=?';
  const tries: [string, unknown[]][] = [
    [`${head},tier=?,winner_members=?,image_pos=? WHERE id=?`, [...base, v.tier, v.members, v.image_pos, params.id]],
    [`${head},tier=?,winner_members=? WHERE id=?`, [...base, v.tier, v.members, params.id]],
    [`${head} WHERE id=?`, [...base, params.id]],
  ];
  // Older databases lack newer columns: fall back to fewer columns instead of failing.
  for (let i = 0; i < tries.length; i++) {
    try { await env.DB.prepare(tries[i][0]).bind(...tries[i][1]).run(); break; } catch (e) { if (i === tries.length - 1) return json({ error: 'db', detail: String((e as Error).message).slice(0, 160) }, 500); }
  }
  if (opens(v) && was && !was.published) await announceTournament(env, request, params.id, v); // only when a hidden tournament is published
  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'tournaments', 'delete'); if (a instanceof Response) return a;
  await env.DB.prepare('DELETE FROM tournaments WHERE id=?').bind(params.id).run();
  return json({ ok: true });
};
