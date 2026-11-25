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
  let shared: (R & { owner?: string })[] = [];
  try { shared = (await env.DB.prepare('SELECT b.id, b.title, b.data, b.updated_at, b.share, b.live, o.name AS owner FROM bracket_editors e JOIN user_brackets b ON b.id = e.bracket_id LEFT JOIN users o ON o.id = b.user_id WHERE e.user_id = ? ORDER BY b.updated_at DESC').bind(u.id).all<R & { owner?: string }>()).results; } catch { /* sharing not set up yet */ }
  return json([...results.map((r) => ({ ...r, owner: '', shared: false })), ...shared.map((r) => ({ ...r, shared: true }))].map((r) => {
    let format = 'single', players = 0, status = 'new', titleEn = '';
    try { const b = JSON.parse(r.data); format = b.format; players = b.players.length; status = bracketStatus(b); titleEn = typeof b.titleEn === 'string' ? b.titleEn : ''; } catch { /* keep defaults */ }
    return { id: r.id, title: r.title, titleEn, format, players, status, share: true, live: !!r.live, updatedAt: r.updated_at, shared: r.shared, owner: r.owner || '' };
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
  // Eight hex characters give the short public links (/<id> to register, /<id>v to view). The id must not be the start of an older longer id, and its first six characters
  // must not be an older six-character id (the old /v/<6> links look ids up by that prefix).
  const now = new Date().toISOString();
  for (let i = 0; i < 8; i++) {
    const id = hex(4);
    const prefixTaken = await env.DB.prepare('SELECT id FROM user_brackets WHERE id LIKE ? OR id = ? LIMIT 1').bind(id + '%', id.slice(0, 6)).first<{ id: string }>();
    if (prefixTaken) continue;
    try {
      await env.DB.prepare('INSERT INTO user_brackets (id, user_id, title, data, created_at, updated_at) VALUES (?,?,?,?,?,?)').bind(id, u.id, str(b.title, 60) || 'Bracket', JSON.stringify(data), now, now).run();
      return json({ ok: true, id });
    } catch { /* taken: try another */ }
  }
  return json({ error: 'busy' }, 500);
};
