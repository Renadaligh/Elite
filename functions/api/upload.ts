import { sniff } from '../_img';
import { denied, isAdmin, json, type Ctx } from '../_lib';

const MAX = 6 * 1024 * 1024;

/** POST /api/upload (admin only): multipart form with one "file" → stored in R2, returns { url }. */
export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
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
