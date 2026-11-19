import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { RegistrantsPanel, autoAddNew, type RegRow } from './AddPlayers';

/**
 * ONE list of everybody who registered for this bracket, whichever way they came (the standalone registration link or the tournament published on the site).
 * Registrants go straight into the bracket; × deletes the registration (and takes the player out of the bracket), − only takes the player out of the bracket.
 */
export default function RegistrantsCard({ id, lang, players, onAdd, onUnadd, auto }: { id: string; lang: 'ar' | 'en'; players: string[]; onAdd: (names: string[]) => void; onUnadd?: (name: string) => void; auto?: boolean }) {
  const [join, setJoin] = useState<RegRow[]>([]);
  const [site, setSite] = useState<RegRow[]>([]);
  const load = useCallback(() => {
    api<{ signups?: RegRow[] }>(`/brackets/${id}/join`).then((r) => setJoin((r.signups ?? []).map((x) => ({ ...x, src: 'join' as const })))).catch(() => undefined);
    api<RegRow[]>(`/brackets/${id}/regs`).then((r) => setSite((Array.isArray(r) ? r : []).map((x) => ({ ...x, src: 'site' as const })))).catch(() => undefined);
  }, [id]);
  useEffect(() => {
    load();
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    const t = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', refresh); };
  }, [load]);

  // new registrants go straight into the bracket (each source keeps its own "already handled" mark)
  useEffect(() => { if (auto) autoAddNew(id, 'join', join, players, onAdd); }, [join, auto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (auto) autoAddNew(id, 'reg', site, players, onAdd); }, [site, auto]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = [...join, ...site].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
  if (all.length === 0 && players.length === 0) return null;
  const del = (r: RegRow) => {
    const url = r.src === 'site' ? `/brackets/${id}/regs?rid=${r.id}` : `/brackets/${id}/join?rid=${r.id}`;
    void api(url, { method: 'DELETE' }).then(load).catch(() => undefined);
  };
  return (
    <RegistrantsPanel lang={lang} regs={all} players={players} onAdd={onAdd} onUnadd={onUnadd} onRefresh={load} onDelete={del} />
  );
}
