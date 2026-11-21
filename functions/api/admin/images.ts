import { sniff } from '../../_img';
import { guardOwner } from '../../_admin';
import { json, type Ctx } from '../../_lib';

const KEY = /^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/;
const MAX = 6 * 1024 * 1024;

/** GET (owner only): every picture stored in R2 with its size, so the dashboard can find the heavy PNG/JPG ones. */
export const onRequestGet = async ({ request, env }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  if (!env.IMAGES) return json({ error: 'storage-not-configured' }, 500);
  const out: { key: string; size: number }[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 20; i++) {
    const r = await env.IMAGES.list({ cursor, limit: 1000 });
    for (const o of r.objects) if (KEY.test(o.key)) out.push({ key: o.key, size: o.size });
    if (!r.truncated) break;
    cursor = r.cursor;
  }
  return json(out);
};

/** POST ?key=<uuid>.png|jpg (owner only): replace that picture with a smaller WebP (multipart "file") under the SAME name, so every place that uses it keeps working.
 *  The original is first copied to orig/<key> (never served publicly), so nothing is lost. */
export const onRequestPost = async ({ request, env }: Ctx) => {
  const a = await guardOwner(request, env); if (a instanceof Response) return a;
  if (!env.IMAGES) return json({ error: 'storage-not-configured' }, 500);
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!KEY.test(key) || !/\.(png|jpg)$/.test(key)) return json({ error: 'invalid' }, 400);
  let file: unknown;
  try { file = (await request.formData()).get('file'); } catch { return json({ error: 'invalid' }, 400); }
  if (!file || typeof file === 'string') return json({ error: 'invalid' }, 400);
  const blob = file as Blob;
  if (blob.size === 0 || blob.size > MAX) return json({ error: 'too-large' }, 413);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (sniff(bytes)?.ext !== 'webp') return json({ error: 'unsupported' }, 415);
  const old = await env.IMAGES.get(key);
  if (!old) return json({ error: 'not_found' }, 404);
  if (bytes.length >= old.size) return json({ error: 'not-smaller' }, 409);
  const oldBytes = new Uint8Array(await new Response(old.body).arrayBuffer());
  await env.IMAGES.put(`orig/${key}`, oldBytes, { httpMetadata: { contentType: old.httpMetadata?.contentType ?? 'application/octet-stream' } });
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: 'image/webp' } });
  const edge = typeof caches !== 'undefined' ? (caches as unknown as { default?: Cache }).default : undefined;
  if (edge) await edge.delete(new Request(new URL(request.url).origin + '/api/img/v2/' + key)).catch(() => undefined);
  return json({ ok: true, before: old.size, after: bytes.length });
};
