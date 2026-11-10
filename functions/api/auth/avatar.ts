import { currentUser, sameOrigin } from '../../_auth';
import { sniff } from '../../_img';
import { denied, json, type Ctx } from '../../_lib';

const MAX = 300 * 1024; // the page shrinks photos to 256 px first (about 20 KB), this is only a safety cap

/** POST: replace my profile photo (multipart "file"). DELETE: remove it. Photos live in R2 and are served by /api/img. */
export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  if (!env.IMAGES) return json({ error: 'storage-not-configured' }, 500);
  let file: unknown;
  try { file = (await request.formData()).get('file'); } catch { return json({ error: 'invalid' }, 400); }
  if (!file || typeof file === 'string') return json({ error: 'invalid' }, 400);
  const blob = file as Blob;
  if (blob.size === 0 || blob.size > MAX) return json({ error: 'too-large' }, 413);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind || kind.ext === 'gif') return json({ error: 'unsupported' }, 415);
  const key = `${crypto.randomUUID()}.${kind.ext}`;
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: kind.type } });
  const old = u.avatar.startsWith('/api/img/') ? u.avatar.slice(9) : '';
  await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(`/api/img/${key}`, u.id).run();
  if (old) { try { await env.IMAGES.delete(old); } catch { /* ignore */ } }
  return json({ ok: true, url: `/api/img/${key}` });
};

export const onRequestDelete = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const u = await currentUser(request, env);
  if (!u) return denied();
  const old = u.avatar.startsWith('/api/img/') ? u.avatar.slice(9) : '';
  await env.DB.prepare("UPDATE users SET avatar = '' WHERE id = ?").bind(u.id).run();
  if (old && env.IMAGES) { try { await env.IMAGES.delete(old); } catch { /* ignore */ } }
  return json({ ok: true });
};
