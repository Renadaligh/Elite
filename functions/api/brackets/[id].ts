import { allows, bracketAccess, siteAccess } from '../../_access';
import { currentUser, sameOrigin } from '../../_auth';
import { cleanBracket } from '../../_bracket';
import { body, denied, json, safeUrl, str, type Ctx } from '../../_lib';

type Row = { id: string; user_id: string; title: string; data: string; owner: string | null; ownerAvatar?: string | null; updated_at: string; share: number; live: number; stream_url: string };
const COLS = 'b.id, b.user_id, b.title, b.data, b.updated_at';
async function load(env: Ctx['env'], id: string): Promise<Row | null> {
  const q = (cols: string) => env.DB.prepare(`SELECT ${COLS}, ${cols}u.name AS owner, u.avatar AS ownerAvatar FROM user_brackets b LEFT JOIN users u ON u.id = b.user_id WHERE b.id = ?`).bind(id).first<Row>();
  try { return await q('b.share, b.live, b.stream_url, '); } catch { /* stream_url column not added yet */ }
  try { const r = await q('b.share, b.live, '); return r ? { ...r, stream_url: '' } : null; } catch { /* share/live not added yet: nothing is published */ }
  const r = await q(''); return r ? { ...r, share: 0, live: 0, stream_url: '' } : null;
}

/** A site (admin) tournament the member was added to as an organiser: its tree lives in `tournaments`. */
type Site = { id: string; name_ar: string; name_en: string; bracket: string | null; starts_at: string };
async function siteRow(env: Ctx['env'], id: string): Promise<Site | null> {
  try { return await env.DB.prepare("SELECT id, name_ar, name_en, bracket, starts_at FROM tournaments WHERE id = ? AND COALESCE(bracket_id, '') = ''").bind(id).first<Site>(); } catch { return null; }
}

/** The owner always sees it. Everyone else only after the owner published the link (`share`). The stream link is public only while "live" is on. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const r = await load(env, params.id);
  const u = await currentUser(request, env);
  if (!r) {
    // not a saved bracket: a site tournament this member was added to (tree, registration link and registrants only)
    const sa = u ? await siteAccess(env, params.id, u.id) : null;
    const t = sa ? await siteRow(env, params.id) : null;
    let tree: unknown = null; try { tree = t?.bracket ? JSON.parse(t.bracket) : null; } catch { /* corrupt row */ }
    if (!sa || !t || !tree) return json({ error: 'not_found' }, 404);
    return json({ id: t.id, title: t.name_ar || t.name_en, bracket: tree, owner: 'Plato AR', ownerAvatar: '', mine: true, isOwner: false, perms: sa.perms, share: true, live: false, streamLive: false, streamUrl: '', updatedAt: t.starts_at, site: true });
  }
  const acc = u ? await bracketAccess(env, r.id, u.id) : null;
  const mine = !!acc; // owner or co-editor (what a co-editor may change is in `perms`)
  let bracket = null; try { bracket = JSON.parse(r.data); } catch { /* corrupt row */ }
  const streamLive = !!r.live && !!r.stream_url;
  return json({ id: r.id, title: r.title, bracket, owner: mine ? r.owner ?? '' : '', ownerAvatar: mine ? r.ownerAvatar ?? '' : '', mine, isOwner: !!acc?.isOwner, perms: acc ? acc.perms : [], share: true, live: !!r.live, streamLive, streamUrl: mine || streamLive ? r.stream_url || '' : '', updatedAt: r.updated_at });
};

