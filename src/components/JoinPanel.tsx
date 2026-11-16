import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { RegistrantsPanel, autoAddNew, type RegRow } from './AddPlayers';

interface Cfg { cover?: string; startsAt?: string; enabled: boolean; mode: 'solo' | 'team'; cap: number; closesAt: number; closed: boolean; reason: '' | 'closed' | 'full'; count: number; signups: RegRow[] }
const T = {
  ar: { title: 'رابط التسجيل المستقل', desc: 'صفحة تسجيل فقط، تنسخ رابطها وتنشره بنفسك. اللي يسجّل يوصلك هنا، ولا أحد يشوف الأسماء أو البراكت.', on: 'تفعيل رابط التسجيل', link: 'الرابط', copy: 'نسخ', copied: 'تم النسخ', solo: 'فردي', team: 'فرق', mode: 'نوع التسجيل', cap: 'الحد الأقصى للمسجلين (اختياري)', capPh: 'بدون حد', auto: 'إغلاق تلقائي في وقت محدد', now: 'إغلاق التسجيل الآن', reopen: 'إعادة فتح التسجيل', open: 'مفتوح', closed: 'مغلق', full: 'مكتمل', count: 'المسجّلون', fail: 'تعذّر الحفظ.', migrate: 'نفّذ أوامر SQL الخاصة برابط التسجيل في D1 أولاً.', saveT: 'حفظ', start: 'تاريخ بداية البطولة', cover: 'صورة البطولة (اختياري)', coverSize: 'ارفع صورة بقياس 1280 × 720 بكسل (نسبة 16:9)، بصيغة PNG أو JPG أو WebP وحجم أقصى 3MB. نفس الصورة تظهر في صفحة التسجيل وفي بطاقة البطولة بالموقع إذا نشرتها، وأي قياس ثاني يُقص من الأطراف.', upload: 'رفع صورة', change: 'تغيير الصورة', rmImg: 'حذف الصورة', imgFail: 'تعذّر رفع الصورة (حتى 3MB: PNG أو JPG أو WebP).' },
  en: { title: 'Standalone registration link', desc: 'A registration-only page: copy its link and share it yourself. Sign-ups arrive here; nobody sees the names or the bracket.', on: 'Enable the registration link', link: 'Link', copy: 'Copy', copied: 'Copied', solo: 'Solo', team: 'Teams', mode: 'Registration type', cap: 'Maximum registrants (optional)', capPh: 'No limit', auto: 'Close automatically at a set time', now: 'Close registration now', reopen: 'Reopen registration', open: 'Open', closed: 'Closed', full: 'Full', count: 'Registered', fail: 'Could not save.', migrate: 'Run the registration-link SQL in D1 first.', saveT: 'Save', start: 'Tournament start date', cover: 'Tournament picture (optional)', coverSize: 'Upload a 1280 × 720 px picture (16:9), PNG, JPG or WebP, up to 3MB. The same picture shows on the registration page and on the tournament card on the site if you publish it; any other size is cropped at the edges.', upload: 'Upload picture', change: 'Change picture', rmImg: 'Remove picture', imgFail: 'Could not upload the picture (up to 3MB: PNG, JPG or WebP).' },
};
const pad2 = (n: number) => String(n).padStart(2, '0');
/** epoch ms ↔ <input type=datetime-local>, in the organiser's own time zone */
const toLocal = (ms: number) => { if (!(ms > 0)) return ''; const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const isoDate = (iso?: string) => { const d = new Date(iso ?? ''); return !iso || Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const fromLocal = (v: string) => { const t = new Date(`${v}T23:59:59`).getTime(); return Number.isNaN(t) ? 0 : t; };

/** Organiser panel for the registration link (#/join/<id>): on/off, solo/team, cap, auto/manual close, and the people who signed up. */
export default function JoinPanel({ id, lang, link, players, onAdd, onUnadd, auto }: { id: string; lang: 'ar' | 'en'; link: string; players: string[]; onAdd: (names: string[]) => void; onUnadd?: (name: string) => void; auto?: boolean }) {
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
  // sign-ups go straight into the bracket
  useEffect(() => { if (auto && c?.enabled) autoAddNew(id, 'join', c.signups, players, onAdd); }, [c, auto]); // eslint-disable-line react-hooks/exhaustive-deps
  async function pickCover(file?: File | null) {
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch(`/api/brackets/${id}/image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { url: string };
      await put({ cover: j.url });
    } catch { setMsg(t.imgFail); }
  }
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
            <div className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.cover}
              <div className="flex flex-wrap items-center gap-3">
                {c.cover ? <img src={c.cover} alt="" className="aspect-video w-44 max-w-full rounded-lg object-cover" /> : <span className="flex aspect-video w-44 max-w-full items-center justify-center rounded-lg text-[.72rem]" style={{ background: 'var(--chip-bg)' }}>1280 × 720</span>}
                <label className="cl-btn on cursor-pointer">{c.cover ? t.change : t.upload}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { void pickCover(e.target.files?.[0]); e.target.value = ''; }} /></label>
                {c.cover && <button type="button" className="cl-btn" style={{ color: '#ff7a8a' }} onClick={() => put({ cover: '' })}>{t.rmImg}</button>}
              </div>
              <small>{t.coverSize}</small>
            </div>
          {c.enabled && (
            <>
              <div className="st-shl"><input readOnly dir="ltr" aria-label={t.link} value={link} onFocus={(e) => e.currentTarget.select()} /><button type="button" onClick={copy}>{copied ? t.copied : t.copy}</button></div>
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t.mode}>
                <span className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.mode}</span>
                {(['solo', 'team'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={c.mode === m} className={`br-chip ${c.mode === m ? 'on' : ''}`} onClick={() => put({ mode: m })}>{m === 'solo' ? t.solo : t.team}</button>)}
              </div>
              <label className="grid gap-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.start}
                <input type="date" className={line} style={bd} dir="ltr" value={isoDate(c.startsAt)} onChange={(e) => { const v = e.target.value; void put({ startsAt: v ? new Date(`${v}T00:00:00`).toISOString() : '' }); }} />
              </label>
              <label className="grid gap-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.cap}
                <input className={line} style={bd} dir="ltr" inputMode="numeric" maxLength={4} placeholder={t.capPh} value={cap} onChange={(e) => setCap(e.target.value.replace(/[^0-9]/g, ''))} onBlur={() => put({ cap: cap ? Number(cap) : 0 })} />
              </label>
              <div className="grid gap-1.5">
                <div className="st-shh"><div><span>{t.auto}</span></div>
                  <button type="button" role="switch" aria-checked={c.closesAt > 0} aria-label={t.auto} className={`st-sw ${c.closesAt > 0 ? 'on' : ''}`} onClick={() => put({ closesAt: c.closesAt > 0 ? 0 : Date.now() + 24 * 3600_000 })}><i /></button></div>
                {c.closesAt > 0 && <input type="date" className={line} style={bd} dir="ltr" value={when} onChange={(e) => setWhen(e.target.value)} onBlur={() => { const v = fromLocal(when); if (v > 0) void put({ closesAt: v }); }} />}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[.9rem] font-bold">{status} · {t.count}: {c.count}{c.cap > 0 ? ` / ${c.cap}` : ''}</span>
                <button type="button" className="rounded-full border px-3.5 py-1.5 text-[.82rem] font-bold" style={bd} onClick={() => put({ closed: !c.closed })}>{c.closed ? t.reopen : t.now}</button>
              </div>
              <RegistrantsPanel lang={lang} regs={c.signups} players={players} onAdd={onAdd} onUnadd={onUnadd} onRefresh={load} onDelete={(r) => { void api(`/brackets/${id}/join?rid=${r.id}`, { method: 'DELETE' }).then(load).catch(() => setMsg(t.fail)); }} />
            </>
          )}
          {msg && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
