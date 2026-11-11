import type { Ctx } from '../../_lib';

/** GET /api/img/<uuid>.<ext>: public image or video from R2. Names are random and never reused, so they cache forever. Videos support Range requests (seeking, iPhone playback). */
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const key = params.key ?? '';
  if (!env.IMAGES || !/^[0-9a-f-]{36}\.(png|jpg|webp|gif|mp4|webm)$/.test(key)) return new Response('Not found', { status: 404 });
  const video = /\.(mp4|webm)$/.test(key);
  const base = { 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', ...(video ? { 'accept-ranges': 'bytes' } : {}) };
  const m = video ? /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '') : null;
  if (m && (m[1] || m[2])) {
    const head = await env.IMAGES.get(key, { range: { offset: 0, length: 1 } });
    if (!head) return new Response('Not found', { status: 404 });
    const size = head.size;
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
    const part = await env.IMAGES.get(key, { range: { offset: start, length: end - start + 1 } });
    if (!part) return new Response('Not found', { status: 404 });
    return new Response(part.body, { status: 206, headers: { ...base, 'content-type': part.httpMetadata?.contentType ?? 'video/mp4', 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': String(end - start + 1) } });
  }
  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, { headers: { ...base, 'content-type': obj.httpMetadata?.contentType ?? 'application/octet-stream', ...(video ? { 'content-length': String(obj.size) } : {}) } });
};
