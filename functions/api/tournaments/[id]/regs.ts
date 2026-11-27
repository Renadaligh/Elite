import { guardTournament } from '../../../_share';
import { json, type Ctx } from '../../../_lib';
import { regRows } from '../../registrations/index';

/** The people who registered through the site's form for this tournament: an admin who may edit tournaments, or one who was added to it with the registrants permission. */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const u = await guardTournament(request, env, params.id, 'regs'); if (u instanceof Response) return u;
  return json(await regRows(env, params.id));
};
