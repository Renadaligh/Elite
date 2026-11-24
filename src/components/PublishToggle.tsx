import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { BInfo } from '../data/bracket';

/** Last thing on the tree page: one switch that sends the tournament to the site (or takes it off). Yellow = waiting for review, green = live, red = rejected with the reason. */
interface Listing { name: string; published: boolean; review?: 'pending' | 'approved' | 'rejected'; reviewNote?: string }
const T = {
  ar: { title: 'نشر البطولة في الموقع', sub: 'تظهر في قسم البطولات بعد موافقة الفريق.', pending: 'بانتظار المراجعة: نراجع بطولتك وسنخبرك عند الموافقة. تقدر توقفها في أي وقت.', ok: 'منشورة في الموقع. تقدر توقفها بالمفتاح وتختفي من الموقع.', rej: 'تم رفض النشر', why: 'السبب', again: 'عدّل المطلوب في «معلومات البطولة» ثم شغّل المفتاح لإعادة الإرسال.', needName: 'اكتب اسم البطولة أولاً', needInfo: 'أكمل «معلومات البطولة» أولاً: تاريخ البداية مطلوب.', fail: 'تعذّر التنفيذ، حاول مرة أخرى.', migrate: 'يجب تشغيل أوامر قاعدة البيانات الجديدة (schema.sql) أولاً.', limit: 'وصلت الحد الأعلى للبطولات المنشورة (10).' },
  en: { title: 'Publish the tournament on the site', sub: 'It shows in the Tournaments section after the team approves it.', pending: 'Waiting for review: we are checking your tournament and will let you know. You can stop it any time.', ok: 'Live on the site. Turn the switch off and it disappears from the site.', rej: 'Publishing was rejected', why: 'Reason', again: 'Fix what was asked in “Tournament info”, then turn the switch on to resubmit.', needName: 'Enter the tournament name first', needInfo: 'Complete “Tournament info” first: the start date is required.', fail: 'Could not do that, try again.', migrate: 'Run the new database statements (schema.sql) first.', limit: 'You reached the limit of published tournaments (10).' },
};
export default function PublishToggle({ id, lang, name, info, cover }: { id: string; lang: 'ar' | 'en'; name: string; info: BInfo | undefined; cover?: string }) {
  const t = T[lang];
  const [l, setL] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const body = (published: boolean) => JSON.stringify({ name: name.trim(), gameId: info?.gameId ?? '', prize: info?.prize ?? '', startsAt: info?.startsAt ?? '', total: info?.total ?? 0, mode: info?.mode ?? 'solo', published });
  const load = () => api<{ listing: Listing | null }>(`/brackets/${id}/listing`).then((r) => { setL(r.listing); setReady(true); }).catch(() => setReady(true));
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  const rejected = l?.review === 'rejected';
  const on = !!l && l.published && !rejected;
  const send = async (published: boolean) => {
    setBusy(true); setMsg('');
    try { const r = await api<{ review?: 'pending' | 'approved' | 'rejected' }>(`/brackets/${id}/listing`, { method: 'PUT', body: body(published) }); setL((o) => ({ name: name.trim(), published, review: r.review ?? o?.review, reviewNote: '' })); }
    catch (e) { const d = (e as Error & { detail?: string }).detail; setMsg(d === 'migrate' ? t.migrate : d === 'limit' ? t.limit : d === 'invalid' ? t.needName : t.fail); }
    setBusy(false);
  };
  const toggle = () => {
    if (busy) return;
    if (on) { void send(false); return; }
    if (!name.trim()) { setMsg(t.needName); return; }
    if (!info?.startsAt) { setMsg(t.needInfo); return; }
    void send(true);
  };
  // details changed while it is published: keep the site copy in step (a new name sends an approved one back to review, like before)
  const last = useRef('');
  useEffect(() => {
    const k = body(true) + (cover ?? '');
    if (!ready || !l || !on || busy) { last.current = k; return undefined; }
    if (last.current === '') { last.current = k; return undefined; }
    if (last.current === k) return undefined;
    const h = window.setTimeout(() => { last.current = k; void send(true); }, 1500);
    return () => window.clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, info?.gameId, info?.prize, info?.startsAt, info?.total, info?.mode, cover, ready, on]);
  if (!ready) return null;
  return (
    <div className="pb-box">
      <div className="st-shh"><div><span style={{ fontWeight: 700 }}>{t.title}</span><small>{t.sub}</small></div>
        <button type="button" role="switch" aria-checked={on} aria-label={t.title} disabled={busy} className={`st-sw ${on ? 'on' : ''}`} onClick={toggle}><i /></button></div>
      {on && l?.review === 'pending' && <div className="pb-st y" role="status">⏳ {t.pending}</div>}
      {on && l?.review !== 'pending' && <div className="pb-st g" role="status">✓ {t.ok}</div>}
      {rejected && <div className="pb-st r" role="status">✕ {t.rej}{l?.reviewNote ? <u><b>{t.why}:</b> {l.reviewNote}</u> : null}<div style={{ marginTop: 6, opacity: .9 }}>{t.again}</div></div>}
      {msg && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{msg}</p>}
    </div>
  );
}
