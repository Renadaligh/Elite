import { currentUser, sameOrigin } from '../../../_auth';
import { body, denied, json, num, str, type Ctx } from '../../../_lib';

/** A community tournament = a row in `tournaments` with id "u-<bracket id>", owned by the bracket's owner. The owner lists / edits / removes it here. */
const FORMAT: Record<string, [string, string]> = {
  single: ['Single elimination', 'خروج المغلوب'], double: ['Double elimination', 'خروج مزدوج'], rr: ['Round robin', 'دوري'],
  swiss: ['Swiss', 'سويسري'], ffa: ['Leaderboard', 'لوحة صدارة'], groups: ['Groups + knockout', 'مجموعات ثم إقصائيات'],
};
const MAX_LISTED = 10;
type Row = Record<string, unknown>;
const isoOk = (s: string) => !Number.isNaN(Date.parse(s));

async function mineBracket(ctx: Ctx, uid: string) {
  try { return await ctx.env.DB.prepare('SELECT id, title, data, share FROM user_brackets WHERE id = ? AND user_id = ?').bind(ctx.params.id, uid).first<{ id: string; title: string; data: string; share: number }>(); }
  catch { return null; }
}
const shape = (r: Row) => ({
  gameId: r.game_id, name: r.name_en, prize: r.prize_en, startsAt: r.starts_at, endsAt: r.ends_at, total: r.total, filled: r.filled,
  mode: r.mode === 'team' ? 'team' : 'solo', published: !!r.published,
});

export const onRequestGet = async (ctx: Ctx) => {
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const b = await mineBracket(ctx, u.id);
  if (!b) return json({ error: 'not_found' }, 404);
  try {
    const r = await ctx.env.DB.prepare('SELECT * FROM tournaments WHERE id = ? AND owner_id = ?').bind(`u-${b.id}`, u.id).first<Row>();
    return json({ listing: r ? shape(r) : null });
  } catch { return json({ listing: null, migrate: true }); }
};

export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const b = await mineBracket(ctx, u.id);
  if (!b) return json({ error: 'not_found' }, 404);
  if (!b.share) return json({ error: 'share_required' }, 400);
  const x = await body(ctx.request);
  const name = str(x.name, 80), startsAt = str(x.startsAt, 40), endsAt = str(x.endsAt, 40) || startsAt;
  if (!name || !isoOk(startsAt) || !isoOk(endsAt) || Date.parse(endsAt) < Date.parse(startsAt)) return json({ error: 'invalid' }, 400);
  const total = Math.min(512, Math.max(2, num(x.total, 16)));
  const mode = x.mode === 'team' ? 'team' : 'solo', game = str(x.gameId, 60).toLowerCase(), prize = str(x.prize, 80), pub = x.published === false ? 0 : 1;
  let fmt = 'single'; try { fmt = JSON.parse(b.data).format; } catch { /* default */ }
  const [fe, fa] = FORMAT[fmt] ?? FORMAT.single;
  const id = `u-${b.id}`;
  try {
    const old = await ctx.env.DB.prepare('SELECT filled FROM tournaments WHERE id = ? AND owner_id = ?').bind(id, u.id).first<{ filled: number }>();
    if (old) {
      await ctx.env.DB.prepare('UPDATE tournaments SET game_id=?,name_en=?,name_ar=?,format_en=?,format_ar=?,prize_en=?,prize_ar=?,starts_at=?,ends_at=?,total=?,filled=?,mode=?,published=? WHERE id=? AND owner_id=?')
        .bind(game, name, name, fe, fa, prize, prize, startsAt, endsAt, total, Math.min(old.filled, total), mode, pub, id, u.id).run();
    } else {
      const n = await ctx.env.DB.prepare("SELECT COUNT(*) AS n FROM tournaments WHERE owner_id = ? AND datetime(ends_at) > datetime('now')").bind(u.id).first<{ n: number }>(); // only tournaments that have not ended count
      if ((n?.n ?? 0) >= MAX_LISTED) return json({ error: 'limit' }, 400);
      if (await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ?').bind(id).first()) return json({ error: 'taken' }, 409);
      await ctx.env.DB.prepare('INSERT INTO tournaments (id,game_id,name_en,name_ar,format_en,format_ar,prize_en,prize_ar,starts_at,ends_at,filled,total,mode,published,owner_id,bracket_id) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?)')
        .bind(id, game, name, name, fe, fa, prize, prize, startsAt, endsAt, total, mode, pub, u.id, b.id).run();
    }
  } catch { return json({ error: 'migrate' }, 500); } // run the ALTER TABLE statements from schema.sql
  return json({ ok: true });
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const id = `u-${ctx.params.id}`;
  try {
    const mine = await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ? AND owner_id = ?').bind(id, u.id).first();
    if (!mine) return json({ error: 'not_found' }, 404);
    await ctx.env.DB.prepare('DELETE FROM tournaments WHERE id = ? AND owner_id = ?').bind(id, u.id).run();
    await ctx.env.DB.prepare('DELETE FROM registrations WHERE tournament_id = ?').bind(id).run();
  } catch { return json({ error: 'migrate' }, 500); }
  return json({ ok: true });
};
