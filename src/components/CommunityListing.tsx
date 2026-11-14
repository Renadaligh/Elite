import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useGames } from '../hooks/useGames';

/** Owner panel in the bracket tool: list this bracket as a public tournament people can register for, and see who registered. */
interface Listing { gameId: string; name: string; prize: string; startsAt: string; endsAt: string; total: number; filled: number; mode: 'solo' | 'team'; published: boolean }
interface Reg { id: number; mode: string; plato_id: string; team_name: string; members: string; created_at: string }

const T = {
  ar: {
    title: 'نشر كبطولة للتسجيل', d: 'تظهر بطولتك في قسم البطولات بالموقع ويسجّل فيها الناس مباشرة، وتشوف المسجلين هنا.', needShare: 'فعّل «رابط العرض» أولاً حتى تقدر تنشر البطولة.',
    name: 'اسم البطولة', game: 'اللعبة', pick: 'اختر لعبة', start: 'البداية (توقيت الرياض)', end: 'النهاية (توقيت الرياض)', slots: 'عدد المقاعد', mode: 'نوع التسجيل', solo: 'فردي', team: 'فريق', prize: 'الجائزة (اختياري)',
    show: 'ظاهرة في الموقع', save: 'نشر / حفظ', saved: 'تم الحفظ', remove: 'إلغاء النشر', removeAsk: 'تلغي نشر البطولة وتحذف قائمة المسجلين؟', fail: 'تعذّر الحفظ', migrate: 'لازم تشغّل أوامر قاعدة البيانات الجديدة (schema.sql) أولاً.', limit: 'وصلت الحد الأعلى للبطولات المنشورة (10).', bad: 'اكتب الاسم وحدد تواريخ صحيحة (النهاية بعد البداية).',
    regs: 'المسجّلون', none: 'ما سجّل أحد للحين.', refresh: 'تحديث', del: 'حذف', delAsk: 'حذف هذا التسجيل؟', use: 'أضفهم للبراكت', useAsk: 'يضيف المسجلين لقائمة اللاعبين ويعيد بناء البراكت (تُمسح النتائج الحالية، وتقدر ترجع بزر «تراجع»). متأكد؟', captain: 'القائد', registered: 'مسجّل', closes: 'التسجيل يقفل عند بداية البطولة.',
  },
  en: {
    title: 'Publish as a tournament', d: 'Your tournament shows in the site\'s Tournaments section, people register directly, and you see them here.', needShare: 'Turn on "view link" first to publish the tournament.',
    name: 'Tournament name', game: 'Game', pick: 'Choose a game', start: 'Start (Riyadh time)', end: 'End (Riyadh time)', slots: 'Slots', mode: 'Registration', solo: 'Solo', team: 'Team', prize: 'Prize (optional)',
    show: 'Visible on the site', save: 'Publish / save', saved: 'Saved', remove: 'Unpublish', removeAsk: 'Unpublish the tournament and delete its registrations?', fail: 'Could not save', migrate: 'Run the new database statements (schema.sql) first.', limit: 'You reached the limit of published tournaments (10).', bad: 'Enter a name and valid dates (end after start).',
    regs: 'Registered', none: 'Nobody registered yet.', refresh: 'Refresh', del: 'Delete', delAsk: 'Delete this registration?', use: 'Add them to the bracket', useAsk: 'Adds the registrants to the player list and rebuilds the bracket (current results are cleared; Undo brings them back). Sure?', captain: 'Captain', registered: 'registered', closes: 'Registration closes when the tournament starts.',
  },
};

const toInput = (iso: string) => { if (!iso) return ''; if (/\+03:00$/.test(iso)) return iso.slice(0, 16); const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('sv-SE', { timeZone: 'Asia/Riyadh' }).replace(' ', 'T').slice(0, 16); };
const fromInput = (v: string) => (v ? `${v}:00+03:00` : '');
const empty = (): Listing => ({ gameId: '', name: '', prize: '', startsAt: '', endsAt: '', total: 16, filled: 0, mode: 'solo', published: true });
const fld = 'w-full rounded-xl border bg-transparent px-3 py-2 text-[.9rem] outline-none focus:border-[#3d7bff]';

