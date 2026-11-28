import { bracketAccess } from '../../../_access';
import { currentUser, sameOrigin } from '../../../_auth';
import { body, denied, json, num, str, type Ctx } from '../../../_lib';
import { joinExtra } from '../../../_join';

/** A community tournament = a row in `tournaments` with id "u-<bracket id>", owned by the bracket's owner. The owner lists / edits / removes it here. */
const FORMAT: Record<string, [string, string]> = {
  single: ['Single elimination', 'خروج المغلوب'], double: ['Double elimination', 'خروج مزدوج'], rr: ['Round robin', 'دوري'],
  swiss: ['Swiss', 'سويسري'], ffa: ['Leaderboard', 'لوحة صدارة'], groups: ['Groups + knockout', 'مجموعات ثم إقصائيات'],
};
const MAX_LISTED = 10;
type Row = Record<string, unknown>;
const isoOk = (s: string) => !Number.isNaN(Date.parse(s));

/** The bracket, for its owner only (sending it to the site and taking it off stays with the owner). `ownerId` is who owns the listing. */
async function mineBracket(ctx: Ctx, uid: string) {
  const acc = await bracketAccess(ctx.env, ctx.params.id, uid);
  if (!acc || !acc.isOwner) return null;
  try {
    const r = await ctx.env.DB.prepare('SELECT id, title, data, share FROM user_brackets WHERE id = ?').bind(ctx.params.id).first<{ id: string; title: string; data: string; share: number }>();
    return r ? { ...r, ownerId: acc.ownerId, isOwner: acc.isOwner } : null;
  } catch { return null; }
}
const shape = (r: Row) => ({
  gameId: r.game_id, image: r.image || '', name: r.name_ar || r.name_en, prize: r.prize_en, startsAt: r.starts_at, total: r.total, filled: r.filled,
  mode: r.mode === 'team' ? 'team' : 'solo', published: !!r.published,
  review: r.review === 'pending' || r.review === 'rejected' ? r.review : 'approved', reviewNote: r.review_note || '',
});

export const onRequestGet = async (ctx: Ctx) => {
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const b = await mineBracket(ctx, u.id);
  if (!b) return json({ error: 'not_found' }, 404);
  try {
    const r = await ctx.env.DB.prepare('SELECT * FROM tournaments WHERE id = ? AND owner_id = ?').bind(`u-${b.id}`, b.ownerId).first<Row>();
    return json({ listing: r ? shape(r) : null });
  } catch { return json({ listing: null, migrate: true }); }
};

export const onRequestPut = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const b = await mineBracket(ctx, u.id);
  if (!b) return json({ error: 'not_found' }, 404);
  const x = await body(ctx.request);
  const name = str(x.name, 80), startsAt = str(x.startsAt, 40);
  if (!name || !isoOk(startsAt)) return json({ error: 'invalid' }, 400);
  const total = num(x.total, 0) === 0 ? 0 : Math.min(4096, Math.max(2, num(x.total, 16))); // 0 = unlimited seats
  const image = (await joinExtra(ctx.env, ctx.params.id)).cover; // one picture per bracket: the one uploaded for the registration page
  const mode = x.mode === 'team' ? 'team' : 'solo', game = str(x.gameId, 60).toLowerCase(), prize = str(x.prize, 80), pub = x.published === false ? 0 : 1;
  let fmt = 'single'; try { fmt = JSON.parse(b.data).format; } catch { /* default */ }
  const [fe, fa] = FORMAT[fmt] ?? FORMAT.single;
  const id = `u-${b.id}`;
  try {
    const old = await ctx.env.DB.prepare('SELECT filled, game_id, name_en, name_ar, prize_en, starts_at, review, image, published FROM tournaments WHERE id = ? AND owner_id = ?').bind(id, b.ownerId).first<{ filled: number; game_id: string; name_en: string; name_ar: string; prize_en: string; starts_at: string; review: string; image: string; published: number }>();
    // asking for publication needs a picture (new request, or re-sending after a rejection / after it was turned off); one already live keeps working
    if (pub && !image && (!old || !old.published || old.review === 'rejected')) return json({ error: 'image' }, 400);
    if (old) {
      // Only a new name or picture sends an approved one back to review. An edit of a rejected one is a resubmission.
      const changed = (old.name_ar || old.name_en) !== name || old.image !== image; // only a new name or picture goes back to review; game, prize, date, seats, etc. change freely
      const review = old.review === 'rejected' || (changed && old.review === 'approved') ? 'pending' : old.review === 'pending' ? 'pending' : 'approved';
      await ctx.env.DB.prepare('UPDATE tournaments SET image=?,game_id=?,name_en=?,name_ar=?,format_en=?,format_ar=?,prize_en=?,prize_ar=?,starts_at=?,total=?,filled=?,mode=?,published=?,review=?,review_note=? WHERE id=? AND owner_id=?')
        .bind(image, game, changed ? name : old.name_en, changed ? name : old.name_ar, fe, fa, prize, prize, startsAt, total, total > 0 ? Math.min(old.filled, total) : old.filled, mode, pub, review, '', id, b.ownerId).run();
      return json({ ok: true, review });
    } else {
      const n = await ctx.env.DB.prepare("SELECT COUNT(*) AS n FROM tournaments WHERE owner_id = ? AND winner_en = '' AND winner_ar = ''").bind(b.ownerId).first<{ n: number }>(); // only tournaments that have not ended (no winner yet) count
      if ((n?.n ?? 0) >= MAX_LISTED) return json({ error: 'limit' }, 400);
      if (await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ?').bind(id).first()) return json({ error: 'taken' }, 409);
      await ctx.env.DB.prepare('INSERT INTO tournaments (id,game_id,name_en,name_ar,format_en,format_ar,prize_en,prize_ar,starts_at,ends_at,filled,total,mode,published,owner_id,bracket_id,review,image) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?)')
        .bind(id, game, name, name, fe, fa, prize, prize, startsAt, '', total, mode, pub, b.ownerId, b.id, 'pending', image).run();
      return json({ ok: true, review: 'pending' });
    }
  } catch { return json({ error: 'migrate' }, 500); } // run the ALTER TABLE statements from schema.sql
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!sameOrigin(ctx.request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(ctx.request, ctx.env);
  if (!u) return denied();
  const acc = await bracketAccess(ctx.env, ctx.params.id, u.id);
  if (!acc || !acc.isOwner) return json({ error: 'not_found' }, 404);
  const id = `u-${ctx.params.id}`;
  try {
    const mine = await ctx.env.DB.prepare('SELECT 1 AS x FROM tournaments WHERE id = ? AND owner_id = ?').bind(id, acc.ownerId).first();
    if (!mine) return json({ error: 'not_found' }, 404);
    await ctx.env.DB.prepare('DELETE FROM tournaments WHERE id = ? AND owner_id = ?').bind(id, acc.ownerId).run();
    await ctx.env.DB.prepare('DELETE FROM registrations WHERE tournament_id = ?').bind(id).run();
  } catch { return json({ error: 'migrate' }, 500); }
  return json({ ok: true });
};