export const onRequestPut = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const r = await load(env, params.id);
  if (!r) return putSite(request, env, params.id, u.id);
  const acc = await bracketAccess(env, r.id, u.id);
  if (!acc || !allows(acc, 'tree', 'info')) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  let data = cleanBracket(b.bracket);
  if (!data) return json({ error: 'invalid' }, 400);
  let title = str(b.title, 60) || r.title;
  const tree = acc.perms.includes('tree'), info = acc.perms.includes('info');
  if (!tree || !info) {
    // A co-editor with limited permissions: what he may not change is taken from the saved copy. info = the tournament details, names and organiser; everything else is the tree.
    let old: Record<string, unknown> | null = null;
    try { old = JSON.parse(r.data); } catch { /* corrupt row */ }
    if (!old) return json({ error: 'invalid' }, 400);
    const inc = data as unknown as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...(tree ? inc : old) };
    const src = info ? inc : old;
    for (const k of ['info', 'titleEn', 'org']) { if (k in src) merged[k] = src[k]; else delete merged[k]; }
    const c = cleanBracket(merged);
    if (!c) return json({ error: 'invalid' }, 400);
    data = c;
    if (!info) title = r.title;
  }
  await env.DB.prepare('UPDATE user_brackets SET title = ?, data = ?, updated_at = ? WHERE id = ?').bind(title, JSON.stringify(data), new Date().toISOString(), r.id).run();
  // The organiser's bracket has a champion → the published tournament is over: winner + end date are written by themselves. No champion (e.g. a final was undone) → it is open again.
  if (tree && typeof b.champion === 'string') {
    const w = b.champion.trim().slice(0, 80);
    try {
      const row = await env.DB.prepare('SELECT winner_en FROM tournaments WHERE id = ? AND owner_id = ?').bind(`u-${r.id}`, r.user_id).first<{ winner_en: string }>();
      if (row && (row.winner_en || '') !== w) await env.DB.prepare('UPDATE tournaments SET winner_en = ?, winner_ar = ?, winner_members = ?, ends_at = ? WHERE id = ? AND owner_id = ?').bind(w, w, '', w ? new Date().toISOString() : '', `u-${r.id}`, r.user_id).run();
    } catch { /* tournaments not published / columns missing: nothing to update */ }
  }
  return json({ ok: true });
};

/** A member who was added to a site tournament works on its tree: the details of the tournament card, its name and its organiser stay as they are. */
async function putSite(request: Request, env: Ctx['env'], id: string, uid: string) {
  const acc = await siteAccess(env, id, uid);
  const t = acc && allows(acc, 'tree') ? await siteRow(env, id) : null;
  if (!t || !t.bracket) return json({ error: 'not_found' }, 404);
  const b = await body(request);
  const data = cleanBracket(b.bracket);
  let old: Record<string, unknown> | null = null;
  try { old = JSON.parse(t.bracket); } catch { /* corrupt row */ }
  if (!data || !old) return json({ error: 'invalid' }, 400);
  const merged: Record<string, unknown> = { ...(data as unknown as Record<string, unknown>) };
  for (const k of ['info', 'titleEn', 'org']) { if (k in old) merged[k] = old[k]; else delete merged[k]; }
  const c = cleanBracket(merged);
  if (!c) return json({ error: 'invalid' }, 400);
  await env.DB.prepare('UPDATE tournaments SET bracket = ? WHERE id = ?').bind(JSON.stringify(c), t.id).run();
  // the champion is the tournament's winner and ends it (an empty one = the final was undone), like in the dashboard
  if (typeof b.champion === 'string') {
    const w = b.champion.trim().slice(0, 80);
    try {
      const row = await env.DB.prepare('SELECT winner_en FROM tournaments WHERE id = ?').bind(t.id).first<{ winner_en: string }>();
      if (row && (row.winner_en || '') !== w) await env.DB.prepare('UPDATE tournaments SET winner_en = ?, winner_ar = ?, winner_members = ?, ends_at = ? WHERE id = ?').bind(w, w, '', w ? new Date().toISOString() : '', t.id).run();
    } catch { /* columns missing on an older database: nothing to update */ }
  }
  return json({ ok: true });
}

/** Owner switches: publish the view link (`share`), the stream link (`streamUrl`) and whether the stream is on right now (`live`). */
export const onRequestPatch = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const b = await body(request);
  const sets: string[] = [], vals: (number | string)[] = [];
  if (typeof b.share === 'boolean') { sets.push('share = ?'); vals.push(b.share ? 1 : 0); }
  if (typeof b.live === 'boolean') { sets.push('live = ?'); vals.push(b.live ? 1 : 0); }
  if (typeof b.streamUrl === 'string') { sets.push('stream_url = ?'); vals.push(b.streamUrl.trim() ? safeUrl(b.streamUrl).slice(0, 300) : ''); }
  if (!sets.length) return json({ error: 'invalid' }, 400);
  try { await env.DB.prepare(`UPDATE user_brackets SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).bind(...vals, params.id, u.id).run(); }
  catch { return json({ error: 'migrate' }, 500); } // run the ALTER TABLE statements from schema.sql
  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  await env.DB.prepare('DELETE FROM user_brackets WHERE id = ? AND user_id = ?').bind(params.id, u.id).run();
  return json({ ok: true });
};
