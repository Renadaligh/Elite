// Admin accounts: sessions, permissions, password hashing. Not a route: it exports no handlers.
import { hex, sha256 } from './_auth';
import { denied, json, type Env } from './_lib';

export const SECTIONS = { news: ['add', 'edit', 'delete'], tournaments: ['add', 'edit', 'delete'], games: ['add', 'edit', 'delete'], regs: ['view', 'delete'] } as const;
export type Section = keyof typeof SECTIONS;
export type Perms = Partial<Record<Section, string[]>>;
export type Admin = { username: string; role: 'owner' | 'admin'; perms: Perms; mustChange: boolean; recovery: boolean };

export const PRESETS: Record<string, Perms> = {
  news: { news: ['add', 'edit', 'delete'] },
  tournaments: { tournaments: ['add', 'edit', 'delete'], regs: ['view'] },
  games: { games: ['add', 'edit', 'delete'] },
  full: { news: ['add', 'edit', 'delete'], tournaments: ['add', 'edit', 'delete'], games: ['add', 'edit', 'delete'], regs: ['view', 'delete'] },
};
export const FULL = PRESETS.full;
export const SESSION_MS = 12 * 3600 * 1000;
export const TEMP_MS = 7 * 86400 * 1000;
export const MAX_FAILS = 5;
export const ownerName = (env: Env) => (env.OWNER_USERNAME || 'owner').toLowerCase();
export const validUser = (u: string) => /^[a-z0-9_]{3,24}$/.test(u);

export function cleanPerms(v: unknown): Perms {
  const out: Perms = {};
  if (!v || typeof v !== 'object') return out;
  for (const s of Object.keys(SECTIONS) as Section[]) {
    const a = (v as Record<string, unknown>)[s];
    if (Array.isArray(a)) { const ok = (SECTIONS[s] as readonly string[]).filter((x) => a.includes(x)); if (ok.length) out[s] = ok; }
  }
  return out;
}
export const readPerms = (s: string | null | undefined): Perms => { try { return cleanPerms(JSON.parse(s || '{}')); } catch { return {}; } };

/** PBKDF2-SHA256, 100k iterations (the Workers maximum). */
export async function hashPw(pw: string, salt: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, k, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function eq(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}
/** Temporary password: 14 characters, no look-alike characters. */
export function tempPassword() {
  const A = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(14));
  return [...r].map((b) => A[b % A.length]).join('');
}

export async function newSession(env: Env, username: string, recovery: boolean) {
  const token = hex(32);
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash, username, expires_at, recovery) VALUES (?,?,?,?)').bind(await sha256(token), username, Date.now() + SESSION_MS, recovery ? 1 : 0).run();
  try { await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').bind(Date.now()).run(); } catch { /* ignore */ }
  return token;
}

type Row = { username: string; role: string; perms: string; must_change: number; disabled: number; locked: number; recovery: number };
/** The signed-in admin for this request (Bearer = session token), or null. Permissions are read fresh from D1 on every request. */
export async function getAdmin(req: Request, env: Env): Promise<Admin | null> {
  const h = req.headers.get('authorization') ?? '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t || t.length > 200) return null;
  try {
    const r = await env.DB.prepare('SELECT a.username, a.role, a.perms, a.must_change, a.disabled, a.locked, s.recovery FROM admin_sessions s JOIN admins a ON a.username = s.username WHERE s.token_hash = ? AND s.expires_at > ?')
      .bind(await sha256(t), Date.now()).first<Row>();
    if (!r || r.disabled || r.locked) return null;
    const owner = r.role === 'owner';
    return { username: r.username, role: owner ? 'owner' : 'admin', perms: owner ? FULL : readPerms(r.perms), mustChange: !!r.must_change, recovery: !!r.recovery };
  } catch { return null; }
}

export const can = (a: Admin, s: Section, act: string) => !!a.perms[s]?.includes(act);
export const canAny = (a: Admin, s: Section) => !!a.perms[s]?.length;
export const forbidden = () => json({ error: 'forbidden' }, 403);

/** Endpoint guard: returns the admin, or a ready 401/403 response. */
export async function guard(req: Request, env: Env, s: Section, act: string): Promise<Admin | Response> {
  const a = await getAdmin(req, env);
  if (!a) return denied();
  if (a.mustChange) return json({ error: 'must_change' }, 403);
  return can(a, s, act) ? a : forbidden();
}
/** Guard for the owner-only endpoints. */
export async function guardOwner(req: Request, env: Env): Promise<Admin | Response> {
  const a = await getAdmin(req, env);
  if (!a) return denied();
  if (a.mustChange) return json({ error: 'must_change' }, 403);
  return a.role === 'owner' ? a : forbidden();
}
/** Guard for uploads: any admin who can add or edit news, tournaments or games. */
export async function guardUpload(req: Request, env: Env): Promise<Admin | Response> {
  const a = await getAdmin(req, env);
  if (!a) return denied();
  if (a.mustChange) return json({ error: 'must_change' }, 403);
  const ok = (['news', 'tournaments', 'games'] as Section[]).some((s) => can(a, s, 'add') || can(a, s, 'edit'));
  return ok ? a : forbidden();
}
/** Same as guard but only reports whether an admin may see drafts of this section (used by public lists). */
export async function seesAll(req: Request, env: Env, s: Section) {
  const a = await getAdmin(req, env);
  return !!a && !a.mustChange && canAny(a, s);
}
