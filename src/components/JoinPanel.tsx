import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { RegistrantsPanel, type RegRow } from './AddPlayers';

interface Cfg { enabled: boolean; mode: 'solo' | 'team'; cap: number; closesAt: number; closed: boolean; reason: '' | 'closed' | 'full'; count: number; signups: RegRow[] }
const T = {
  ar: { title: 'رابط التسجيل المستقل', desc: 'صفحة تسجيل فقط، تنسخ رابطها وتنشره بنفسك. اللي يسجّل يوصلك هنا، ولا أحد يشوف الأسماء أو البراكت.', on: 'تفعيل رابط التسجيل', link: 'الرابط', copy: 'نسخ', copied: 'تم النسخ', solo: 'فردي', team: 'فرق', mode: 'نوع التسجيل', cap: 'الحد الأقصى للمسجلين (اختياري)', capPh: 'بدون حد', auto: 'إغلاق تلقائي في وقت محدد', now: 'إغلاق التسجيل الآن', reopen: 'إعادة فتح التسجيل', open: 'مفتوح', closed: 'مغلق', full: 'مكتمل', count: 'المسجّلون', fail: 'تعذّر الحفظ.', migrate: 'نفّذ أوامر SQL الخاصة برابط التسجيل في D1 أولاً.', saveT: 'حفظ' },
  en: { title: 'Standalone registration link', desc: 'A registration-only page: copy its link and share it yourself. Sign-ups arrive here; nobody sees the names or the bracket.', on: 'Enable the registration link', link: 'Link', copy: 'Copy', copied: 'Copied', solo: 'Solo', team: 'Teams', mode: 'Registration type', cap: 'Maximum registrants (optional)', capPh: 'No limit', auto: 'Close automatically at a set time', now: 'Close registration now', reopen: 'Reopen registration', open: 'Open', closed: 'Closed', full: 'Full', count: 'Registered', fail: 'Could not save.', migrate: 'Run the registration-link SQL in D1 first.', saveT: 'Save' },
};
const pad2 = (n: number) => String(n).padStart(2, '0');
/** epoch ms ↔ <input type=datetime-local>, in the organiser's own time zone */
const toLocal = (ms: number) => { if (!(ms > 0)) return ''; const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fromLocal = (v: string) => { const t = new Date(v).getTime(); return Number.isNaN(t) ? 0 : t; };

/** Organiser panel for the registration link (#/join/<id>): on/off, solo/team, cap, auto/manual close, and the people who signed up. */
export default function JoinPanel({ id, lang, link, players, onAdd }: { id: string; lang: 'ar' | 'en'; link: string; players: string[]; onAdd: (names: string[]) => void }) {
  const t = T[lang];
  const [c, setC] = useState<Cfg | null>(null);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [cap, setCap] = useState('');
  const [when, setWhen] = useState('');
  const load = useCallback(async () => {
    try { const d = await api<Cfg>(`/brackets/${id}/join`); setC(d); setCap(d.cap ? String(d.cap) : ''); setWhen(toLocal(d.closesAt)); setMsg(''); }
    catch (e) { setMsg((e as Error & { detail?: string }).detail === 'migrate' ? t.migrate : t.fail); }
  }, [id, t.fail, t.migrate]);
  useEffect(() => { void load(); }, [load]);
  async function put(patch: Record<string, unknown>) {
    try { await api(`/brackets/${id}/join`, { method: 'PUT', body: JSON.stringify(patch) }); await load(); }
    catch (e) { setMsg((e as Error & { detail?: string }).detail === 'migrate' ? t.migrate : t.fail); }
  }
  async function copy() { try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { window.prompt('', link); } }
  const line = 'rounded-xl border bg-transparent px-3 py-2 text-[.9rem] outline-none focus:border-[#3d7bff]';
  const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
  const status = !c ? '' : c.reason === 'full' ? t.full : c.reason === 'closed' ? t.closed : t.open;
  return (
    <div className="st-share" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      <b>{t.title}</b>
      <p className="st-shn">{t.desc}</p>
      {!c ? (msg && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{msg}</p>) : (
        <div className="grid gap-3">
          <div className="st-shh"><div><span>{t.on}</span></div>
            <button type="button" role="switch" aria-checked={c.enabled} aria-label={t.on} className={`st-sw ${c.enabled ? 'on' : ''}`} onClick={() => put({ enabled: !c.enabled })}><i /></button></div>
          {c.enabled && (
            <>
              <div className="st-shl"><input readOnly dir="ltr" aria-label={t.link} value={link} onFocus={(e) => e.currentTarget.select()} /><button type="button" onClick={copy}>{copied ? t.copied : t.copy}</button></div>
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t.mode}>
                <span className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.mode}</span>
                {(['solo', 'team'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={c.mode === m} className={`br-chip ${c.mode === m ? 'on' : ''}`} onClick={() => put({ mode: m })}>{m === 'solo' ? t.solo : t.team}</button>)}
              </div>
              <label className="grid gap-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.cap}
                <input className={line} style={bd} dir="ltr" inputMode="numeric" maxLength={4} placeholder={t.capPh} value={cap} onChange={(e) => setCap(e.target.value.replace(/[^0-9]/g, ''))} onBlur={() => put({ cap: cap ? Number(cap) : 0 })} />
              </label>
              <div className="grid gap-1.5">
                <div className="st-shh"><div><span>{t.auto}</span></div>
                  <button type="button" role="switch" aria-checked={c.closesAt > 0} aria-label={t.auto} className={`st-sw ${c.closesAt > 0 ? 'on' : ''}`} onClick={() => put({ closesAt: c.closesAt > 0 ? 0 : Date.now() + 24 * 3600_000 })}><i /></button></div>
                {c.closesAt > 0 && <input type="datetime-local" className={line} style={bd} dir="ltr" value={when} onChange={(e) => setWhen(e.target.value)} onBlur={() => { const v = fromLocal(when); if (v > 0) void put({ closesAt: v }); }} />}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[.9rem] font-bold">{status} · {t.count}: {c.count}{c.cap > 0 ? ` / ${c.cap}` : ''}</span>
                <button type="button" className="rounded-full border px-3.5 py-1.5 text-[.82rem] font-bold" style={bd} onClick={() => put({ closed: !c.closed })}>{c.closed ? t.reopen : t.now}</button>
              </div>
              <RegistrantsPanel lang={lang} regs={c.signups} players={players} onAdd={onAdd} onRefresh={load} />
            </>
          )}
          {msg && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
