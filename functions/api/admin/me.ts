import { getAdmin } from '../../_admin';
import { denied, json, type Ctx } from '../../_lib';

export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await getAdmin(request, env);
  if (!a) return denied();
  return json({ username: a.username, role: a.role, perms: a.perms, mustChange: a.mustChange, recovery: a.recovery });
};
