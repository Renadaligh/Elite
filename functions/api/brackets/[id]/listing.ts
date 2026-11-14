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
  gameId: r.game_id, image: r.image || '', name: r.name_en, prize: r.prize_en, startsAt: r.starts_at, endsAt: r.ends_at, total: r.total, filled: r.filled,
  mode: r.mode === 'team' ? 'team' : 'solo', published: !!r.published,
  review: r.review === 'pending' || r.review === 'rejected' ? r.review : 'approved', reviewNote: r.review_note || '',
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
  const total = num(x.total, 0) === 0 ? 0 : Math.min(4096, Math.max(2, num(x.total, 16))); // 0 = unlimited seats
  const image = /^\/api\/img\/[0-9a-f-]{36}\.[a-z0-9]{3,4}$/.test(String(x.image ?? '')) ? String(x.image) : '';
  const mode = x.mode === 'team' ? 'team' : 'solo', game = str(x.gameId, 60).toLowerCase(), prize = str(x.prize, 80), pub = x.published === false ? 0 : 1;
  let fmt = 'single'; try { fmt = JSON.parse(b.data).format; } catch { /* default */ }
  const [fe, fa] = FORMAT[fmt] ?? FORMAT.single;
  const id = `u-${b.id}`;
  try {
    const old = await ctx.env.DB.prepare('SELECT filled, game_id, name_en, prize_en, starts_at, ends_at, review, image FROM tournaments WHERE id = ? AND owner_id = ?').bind(id, u.id).first<{ filled: number; game_id: string; name_en: string; prize_en: string; starts_at: string; ends_at: string; review: string; image: string }>();
    if (old) {
      // Changing what the public sees (name, game, prize, dates) sends it back to review; seats / hide switch do not. An edit of a rejected one is a resubmission.
      const changed = old.name_en !== name || old.game_id !== game || old.prize_en !== prize || old.starts_at !== startsAt || old.ends_at !== endsAt || old.image !== image;
      const review = old.review === 'rejected' || (changed && old.review === 'approved') ? 'pending' : old.review === 'pending' ? 'pending' : 'approved';
      await ctx.env.DB.prepare('UPDATE tournaments SET image=?,game_id=?,name_en=?,name_ar=?,format_en=?,format_ar=?,prize_en=?,prize_ar=?,starts_at=?,ends_at=?,total=?,filled=?,mode=?,published=?,review=?,review_note=? WHERE id=? AND owner_id=?')
        .bind(image, game, name, name, fe, fa, prize, prize, startsAt, endsAt, total, total > 0 ? Math.min(old.filled, total) : old.filled, mode, pub, review, '', id, u.id).run();
      return json({ ok: true, review });
    } else {
      const n = await ctx.env.DB.prepare("SELECT COUNT(*) AS n FROM tournaments WHERE owner_id = ? AND datetime(ends_at) > datetime('now')").bind(u.id).first<{ n: number }>(); // only tournaments that have not ended count
      if ((n?.n ?? 0) >= MAX_LISTED) return json({ error: 'limit' }, 400);
      if (await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ?').bind(id).first()) return json({ error: 'taken' }, 409);
      await ctx.env.DB.prepare('INSERT INTO tournaments (id,game_id,name_en,name_ar,format_en,format_ar,prize_en,prize_ar,starts_at,ends_at,filled,total,mode,published,owner_id,bracket_id,review,image) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?)')
        .bind(id, game, name, name, fe, fa, prize, prize, startsAt, endsAt, total, mode, pub, u.id, b.id, 'pending', image).run();
      return json({ ok: true, review: 'pending' });
    }
  } catch { return json({ error: 'migrate' }, 500); } // run the ALTER TABLE statements from schema.sql
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
