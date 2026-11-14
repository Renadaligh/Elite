import { currentUser, hex, sameOrigin } from '../../_auth';
import { bracketStatus, cleanBracket, MAX_PER_USER } from '../../_bracket';
import { body, denied, json, str, type Ctx } from '../../_lib';

/** My brackets (signed-in visitors only). */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const u = await currentUser(request, env);
  if (!u) return denied();
  type R = { id: string; title: string; data: string; updated_at: string; share?: number; live?: number };
  let results: R[];
  try { results = (await env.DB.prepare('SELECT id, title, data, updated_at, share, live FROM user_brackets WHERE user_id = ? ORDER BY updated_at DESC').bind(u.id).all<R>()).results; }
  catch { results = (await env.DB.prepare('SELECT id, title, data, updated_at FROM user_brackets WHERE user_id = ? ORDER BY updated_at DESC').bind(u.id).all<R>()).results; } // share/live columns not added yet
  return json(results.map((r) => {
    let format = 'single', players = 0, status = 'new';
    try { const b = JSON.parse(r.data); format = b.format; players = b.players.length; status = bracketStatus(b); } catch { /* keep defaults */ }
    return { id: r.id, title: r.title, format, players, status, share: true, live: !!r.live, updatedAt: r.updated_at };
  }));
};

export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const b = await body(request);
  const data = cleanBracket(b.bracket);
  if (!data) return json({ error: 'invalid' }, 400);
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM user_brackets WHERE user_id = ?').bind(u.id).first<{ n: number }>();
  if ((n?.n ?? 0) >= MAX_PER_USER) return json({ error: 'limit' }, 400);
  const id = hex(8), now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO user_brackets (id, user_id, title, data, created_at, updated_at) VALUES (?,?,?,?,?,?)').bind(id, u.id, str(b.title, 60) || 'Bracket', JSON.stringify(data), now, now).run();
  return json({ ok: true, id });
};
