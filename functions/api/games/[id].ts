import { body, json, type Ctx } from '../../_lib';
import { guard } from '../../_admin';
import { parse } from './index';
import { logAdmin, logEdit, rowTitle, snap } from '../../_audit';


/** PUT = create or update the row for this id (overrides a built-in game, or edits a custom one). */
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'games', 'edit'); if (a instanceof Response) return a;
  if (params.id.startsWith('__')) return json({ error: 'invalid' }, 400);
  const v = parse(await body(request));
  const before = await snap(env, 'games', params.id);
  const base = [params.id, v.genre, v.name.en, v.name.ar, v.tagline.en, v.tagline.ar, v.image, v.hidden, v.custom];
  const head = 'INSERT INTO games (id,genre,name_en,name_ar,tagline_en,tagline_ar,image,hidden,custom';
  const set = 'genre=excluded.genre,name_en=excluded.name_en,name_ar=excluded.name_ar,tagline_en=excluded.tagline_en,tagline_ar=excluded.tagline_ar,image=excluded.image,hidden=excluded.hidden';
  const tries: [string, unknown[]][] = [
    [`${head},tournament_only,details) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET ${set},tournament_only=excluded.tournament_only,details=excluded.details`, [...base, v.tournamentOnly, v.details]],
    [`${head},tournament_only) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET ${set},tournament_only=excluded.tournament_only`, [...base, v.tournamentOnly]],
    [`${head}) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET ${set}`, base],
  ];
  // Older databases lack the newer columns: fall back instead of failing.
  for (let i = 0; i < tries.length; i++) {
    try { await env.DB.prepare(tries[i][0]).bind(...tries[i][1]).run(); break; } catch (e) { if (i === tries.length - 1) throw e; }
  }
  await logEdit(env, a.username, before ? 'games.edit' : 'games.add', 'games', params.id, before);
  return json({ ok: true });
};

/** DELETE removes a custom game, or resets a built-in game back to its defaults. */
export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'games', 'delete'); if (a instanceof Response) return a;
  const old = await snap(env, 'games', params.id);
  await env.DB.prepare('DELETE FROM games WHERE id=?').bind(params.id).run();
  await logAdmin(env, a.username, 'games.delete', rowTitle(old, params.id));
  return json({ ok: true });
};
