import type { Ctx } from './_lib';

/** The id that holds a tournament's registration link and sign-ups. A community tournament lives in its organiser's bracket, so that bracket's id is used; a site tournament uses its own id. */
export async function dataId(env: Ctx['env'], id: string): Promise<string> {
  try {
    const r = await env.DB.prepare('SELECT bracket_id FROM tournaments WHERE id = ?').bind(id).first<{ bracket_id: string | null }>();
    return r?.bracket_id || id;
  } catch { return id; } // older database without the column
}