export default function CommunityListing({ id, share, lang, title, onUse }: { id: string; share: boolean; lang: 'ar' | 'en'; title: string; onUse: (names: string[], ask: string) => void }) {
  const t = T[lang];
  const games = useGames();
  const [f, setF] = useState<Listing>(empty());
  const [listed, setListed] = useState(false);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };

  const loadRegs = useCallback(() => { api<Reg[]>(`/brackets/${id}/regs`).then(setRegs).catch(() => undefined); }, [id]);
  useEffect(() => {
    api<{ listing: Listing | null; migrate?: boolean }>(`/brackets/${id}/listing`)
      .then((r) => { if (r.migrate) setMsg(t.migrate); if (r.listing) { setF(r.listing); setListed(true); loadRegs(); } else setF((o) => ({ ...o, name: o.name || title })); })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { if (!f.name && title) setF((o) => (o.name ? o : { ...o, name: title })); }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!f.name.trim() || !f.startsAt || (f.endsAt && Date.parse(f.endsAt) < Date.parse(f.startsAt))) { setMsg(t.bad); return; }
    setBusy(true); setMsg('');
    try { await api(`/brackets/${id}/listing`, { method: 'PUT', body: JSON.stringify({ ...f, endsAt: f.endsAt || f.startsAt }) }); setListed(true); setMsg(t.saved); loadRegs(); }
    catch (e) { const d = (e as Error & { detail?: string }).detail; setMsg(d === 'migrate' ? t.migrate : d === 'limit' ? t.limit : d === 'invalid' ? t.bad : t.fail); }
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm(t.removeAsk)) return;
    try { await api(`/brackets/${id}/listing`, { method: 'DELETE' }); setListed(false); setRegs([]); setF({ ...empty(), name: title }); setMsg(''); } catch { setMsg(t.fail); }
  }
  async function delReg(r: Reg) {
    if (!window.confirm(t.delAsk)) return;
    try { await api(`/brackets/${id}/regs?rid=${r.id}`, { method: 'DELETE' }); setRegs((l) => l.filter((x) => x.id !== r.id)); setF((o) => ({ ...o, filled: Math.max(0, o.filled - 1) })); } catch { setMsg(t.fail); }
  }
  const names = regs.map((r) => (r.mode === 'team' ? r.team_name : r.plato_id).trim()).filter(Boolean);

  return (
    <div className="st-share" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      <b>{t.title}</b>
      <p className="st-shn" style={{ marginTop: 4 }}>{t.d}</p>
      {!share ? <p className="st-shn">{t.needShare}</p> : (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.name}<input className={fld} style={bd} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.game}<select className={fld} style={bd} value={f.gameId} onChange={(e) => setF({ ...f, gameId: e.target.value })}><option value="">{t.pick}</option>{games.map((g) => <option key={g.id} value={g.id}>{g.name[lang]}</option>)}</select></label>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.start}<input type="datetime-local" dir="ltr" className={`${fld} dt-in`} style={bd} value={toInput(f.startsAt)} onChange={(e) => setF({ ...f, startsAt: fromInput(e.target.value) })} /></label>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.end}<input type="datetime-local" dir="ltr" className={`${fld} dt-in`} style={bd} value={toInput(f.endsAt)} onChange={(e) => setF({ ...f, endsAt: fromInput(e.target.value) })} /></label>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.slots}<input type="number" min={2} max={512} className={fld} style={bd} value={f.total} onChange={(e) => setF({ ...f, total: Math.max(2, Math.min(512, +e.target.value || 2)) })} /></label>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.mode}<select className={fld} style={bd} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as 'solo' | 'team' })}><option value="solo">{t.solo}</option><option value="team">{t.team}</option></select></label>
            <label className="grid gap-1 text-[.82rem] sm:col-span-2" style={{ color: 'var(--muted)' }}>{t.prize}<input className={fld} style={bd} maxLength={80} value={f.prize} onChange={(e) => setF({ ...f, prize: e.target.value })} /></label>
          </div>
          <div className="st-shh"><div><span>{t.show}</span><small>{t.closes}</small></div><button type="button" role="switch" aria-checked={f.published} aria-label={t.show} className={`st-sw ${f.published ? 'on' : ''}`} onClick={() => setF({ ...f, published: !f.published })}><i /></button></div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border px-5 py-2 text-[.85rem] font-bold disabled:opacity-60" style={{ background: 'rgba(61,123,255,.2)', borderColor: 'rgba(143,178,255,.55)', color: 'var(--text)' }} disabled={busy} onClick={save}>{t.save}</button>
            {listed && <button type="button" className="rounded-full border px-4 py-2 text-[.85rem] font-semibold" style={{ borderColor: 'var(--glass-b)', color: '#ff7a8a' }} onClick={remove}>{t.remove}</button>}
            {msg && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }}>{msg}</span>}
          </div>
          {listed && (
            <div className="st-shr">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span style={{ fontWeight: 700, fontSize: '.92rem' }}>{t.regs} · {f.filled}/{f.total}</span>
                <span className="flex gap-2">
                  <button type="button" className="cl-btn" onClick={loadRegs}>{t.refresh}</button>
                  {names.length > 0 && <button type="button" className="cl-btn on" onClick={() => onUse(names, t.useAsk)}>{t.use}</button>}
                </span>
              </div>
              {regs.length === 0 ? <p className="st-shn">{t.none}</p> : (
                <ul className="grid gap-1.5">
                  {regs.map((r, i) => (
                    <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-[.88rem]" style={{ borderColor: 'var(--glass-b)' }}>
                      <div className="min-w-0"><b dir="auto">{i + 1}. {r.mode === 'team' ? r.team_name : r.plato_id}</b>{r.mode === 'team' && <div dir="auto" style={{ color: 'var(--muted)', fontSize: '.8rem', whiteSpace: 'pre-wrap' }}>{t.captain}: {r.plato_id}{r.members ? `\n${r.members}` : ''}</div>}</div>
                      <button type="button" className="shrink-0 text-[.78rem]" style={{ color: '#ff7a8a' }} onClick={() => delReg(r)}>{t.del}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
