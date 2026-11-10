import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface AuthUser { id: string; name: string; avatar: string; provider: string; email?: string; createdAt?: string }
export interface Providers { discord: boolean; google: boolean; twitch: boolean; steam: boolean; email: boolean }
const OFF: Providers = { discord: false, google: false, twitch: false, steam: false, email: false };
interface Me { user: AuthUser | null; providers: Providers; count?: number; max?: number }

/** The signed-in visitor (Discord / Google / Twitch / Steam / email) for the public bracket tool. */
export function useAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const load = useCallback(() => { api<Me>('/auth/me').then(setMe).catch(() => setMe({ user: null, providers: OFF })); }, []);
  useEffect(load, [load]);
  const logout = useCallback(async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } load(); }, [load]);
  return { ready: me !== null, user: me?.user ?? null, providers: me?.providers ?? OFF, count: me?.count ?? 0, max: me?.max ?? 100, logout, reload: load };
}
