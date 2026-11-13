import { body, json, type Ctx } from '../../_lib';
import { guard } from '../../_admin';
import { logAdmin } from '../../_audit';
import { META, cleanMeta, readMeta } from './index';

/** PUT /api/games/meta (admin): saves the display order and/or the deleted built-in games. Only the fields sent are changed. */
export const onRequestPut = async ({ request, env }: Ctx) => {
  const a = await guard(request, env, 'games', 'edit'); if (a instanceof Response) return a;
  const b = await body(request);
  let cur = { order: [] as string[], deleted: [] as string[] };
  try { const r = await env.DB.prepare('SELECT details FROM games WHERE id=?').bind(META).first<{ details: string }>(); cur = readMeta(r?.details); } catch { /* no details column yet */ }
  const next = cleanMeta({ order: 'order' in b ? b.order : cur.order, deleted: 'deleted' in b ? b.deleted : cur.deleted });
  try {
    await env.DB.prepare("INSERT INTO games (id,genre,name_en,name_ar,tagline_en,tagline_ar,image,hidden,custom,details) VALUES (?,'','','','','','',1,0,?) ON CONFLICT(id) DO UPDATE SET details=excluded.details")
      .bind(META, JSON.stringify(next)).run();
  } catch (e) { return json({ error: 'db', detail: String((e as Error).message).slice(0, 160) }, 500); }
  await logAdmin(env, a.username, 'games.order', 'meta', { order: 'order' in b ? 'changed' : undefined, deleted: 'deleted' in b ? next.deleted : undefined });
  return json({ ok: true });
};
