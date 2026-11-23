import type { Ctx } from './_lib';
import { publicBracketPage } from './_publicBracketPage';

/** Short links: /<code> (registration, the app opens it) and /<code>v (the public tree). A code is the bracket's id: 6–8 hex characters.
 *  Everything else that is one segment long (/news, /admin, /sw.js, …) is handed straight on to the site. */
export async function onRequestGet(ctx: Ctx & { next: () => Promise<Response> }) {
  const m = /^([a-f0-9]{6,8})v$/i.exec(String(ctx.params.code ?? ''));
  if (!m) return ctx.next();
  return publicBracketPage({ ...ctx, params: { ...ctx.params, id: m[1].toLowerCase() } });
}
