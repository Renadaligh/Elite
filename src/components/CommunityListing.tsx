import { useEffect, useState } from 'react';
import StartPicker from './StartPicker';
import { api } from '../services/api';
import { useGames } from '../hooks/useGames';

/** Owner panel in the bracket tool: list this bracket as a public tournament people can register for, and see who registered. */
interface Listing { image?: string; gameId: string; name: string; prize: string; startsAt: string; total: number; filled: number; mode: 'solo' | 'team'; published: boolean; review?: 'pending' | 'approved' | 'rejected'; reviewNote?: string }

const T = {
  ar: {
    title: 'نشر البطولة في الموقع', d: 'تظهر بطولتك في قسم البطولات بالموقع ويسجّل فيها الناس مباشرة. بعد مراجعتها من الإدارة والموافقة عليها تظهر في الموقع.', needShare: 'فعّل «رابط العرض» أولاً حتى تتمكن من نشر البطولة.',
    name: 'اسم البطولة', game: 'اللعبة', pick: 'اختر لعبة', start: 'تاريخ بداية البطولة', slots: 'عدد المقاعد', mailL: 'البريد الإلكتروني للإشعارات (اختياري)', mailHint: 'إن تركته فارغاً فستظهر لك إشعارات القبول والرفض داخل «بطولاتي» فقط.', needMail: 'اكتب بريدك الإلكتروني لتصلك إشعارات قبول البطولة أو رفضها.', badMail: 'البريد الإلكتروني غير صحيح.', imgNote: 'صورة البطولة هي الصورة نفسها التي ترفعها في «رابط التسجيل المستقل» (1280 × 720)، فلا حاجة لرفعها مرتين.', cover: 'صورة البطولة (اختياري)', upload: 'رفع صورة', change: 'تغيير الصورة', rmImg: 'حذف الصورة', imgFail: 'تعذّر رفع الصورة (صورة حتى 3MB: PNG أو JPG أو WebP).', coverHint: 'من غير صورة يظهر لون افتراضي.', limitSeats: 'تحديد عدد المقاعد', unlimited: 'غير محدود', stPending: 'قيد المراجعة: ننتظر موافقة الفريق قبل ظهورها في الموقع.', stApproved: 'مقبولة ومنشورة في الموقع.', stRejected: 'مرفوضة', stRejectedHint: 'عدّل البطولة واضغط «نشر / حفظ» لإعادة إرسالها للمراجعة.', sent: 'أُرسلت للمراجعة', editNote: 'تغيير الاسم أو الصورة فقط يعيدها إلى المراجعة، وباقي التعديلات تُحفظ مباشرة. وتنتهي البطولة تلقائياً عند تحديد الفائز.', mode: 'نوع التسجيل', solo: 'فردي', team: 'فريق', prize: 'الجائزة (اختياري)',
    show: 'ظاهرة في الموقع', save: 'نشر / حفظ', saved: 'تم الحفظ', remove: 'إلغاء النشر', removeAsk: 'تلغي نشر البطولة وتحذف قائمة المسجلين؟', fail: 'تعذّر الحفظ', migrate: 'يجب تشغيل أوامر قاعدة البيانات الجديدة (schema.sql) أولاً.', limit: 'وصلت الحد الأعلى للبطولات المنشورة (10).', bad: 'اكتب الاسم وحدد تاريخ بداية البطولة.',
    regs: 'المسجّلون', none: 'لم يسجّل أحد حتى الآن.', refresh: 'تحديث', del: 'حذف', delAsk: 'حذف هذا التسجيل وإزالة اللاعب من القرعة؟', use: 'إضافة الكل', added: 'مضاف', unadd: 'إزالة من القرعة (التسجيل يبقى)', add: 'إضافة', captain: 'القائد', registered: 'مسجّل', closes: 'التسجيل يقفل عند بداية البطولة.',
  },
  en: {
    title: 'Publish the tournament on the site', d: 'Your tournament shows in the site\'s Tournaments section and people register directly. It appears on the site after the team reviews and approves it.', needShare: 'Turn on "view link" first to publish the tournament.',
    name: 'Tournament name', game: 'Game', pick: 'Choose a game', start: 'Tournament start date', slots: 'Slots', mailL: 'Notification email (optional)', mailHint: 'Leave it empty to get approval/rejection notices inside “My tournaments” only.', needMail: 'Enter your email so the approved / rejected notice can reach you.', badMail: 'That email looks wrong.', imgNote: 'The tournament picture is the same one you upload under the registration link (1280 × 720), no need to upload it twice.', cover: 'Tournament picture (optional)', upload: 'Upload picture', change: 'Change picture', rmImg: 'Remove picture', imgFail: 'Could not upload the picture (up to 3MB: PNG, JPG or WebP).', coverHint: 'Without a picture a default colour is shown.', limitSeats: 'Limit the seats', unlimited: 'Unlimited', stPending: 'Under review: waiting for the team\'s approval before it shows on the site.', stApproved: 'Approved and live on the site.', stRejected: 'Rejected', stRejectedHint: 'Edit the tournament and press "Publish / save" to send it for review again.', sent: 'Sent for review', editNote: 'Only changing the name or the picture sends it back to review; every other change is saved straight away. The tournament ends by itself once a winner is decided.', mode: 'Registration', solo: 'Solo', team: 'Team', prize: 'Prize (optional)',
    show: 'Visible on the site', save: 'Publish / save', saved: 'Saved', remove: 'Unpublish', removeAsk: 'Unpublish the tournament and delete its registrations?', fail: 'Could not save', migrate: 'Run the new database statements (schema.sql) first.', limit: 'You reached the limit of published tournaments (10).', bad: 'Enter a name and the tournament start date.',
    regs: 'Registered', none: 'Nobody registered yet.', refresh: 'Refresh', del: 'Delete', delAsk: 'Delete this registration and remove the player from the bracket?', use: 'Add all', added: 'Added', unadd: 'Remove from the bracket (the registration stays)', add: 'Add', captain: 'Captain', registered: 'registered', closes: 'Registration closes when the tournament starts.',
  },
};

