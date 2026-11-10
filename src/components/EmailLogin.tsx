import { useState, type FormEvent } from 'react';
import { api } from '../services/api';

const T = {
  ar: { ph: 'بريدك الإلكتروني', go: 'أرسل لي رابط الدخول', hint: 'بدون كلمة مرور: نرسل لك رابطاً يسجّل دخولك، وتبقى مسجّلاً 30 يوماً على هذا الجهاز.', sent: 'أرسلنا لك رابط الدخول. افتح بريدك (صالح 15 دقيقة ويعمل مرة واحدة). ولو ما وصلك تفقّد مجلد الرسائل غير المرغوبة (Spam).', bad: 'اكتب بريداً صحيحاً', fail: 'تعذّر الإرسال، جرّب بعد قليل', again: 'إرسال لبريد آخر' },
  en: { ph: 'Your email', go: 'Email me a sign-in link', hint: 'No password: we email you a link that signs you in, and you stay signed in for 30 days on this device.', sent: 'We sent you a sign-in link. Open your inbox (valid 15 minutes, works once). If it did not arrive, check your spam folder.', bad: 'Enter a valid email', fail: 'Could not send, try again shortly', again: 'Use another email' },
} as const;

/** Passwordless sign-in: asks for an email and sends a one-time link. */
export default function EmailLogin({ lang, className = '' }: { lang: 'ar' | 'en'; className?: string }) {
  const t = T[lang];
  const [v, setV] = useState('');
  const [st, setSt] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [err, setErr] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) { setErr(t.bad); return; }
    setErr(''); setSt('busy');
    try { await api('/auth/email', { method: 'POST', body: JSON.stringify({ email: v.trim(), lang }) }); setSt('sent'); }
    catch { setErr(t.fail); setSt('idle'); }
  }
  if (st === 'sent') return <div className={`st-mail ${className}`}><p className="st-ok" role="status">{t.sent}</p><button type="button" className="st-lnk" onClick={() => { setSt('idle'); setV(''); }}>{t.again}</button></div>;
  return (
    <form className={`st-mail ${className}`} onSubmit={submit} noValidate>
      <input type="email" dir="ltr" autoComplete="email" inputMode="email" placeholder={t.ph} value={v} onChange={(e) => setV(e.target.value)} maxLength={120} aria-label={t.ph} />
      <button type="submit" disabled={st === 'busy'}>{st === 'busy' ? '…' : t.go}</button>
      {err ? <p className="st-err" role="alert">{err}</p> : <p className="st-hint">{t.hint}</p>}
    </form>
  );
}
