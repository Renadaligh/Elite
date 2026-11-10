// Visitor accounts (Discord / Google sign-in) for the public bracket tool. Not a route: it exports no handlers.
import type { Ctx, Env } from './_lib';

export const COOKIE = 'elite_session';
export const DAYS = 30;
export type User = { id: string; name: string; avatar: string; provider: string };

export const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function cookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
export const cookie = (req: Request, name: string, value: string, maxAge: number, path = '/') =>
  `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;

/** The signed-in visitor (from the session cookie), or null. */
export async function currentUser(req: Request, env: Env): Promise<User | null> {
  const t = cookies(req)[COOKIE];
  if (!t || !/^[0-9a-f]{48}$/.test(t)) return null;
  try {
    return await env.DB.prepare('SELECT u.id, u.name, u.avatar, u.provider FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
      .bind(await sha256(t), Date.now()).first<User>();
  } catch { return null; } // tables not created yet
}

/** Writes (POST/PUT/DELETE) must come from our own site: blocks cross-site form posts using the cookie. */
export function sameOrigin(req: Request) {
  const o = req.headers.get('origin');
  return !o || o === new URL(req.url).origin;
}

export const PROVIDERS = {
  discord: {
    auth: 'https://discord.com/oauth2/authorize', token: 'https://discord.com/api/oauth2/token', scope: 'identify email',
    id: (e: Env) => e.DISCORD_CLIENT_ID, secret: (e: Env) => e.DISCORD_CLIENT_SECRET,
  },
  google: {
    auth: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', scope: 'openid email profile',
    id: (e: Env) => e.GOOGLE_CLIENT_ID, secret: (e: Env) => e.GOOGLE_CLIENT_SECRET,
  },
} as const;
export type ProviderName = keyof typeof PROVIDERS;
export const isProvider = (p: string): p is ProviderName => p === 'discord' || p === 'google';
export const configured = (env: Env, p: ProviderName) => !!PROVIDERS[p].id(env) && !!PROVIDERS[p].secret(env);
export const redirectUri = (req: Request, p: ProviderName) => `${new URL(req.url).origin}/api/auth/callback/${p}`;
export type { Ctx };
