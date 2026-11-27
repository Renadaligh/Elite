import { getAdmin } from '../../_admin';
import { sharedWith } from '../../_share';
import { denied, json, type Ctx } from '../../_lib';
import { out, type Row } from '../tournaments/index';

/** The tournaments the signed-in admin was added to (by the owner), each with what he may do: [{ ...tournament, scope: ['tree', ...] }]. Empty for everybody else. */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await getAdmin(request, env);
  if (!a) return denied();
  if (a.mustChange) return json({ error: 'must_change' }, 403);
  const mine = await sharedWith(env, a.username);
  if (!mine.size) return json([]);
  const ids = [...mine.keys()];
  try {
    const { results } = await env.DB.prepare(`SELECT * FROM tournaments WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY starts_at DESC`).bind(...ids).all<Row>();
    return json(results.map((r) => ({ ...out(r, false), scope: mine.get(r.id) ?? [] })));
  } catch { return json([]); }
};
