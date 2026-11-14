import { currentUser, sameOrigin } from '../../../_auth';
import { sniff } from '../../../_img';
import { denied, json, type Ctx } from '../../../_lib';

const MAX = 3 * 1024 * 1024;

/** POST (owner of the bracket, signed in): the cover picture of their community tournament, multipart "file" → stored in R2, returns { url }. The picture goes live only after the team approves the tournament. */
export const onRequestPost = async ({ request, env, params }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const mine = await env.DB.prepare('SELECT 1 AS x FROM user_brackets WHERE id = ? AND user_id = ?').bind(params.id, u.id).first().catch(() => null);
  if (!mine) return json({ error: 'not_found' }, 404);
  if (!env.IMAGES) return json({ error: 'storage-not-configured' }, 500);
  let file: unknown;
  try { file = (await request.formData()).get('file'); } catch { return json({ error: 'invalid' }, 400); }
  if (!file || typeof file === 'string') return json({ error: 'invalid' }, 400);
  const blob = file as Blob;
  if (blob.size === 0 || blob.size > MAX) return json({ error: 'too-large' }, 413);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return json({ error: 'unsupported' }, 415);
  const key = `${crypto.randomUUID()}.${kind.ext}`;
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: kind.type } });
  return json({ url: `/api/img/${key}` });
};
