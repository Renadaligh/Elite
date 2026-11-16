import { currentUser } from '../../_auth';
import { denied, json, type Ctx } from '../../_lib';

/** In-dashboard notices for the organizer: the review result of his published tournaments (no email needed). */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const u = await currentUser(request, env);
  if (!u) return denied();
  type R = { id: string; bracket_id: string; name_en: string; name_ar: string; review: string; review_note: string };
  try {
    const { results } = await env.DB.prepare("SELECT id, bracket_id, name_en, name_ar, review, review_note FROM tournaments WHERE owner_id = ? AND bracket_id != '' AND review IN ('pending','approved','rejected') ORDER BY rowid DESC LIMIT 30").bind(u.id).all<R>();
    return json(results.map((r) => ({ id: r.id, bracketId: r.bracket_id, name: r.name_ar || r.name_en, review: r.review, note: r.review_note || '' })));
  } catch { return json([]); }
};
