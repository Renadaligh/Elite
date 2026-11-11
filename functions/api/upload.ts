import { sniff, sniffVideo } from '../_img';
import { denied, isAdmin, json, type Ctx } from '../_lib';

const MAX = 6 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

/** POST /api/upload (admin only): an image as multipart "file", or a video sent as the raw body (Content-Type video/mp4 | video/webm, up to 50 MB) → stored in R2, returns { url }. */
export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!isAdmin(request, env)) return denied();
  if (!env.IMAGES) return json({ error: 'storage-not-configured' }, 500);
  if ((request.headers.get('content-type') ?? '').startsWith('video/')) {
    const len = Number(request.headers.get('content-length') ?? 0);
    if (!len || len > MAX_VIDEO) return json({ error: 'too-large' }, 413);
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_VIDEO) return json({ error: 'too-large' }, 413);
    const kind = sniffVideo(bytes);
    if (!kind) return json({ error: 'unsupported' }, 415);
    const key = `${crypto.randomUUID()}.${kind.ext}`;
    await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: kind.type } });
    return json({ url: `/api/img/${key}` });
  }
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
