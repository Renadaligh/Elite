import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import Fold from './Fold';
import { RegistrantsPanel, addTxt, autoAddNew, regName, type RegRow } from './AddPlayers';
import { nameKey } from '../data/bracket';
import type { FormQ } from './RegForm';

/**
 * ONE list of everybody who registered for this bracket, whichever way they came (the standalone registration link or the tournament published on the site).
 * Registrants go straight into the bracket; × deletes the registration (and takes the player out of the bracket), − only takes the player out of the bracket.
 */
export default function RegistrantsCard({ onRenamePlayer, onReorder, id, lang, players, onAdd, onUnadd, onUnaddAll, auto, autoOn, onAuto, bench }: { /** the person was renamed in the list: the same person is renamed in the bracket */ onRenamePlayer?: (from: string, to: string) => void; onReorder?: (from: string, to: string) => void; id: string; lang: 'ar' | 'en'; players: string[]; onAdd: (names: string[]) => void; onUnadd?: (name: string, keep?: boolean) => void; onUnaddAll?: (keep: string[]) => void; auto?: boolean; autoOn?: boolean; onAuto?: (on: boolean) => void; bench?: string[] }) {
  const [join, setJoin] = useState<RegRow[]>([]);
  const [site, setSite] = useState<RegRow[]>([]);
  const [qs, setQs] = useState<FormQ[]>([]);
  const load = useCallback(() => {
    api<{ signups?: RegRow[]; form?: { qs?: FormQ[] } }>(`/brackets/${id}/join`).then((r) => { setQs(r.form?.qs ?? []); setJoin((r.signups ?? []).map((x) => ({ ...x, src: 'join' as const }))); }).catch(() => undefined);
    api<RegRow[]>(`/brackets/${id}/regs`).then((r) => setSite((Array.isArray(r) ? r : []).map((x) => ({ ...x, src: 'site' as const })))).catch(() => undefined);
  }, [id]);
  useEffect(() => {
    load();
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    const t = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('elite-regs-refresh', load);
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('elite-regs-refresh', load); };
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
  const rename = async (r: RegRow, name: string) => {
    const old = regName(r);
    if (r.src !== 'manual') {
      try { await api(`/brackets/${id}/regname`, { method: 'PUT', body: JSON.stringify({ src: r.src === 'site' ? 'r' : 'j', rid: r.id, name }) }); }
      catch (e) { const d = (e as Error & { detail?: string }).detail ?? ''; const tt = addTxt(lang); return tt.repErr[d] ?? tt.renFail; }
    }
    onRenamePlayer?.(old, name);
    load();
    return undefined;
  };
  const replace = async (r: RegRow, v: { platoId: string; teamName: string; members: string; keep?: boolean }) => {
    const old = regName(r);
    try {
      const res = await api<{ name?: string }>(`/brackets/${id}/regname`, { method: 'PUT', body: JSON.stringify({ op: v.keep ? 'edit' : 'replace', src: r.src === 'site' ? 'r' : 'j', rid: r.id, ...v }) });
      onRenamePlayer?.(old, res.name || v.teamName || v.platoId);
      load();
      return undefined;
    } catch (e) { return (e as Error & { detail?: string }).detail ?? 'fail'; }
  };
  return (
    <Fold title={`${lang === 'ar' ? 'المسجّلون' : 'Registered'} · ${count}`}>
      <RegistrantsPanel qs={qs} onReorder={onReorder} lang={lang} regs={all} players={players} onAdd={onAdd} onUnadd={onUnadd} onUnaddAll={onUnaddAll} bench={bench} autoOn={autoOn} onAuto={onAuto} onRefresh={load} onDelete={del} onRename={rename} onReplace={replace} />
    </Fold>
  );
}
