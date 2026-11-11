// Shared helpers for the API (Cloudflare Pages Functions + D1). Not a route: it exports no handlers.
interface D1Stmt { bind(...v: unknown[]): D1Stmt; all<T = unknown>(): Promise<{ results: T[] }>; run(): Promise<unknown>; first<T = unknown>(): Promise<T | null> }
interface R2Obj { body: ReadableStream; size: number; httpMetadata?: { contentType?: string } }
export interface Env {
  DB: { prepare(q: string): D1Stmt };
  IMAGES?: { put(key: string, value: Uint8Array, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>; get(key: string, opts?: { range?: { offset: number; length?: number } }): Promise<R2Obj | null>; delete(key: string): Promise<unknown> };
  ADMIN_PASSWORD?: string;
  DISCORD_CLIENT_ID?: string; DISCORD_CLIENT_SECRET?: string; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string;
  TWITCH_CLIENT_ID?: string; TWITCH_CLIENT_SECRET?: string; STEAM_API_KEY?: string; RESEND_API_KEY?: string; MAIL_FROM?: string; DISCORD_WEBHOOK_URL?: string; OWNER_USERNAME?: string;
}
export type Ctx = { request: Request; env: Env; params: Record<string, string> };

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export const denied = () => json({ error: 'unauthorized' }, 401);

export async function body(req: Request): Promise<Record<string, unknown>> {
  try { const b = await req.json(); return b && typeof b === 'object' ? (b as Record<string, unknown>) : {}; } catch { return {}; }
}
export const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const num = (v: unknown, d = 0) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 0 ? n : d; };
export const safeUrl = (v: unknown) => { const s = str(v, 600); return /^(https?:\/\/|\/)/i.test(s) ? s : ''; };
export const newId = () => crypto.randomUUID().slice(0, 8);
