// Visitor accounts (Discord / Google sign-in) for the public bracket tool. Not a route: it exports no handlers.
import type { Ctx, Env } from './_lib';

export const COOKIE = 'elite_session';
export const DAYS = 30;
export type User = { id: string; name: string; avatar: string; provider: string; email: string; createdAt: string };

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
    return await env.DB.prepare('SELECT u.id, u.name, u.avatar, u.provider, u.email, u.created_at AS createdAt FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
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
  twitch: {
    auth: 'https://id.twitch.tv/oauth2/authorize', token: 'https://id.twitch.tv/oauth2/token', scope: 'user:read:email',
    id: (e: Env) => e.TWITCH_CLIENT_ID, secret: (e: Env) => e.TWITCH_CLIENT_SECRET,
  },
} as const;
export type ProviderName = keyof typeof PROVIDERS;
/** OAuth providers (steam = OpenID and email = magic link have their own handlers). */
export const isProvider = (p: string): p is ProviderName => p === 'discord' || p === 'google' || p === 'twitch';
export const configured = (env: Env, p: ProviderName) => !!PROVIDERS[p].id(env) && !!PROVIDERS[p].secret(env);
export const steamOn = (env: Env) => !!env.STEAM_API_KEY;
export const emailOn = (env: Env) => !!env.RESEND_API_KEY && !!env.MAIL_FROM;
export const allProviders = (env: Env) => ({ discord: configured(env, 'discord'), google: configured(env, 'google'), twitch: configured(env, 'twitch'), steam: steamOn(env), email: emailOn(env) });
export const redirectUri = (req: Request, p: string) => `${new URL(req.url).origin}/api/auth/callback/${p}`;

export type Profile = { id: string; name: string; email: string; avatar: string };
/** Finds or creates the account for this provider identity, starts a session and redirects into the studio. A name the visitor edited is never overwritten. */
export async function signIn(request: Request, env: Env, provider: string, prof: Profile, r: string): Promise<Response> {
  const origin = new URL(request.url).origin;
  const name = (prof.name || 'Player').slice(0, 60), email = prof.email.slice(0, 120), avatar = prof.avatar.slice(0, 300);
  const found = await env.DB.prepare('SELECT id FROM users WHERE provider = ? AND provider_id = ?').bind(provider, prof.id).first<{ id: string }>();
  const uid = found?.id ?? hex(8);
  if (found) await env.DB.prepare("UPDATE users SET email = ?, avatar = CASE WHEN avatar LIKE '/api/img/%' THEN avatar ELSE ? END WHERE id = ?").bind(email, avatar, uid).run(); // a photo the member uploaded is never replaced by the provider's
  else await env.DB.prepare('INSERT INTO users (id, provider, provider_id, name, email, avatar, created_at) VALUES (?,?,?,?,?,?,?)').bind(uid, provider, prof.id, name, email, avatar, new Date().toISOString()).run();
  const token = hex(24);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').bind(await sha256(token), uid, Date.now() + DAYS * 86400000).run();
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run();
  const h = new Headers({ location: `${origin}/#/bracket${r === 'mine' ? '/mine' : ''}`, 'cache-control': 'no-store' });
  h.append('set-cookie', cookie(request, COOKIE, token, DAYS * 86400));
  h.append('set-cookie', cookie(request, 'oauth_state', '', 0, '/api/auth'));
  return new Response(null, { status: 302, headers: h });
}
export type { Ctx };
