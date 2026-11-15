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
