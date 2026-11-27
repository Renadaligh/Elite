import { body, json, type Ctx } from '../../_lib';
import { guard } from '../../_admin';
import { guardTournament } from '../../_share';
import { announceTournament } from '../../_discord';
import { opens, parse } from './index';
import { logAdmin, logEdit, rowTitle, snap } from '../../_audit';


export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const sc = await guardTournament(request, env, params.id, 'info'); if (sc instanceof Response) return sc;
  const a = sc.admin;
  const v = parse(await body(request));
  if (!v) return json({ error: 'invalid' }, 400);
  const before = await snap(env, 'tournaments', params.id);
  const was = await env.DB.prepare('SELECT published, tier, winner_en, winner_ar, winner_members, ends_at FROM tournaments WHERE id=?').bind(params.id).first<{ published: number; tier?: string; winner_en: string; winner_ar: string; winner_members?: string; ends_at: string }>().catch(() => null)
    ?? await env.DB.prepare('SELECT published, winner_en, winner_ar, ends_at FROM tournaments WHERE id=?').bind(params.id).first<{ published: number; tier?: string; winner_en: string; winner_ar: string; winner_members?: string; ends_at: string }>();
  if (!sc.full) {
    // An admin who was added to this tournament: it stays as the owner set it for what he may not touch. Publishing and the tier are never his; the winner comes with the tree.
    if (!was) return json({ error: 'not_found' }, 404);
    v.published = was.published ? 1 : 0;
    if (was.tier) v.tier = was.tier === 'major' ? 'major' : 'regular';
    if (!sc.perms.includes('tree')) {
      v.winner = { en: was.winner_en ?? '', ar: was.winner_ar ?? '' };
      v.members = was.winner_members ?? '';
      v.endsAt = was.ends_at ?? '';
    }
  }
  if ((v.winner.en || v.winner.ar) && v.mode === 'team' && !v.members) return json({ error: 'members_required' }, 400);
  if ((v.winner.en || v.winner.ar) && !(was?.winner_en || was?.winner_ar)) v.endsAt = new Date().toISOString(); // the winner is entered now = the tournament ends now
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
  // the picture of the info card is also the registration page's picture: keep the two the same (the page reads the card's own picture first)
  await env.DB.prepare('UPDATE bracket_join SET cover = ? WHERE bracket_id = ?').bind(/^\/api\/img\/[0-9a-f-]{36}\.[a-z0-9]{3,4}$/.test(v.image) ? v.image : '', params.id).run().catch(() => undefined);
  await logEdit(env, a.username, 'tournaments.edit', 'tournaments', params.id, before);
  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'tournaments', 'delete'); if (a instanceof Response) return a;
  const old = await snap(env, 'tournaments', params.id);
  await env.DB.prepare('DELETE FROM tournaments WHERE id=?').bind(params.id).run();
  await logAdmin(env, a.username, 'tournaments.delete', rowTitle(old, params.id));
  return json({ ok: true });
};
