import type { Ctx } from './_lib';

/** Registration link of a bracket (#/join/<id>): settings live in `bracket_join`, the sign-ups in `bracket_signups`. */
export interface JoinRow { bracket_id: string; user_id: string; enabled: number; mode: string; cap: number; closes_at: number; closed: number }

export async function joinRow(env: Ctx['env'], id: string): Promise<JoinRow | null> {
  try { return await env.DB.prepare('SELECT bracket_id, user_id, enabled, mode, cap, closes_at, closed FROM bracket_join WHERE bracket_id = ?').bind(id).first<JoinRow>(); } catch { return null; }
}

/** Why sign-ups are not accepted right now ('' = open). Manual close, the optional closing time and the optional cap all count. */
export function joinReason(r: JoinRow, count: number, now = Date.now()): '' | 'closed' | 'full' {
  if (r.closed || (r.closes_at > 0 && now >= r.closes_at)) return 'closed';
  if (r.cap > 0 && count >= r.cap) return 'full';
  return '';
}

export async function joinCount(env: Ctx['env'], id: string): Promise<number> {
  try { return (await env.DB.prepare('SELECT COUNT(*) AS n FROM bracket_signups WHERE bracket_id = ?').bind(id).first<{ n: number }>())?.n ?? 0; } catch { return 0; }
}

/** Optional description of the registration page. Own query: works before the `description` column exists. */
export async function joinDesc(env: Ctx['env'], id: string): Promise<string> {
  try { return (await env.DB.prepare('SELECT description FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ description: string }>())?.description ?? ''; } catch { return ''; }
}

/** Optional message the organiser shows after someone registers (own query: works before the `done_msg` column exists). */
export async function joinDoneMsg(env: Ctx['env'], id: string): Promise<string> {
  try { return (await env.DB.prepare('SELECT done_msg FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ done_msg: string }>())?.done_msg ?? ''; } catch { return ''; }
}

/** Optional English title of the registration page (own query, works before the `title_en` column exists). */
export async function joinTitleEn(env: Ctx['env'], id: string): Promise<string> {
  try {
    const b = await env.DB.prepare('SELECT data FROM user_brackets WHERE id = ?').bind(id).first<{ data: string }>();
    if (b) { const v = (JSON.parse(b.data) as { titleEn?: unknown }).titleEn; if (typeof v === 'string' && v.trim()) return v.trim(); }
  } catch { /* fall back to legacy registration title */ }
  try { const v = (await env.DB.prepare('SELECT title_en FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ title_en: string }>())?.title_en ?? ''; if (v) return v; } catch { /* column not there yet */ }
  // an English name the admin added to the published tournament (differs from the Arabic one the organiser typed)
  try { const t = await env.DB.prepare('SELECT name_en, name_ar FROM tournaments WHERE id = ?').bind(`u-${id}`).first<{ name_en: string; name_ar: string }>(); if (t && t.name_en && t.name_en !== t.name_ar) return t.name_en; } catch { /* no tournament */ }
  return '';
}

/** Cover picture + start date of the registration page. Separate query so the page keeps working before the two columns are added (see schema.sql). */
export async function joinExtra(env: Ctx['env'], id: string): Promise<{ cover: string; startsAt: string }> {
  try { const r = await env.DB.prepare('SELECT cover, starts_at FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ cover: string; starts_at: string }>(); return { cover: r?.cover ?? '', startsAt: r?.starts_at ?? '' }; } catch { return { cover: '', startsAt: '' }; }
}
