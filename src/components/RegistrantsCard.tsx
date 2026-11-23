import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import Fold from './Fold';
import { RegistrantsPanel, autoAddNew, regName, type RegRow } from './AddPlayers';
import { nameKey } from '../data/bracket';

/**
 * ONE list of everybody who registered for this bracket, whichever way they came (the standalone registration link or the tournament published on the site).
 * Registrants go straight into the bracket; × deletes the registration (and takes the player out of the bracket), − only takes the player out of the bracket.
 */
export default function RegistrantsCard({ onReorder, id, lang, players, onAdd, onUnadd, onUnaddAll, auto, autoOn, onAuto, bench }: { onReorder?: (from: string, to: string) => void; id: string; lang: 'ar' | 'en'; players: string[]; onAdd: (names: string[]) => void; onUnadd?: (name: string, keep?: boolean) => void; onUnaddAll?: (keep: string[]) => void; auto?: boolean; autoOn?: boolean; onAuto?: (on: boolean) => void; bench?: string[] }) {
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

  const all = [...join, ...site].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')).filter((r, i, a) => a.findIndex((q) => nameKey(regName(q)) === nameKey(regName(r))) === i);
  if (all.length === 0 && players.length === 0 && !(bench?.length)) return null;
  const have = new Set(all.map((r) => nameKey(regName(r))));
  const count = all.length + players.filter((p) => !have.has(nameKey(p))).length + (bench ?? []).filter((p) => !have.has(nameKey(p))).length;
  const del = (r: RegRow) => {
    const url = r.src === 'site' ? `/brackets/${id}/regs?rid=${r.id}` : `/brackets/${id}/join?rid=${r.id}`;
    void api(url, { method: 'DELETE' }).then(load).catch(() => undefined);
  };
  return (
    <Fold title={`${lang === 'ar' ? 'المسجّلون' : 'Registered'} · ${count}`}>
      <RegistrantsPanel onReorder={onReorder} lang={lang} regs={all} players={players} onAdd={onAdd} onUnadd={onUnadd} onUnaddAll={onUnaddAll} bench={bench} autoOn={autoOn} onAuto={onAuto} onRefresh={load} onDelete={del} />
    </Fold>
  );
}
