import { json, type Ctx } from '../../_lib';
import { guard } from '../../_admin';

export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const a = await guard(request, env, 'regs', 'delete'); if (a instanceof Response) return a;
  await env.DB.prepare('DELETE FROM registrations WHERE id=?').bind(params.id).run();
  return json({ ok: true });
};
