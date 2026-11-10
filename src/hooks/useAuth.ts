import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface AuthUser { id: string; name: string; avatar: string; provider: string }
interface Me { user: AuthUser | null; providers: { discord: boolean; google: boolean } }

/** The signed-in visitor (Discord / Google) for the public bracket tool. */
export function useAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const load = useCallback(() => { api<Me>('/auth/me').then(setMe).catch(() => setMe({ user: null, providers: { discord: false, google: false } })); }, []);
  useEffect(load, [load]);
  const logout = useCallback(async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } load(); }, [load]);
  return { ready: me !== null, user: me?.user ?? null, providers: me?.providers ?? { discord: false, google: false }, logout, reload: load };
}
