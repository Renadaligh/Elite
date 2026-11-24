import { publicBracketPage } from './_publicBracketPage';
import type { Ctx } from './_lib';

/** Short links: plato-ar.com/<8 characters> = the registration page, plato-ar.com/<8 characters>v = the bracket view.
 *  Everything else (/news, /admin, /bracket, /favicon.ico, …) falls straight through to the normal pages and files. The old /j/… and /v/… links keep working. */
export const onRequest = async (ctx: Ctx & { next: () => Promise<Response> }) => {
  const m = ctx.request.method;
  const code = ctx.params.code ?? '';
  if ((m === 'GET' || m === 'HEAD') && /^[0-9a-f]{8}v$/i.test(code)) {
    return publicBracketPage({ ...ctx, params: { ...ctx.params, id: code.slice(0, 8).toLowerCase() } });
  }
  return ctx.next();
};