const pad2 = (n: number) => String(n).padStart(2, '0');
/** Typed in the organiser's own time zone, stored as an absolute moment, shown to every visitor in theirs. */
const toInput = (iso: string) => { const d = new Date(iso); return !iso || Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fromInput = (v: string) => { const d = new Date(v); return v && !Number.isNaN(d.getTime()) ? d.toISOString() : ''; };
const empty = (): Listing => ({ gameId: '', name: '', prize: '', startsAt: '', total: 0, filled: 0, mode: 'solo', published: true });
const fld = 'w-full rounded-xl border bg-transparent px-3 py-2 text-[.9rem] outline-none focus:border-[#3d7bff]';

export default function CommunityListing({ id, share, lang, title }: { id: string; share: boolean; lang: 'ar' | 'en'; title: string }) {
  const t = T[lang];
  const games = useGames();
  const [f, setF] = useState<Listing>(empty());
  const [listed, setListed] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };

  useEffect(() => {
    api<{ listing: Listing | null; migrate?: boolean}>(`/brackets/${id}/listing`)
      .then((r) => { if (r.migrate) setMsg(t.migrate); if (r.listing) { setF(r.listing); setListed(true); } else setF((o) => ({ ...o, name: o.name || title })); })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { if (!f.name && title) setF((o) => (o.name ? o : { ...o, name: title })); }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!f.name.trim() || !f.startsAt) { setMsg(t.bad); return; }
    setBusy(true); setMsg('');
    try { const r = await api<{ review?: 'pending' | 'approved' | 'rejected' }>(`/brackets/${id}/listing`, { method: 'PUT', body: JSON.stringify(f) }); setListed(true); setF((o) => ({ ...o, review: r.review ?? o.review, reviewNote: '' })); setMsg(r.review === 'pending' ? t.sent : t.saved); }
    catch (e) { const d = (e as Error & { detail?: string }).detail; setMsg(d === 'migrate' ? t.migrate : d === 'limit' ? t.limit : d === 'invalid' ? t.bad : d === 'email_required' ? t.needMail : d === 'email_invalid' ? t.badMail : t.fail); }
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm(t.removeAsk)) return;
    try { await api(`/brackets/${id}/listing`, { method: 'DELETE' }); setListed(false); setF({ ...empty(), name: title }); setMsg(''); } catch { setMsg(t.fail); }
  }

  return (
    <div className="st-share" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      <button type="button" className="flex w-full items-center justify-between gap-3 text-start" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <b>{t.title}</b>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <p className="st-shn" style={{ marginTop: 4 }}>{t.d}</p>
      {listed && f.review && (
        <div className="mt-2 rounded-xl border px-3 py-2 text-[.86rem] font-semibold" style={{ borderColor: f.review === 'approved' ? 'rgba(46,204,140,.5)' : f.review === 'rejected' ? 'rgba(255,77,94,.5)' : 'rgba(255,176,46,.5)', color: f.review === 'approved' ? '#2ecc8c' : f.review === 'rejected' ? '#ff6b7a' : '#ffb02e' }}>
          {f.review === 'pending' ? t.stPending : f.review === 'approved' ? t.stApproved : <>{t.stRejected}{f.reviewNote ? `: ${f.reviewNote}` : ''}<div style={{ fontWeight: 500, marginTop: 2 }}>{t.stRejectedHint}</div></>}
        </div>
      )}
      {!open ? null : !share ? <p className="st-shn">{t.needShare}</p> : (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.name}<input className={fld} style={bd} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.game}<select className={fld} style={bd} value={f.gameId} onChange={(e) => setF({ ...f, gameId: e.target.value })}><option value="">{t.pick}</option>{games.map((g) => <option key={g.id} value={g.id}>{g.name[lang]}</option>)}</select></label>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.start}<StartPicker lang={lang} inpCls={`${fld} dt-in`} selCls={fld} style={bd} value={toInput(f.startsAt)} onChange={(v) => setF({ ...f, startsAt: fromInput(v) })} /></label>
            <div className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.slots}
              <div className="flex items-center gap-3" style={{ minHeight: 42 }}>
                <button type="button" role="switch" aria-checked={f.total > 0} aria-label={t.limitSeats} className={`st-sw ${f.total > 0 ? 'on' : ''}`} onClick={() => setF({ ...f, total: f.total > 0 ? 0 : 16 })}><i /></button>
                {f.total > 0 ? <input type="number" min={2} max={4096} className={fld} style={bd} value={f.total} onChange={(e) => setF({ ...f, total: Math.max(2, Math.min(4096, +e.target.value || 2)) })} /> : <span>{t.unlimited} ∞</span>}
              </div>
            </div>
            <label className="grid gap-1 text-[.82rem]" style={{ color: 'var(--muted)' }}>{t.mode}<select className={fld} style={bd} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as 'solo' | 'team' })}><option value="solo">{t.solo}</option><option value="team">{t.team}</option></select></label>
            <p className="text-[.8rem] sm:col-span-2" style={{ color: 'var(--muted)' }}>{t.imgNote}</p>
            <label className="grid gap-1 text-[.82rem] sm:col-span-2" style={{ color: 'var(--muted)' }}>{t.prize}<input className={fld} style={bd} maxLength={80} value={f.prize} onChange={(e) => setF({ ...f, prize: e.target.value })} /></label>
          </div>
          <div className="st-shh"><div><span>{t.show}</span><small>{t.closes} {t.editNote}</small></div><button type="button" role="switch" aria-checked={f.published} aria-label={t.show} className={`st-sw ${f.published ? 'on' : ''}`} onClick={() => setF({ ...f, published: !f.published })}><i /></button></div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border px-5 py-2 text-[.85rem] font-bold disabled:opacity-60" style={{ background: 'rgba(61,123,255,.2)', borderColor: 'rgba(143,178,255,.55)', color: 'var(--text)' }} disabled={busy} onClick={save}>{t.save}</button>
            {listed && <button type="button" className="rounded-full border px-4 py-2 text-[.85rem] font-semibold" style={{ borderColor: 'var(--glass-b)', color: '#ff7a8a' }} onClick={remove}>{t.remove}</button>}
            {msg && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }}>{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
