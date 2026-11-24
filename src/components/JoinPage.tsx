import { linkify } from './linkify';
import { ChipInput } from './ChipInput';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { S, ThemeBtn, type Theme } from './BracketStudio';
import { tintVars, useCoverHue } from '../data/regTheme';
import { FormFields, missingQ, type Answers, type FormQ, type RegFormData } from './RegForm';

interface Info { showCount?: boolean; titleEn?: string; description?: string; descriptionEn?: string; doneMsg?: string; doneMsgEn?: string; cover?: string; startsAt?: string; title: string; org: string; form?: RegFormData; mode: 'solo' | 'team'; count: number; cap: number; closesAt: number; reason: '' | 'closed' | 'full' }
type State = 'idle' | 'sending' | 'done' | 'error' | 'dup' | 'dupTeam' | 'dupMembers' | 'required' | 'badId' | 'closed' | 'full' | 'requiredQ';
const okId = (s: string) => /^[A-Za-z0-9_]+$/.test(s);
const okIds = (l: string) => l.split(/[\n,،;]+/).map((v) => v.trim()).filter(Boolean).every(okId);
const key = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const field = 'w-full rounded-xl border bg-transparent px-4 py-3 text-[.95rem] outline-none transition-colors focus:border-[var(--link-on)]';
const fieldStyle = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
const X = {
  ar: { closed: 'التسجيل مغلق.', full: 'اكتمل العدد، التسجيل مغلق.', gone: 'رابط التسجيل غير متاح.', by: 'تنظيم', starts: 'تاريخ بداية البطولة', another: 'تسجيل لاعب آخر', anotherTeam: 'تسجيل فريق آخر', count: 'المسجّلون', closes: 'يُغلق التسجيل', open: 'التسجيل مفتوح', reqQ: 'عبّئ الأسئلة المطلوبة.' },
  en: { closed: 'Registration is closed.', full: 'It is full, registration is closed.', gone: 'This registration link is not available.', by: 'By', starts: 'Tournament start date', another: 'Register another user', anotherTeam: 'Register another team', count: 'Registered', closes: 'Registration closes', open: 'Registration is open', reqQ: 'Fill in the required questions.' },
};

/** Standalone registration page of a bracket (#/join/<id>): same form as the site's, shows only the count and the status. */
export default function JoinPage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const x = X[lang === 'en' ? 'en' : 'ar'];
  const st = S[lang === 'ar' ? 'ar' : 'en'];
  const [theme, setTheme] = useState<Theme>(() => { try { return localStorage.getItem('elite-pv-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } });
  useEffect(() => { try { localStorage.setItem('elite-pv-theme', theme); } catch { /* private mode */ } }, [theme]);
  const [info, setInfo] = useState<Info | null | 'gone'>(null);
  const [state, setState] = useState<State>('idle');
  const [platoId, setPlatoId] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [hp, setHp] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [badQ, setBadQ] = useState('');

  useEffect(() => {
    let live = true;
    fetch(`/api/join/${encodeURIComponent(id)}`).then(async (r) => (r.ok ? ((await r.json()) as Info) : 'gone' as const)).then((d) => { if (live) setInfo(d); }).catch(() => { if (live) setInfo('gone'); });
    // keep the "registered" count (and open/closed) fresh while the page stays open
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      fetch(`/api/join/${encodeURIComponent(id)}`).then(async (r) => { if (live && r.ok) setInfo((await r.json()) as Info); }).catch(() => undefined);
    };
    const t = window.setInterval(refresh, 20000);
    document.addEventListener('visibilitychange', refresh);
    return () => { live = false; window.clearInterval(t); document.removeEventListener('visibilitychange', refresh); };
  }, [id]);

  const coverHue = useCoverHue(info && info !== 'gone' ? info.cover : undefined);
  const chosen = info && info !== 'gone' ? info.form?.hue : null; // a colour the organiser picked wins over the picture's
  const hue = typeof chosen === 'number' ? chosen : coverHue;
  const tint = hue === null ? undefined : tintVars(hue, theme);
  const team = info !== null && info !== 'gone' && info.mode === 'team';
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    const pid = team ? (ids[0] ?? '') : platoId.trim();
    const members = team ? ids.slice(1).join(', ') : '';
    if (!pid || (team && !members.trim())) { setState('required'); return; }
    const qs = info !== null && info !== 'gone' ? info.form?.qs ?? [] : [];
    const miss = missingQ(qs, answers);
    if (miss) { setBadQ(miss); setState('requiredQ'); return; }
    setBadQ('');
    if (!okId(pid) || (team && !okIds(members))) { setState('badId'); return; }
    if (team) { const all = [pid, ...members.split(/[\n,،;]+/)].map(key).filter(Boolean); if (new Set(all).size !== all.length) { setState('dupMembers'); return; } }
    setState('sending');
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platoId: pid, teamName: '', members: members.trim(), hp, answers }) });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (d.ok || d.error === 'full' || d.error === 'closed') fetch(`/api/join/${encodeURIComponent(id)}`).then(async (r) => { if (r.ok) setInfo((await r.json()) as Info); }).catch(() => undefined); // count / state right after sending
      setState(d.ok ? 'done' : d.error === 'duplicate' ? 'dup' : d.error === 'duplicate_team' ? 'dupTeam' : d.error === 'duplicate_members' ? 'dupMembers' : d.error === 'closed' ? 'closed' : d.error === 'full' ? 'full' : d.error === 'bad_id' ? 'badId' : d.error === 'required' ? 'required' : d.error === 'required_q' ? 'requiredQ' : 'error');
    } catch { setState('error'); }
  }
  const msg = state === 'requiredQ' ? x.reqQ : state === 'required' ? (team ? t.regRequiredTeam : t.regRequired) : state === 'badId' ? t.regBadId : state === 'dup' ? t.regDup : state === 'dupTeam' ? t.regDupTeam : state === 'dupMembers' ? t.regDupMembers : state === 'closed' ? x.closed : state === 'full' ? x.full : state === 'error' ? t.regErr : '';
  const closedNow = info && info !== 'gone' ? (info.reason || (state === 'closed' ? 'closed' : state === 'full' ? 'full' : '')) : '';
  const when = info && info !== 'gone' && info.closesAt > Date.now() ? new Date(info.closesAt).toLocaleString(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  return (
    <div className="pv-root" data-st={theme} data-jn={hue === null ? undefined : ''} style={tint}>
      <div className="pv-top" style={hue === null ? undefined : { background: 'var(--bg)' }}>
        <a href="/" className="pv-logo" aria-label="Plato AR"><img src={`${import.meta.env.BASE_URL}brand/plato-ar-white.png`} alt="" draggable={false} /></a>
        <div className="pv-tools"><ThemeBtn theme={theme} set={setTheme} s={st} /><LanguageSwitcher /></div>
      </div>
      <div className="jn-wrap">
        {info === null ? <p style={{ color: 'var(--muted)' }}>…</p> : info === 'gone' ? <p className="text-lg">{x.gone}</p> : (
          <div className="jn-card">
            {info.cover && <img className="jn-cover" src={info.cover} alt="" draggable={false} />}
            <h1 className="text-[1.6rem] font-extrabold" dir="auto">{lang === 'en' && info.titleEn ? info.titleEn : info.title}</h1>
            {info.org && <p className="mt-1 font-semibold" style={{ color: 'var(--muted)' }}>{x.by}: <span dir="auto" style={{ color: 'var(--text)' }}>{info.org}</span></p>}
            <p className="jn-stat">
              <span className={`jn-dot ${closedNow ? 'off' : ''}`} />
              <b>{closedNow === 'full' ? x.full : closedNow ? x.closed : x.open}</b>
              {info.showCount !== false && <span>· {x.count}: {info.count}{info.cap > 0 ? ` / ${info.cap}` : ''}</span>}
            </p>
            {info.startsAt && !Number.isNaN(Date.parse(info.startsAt)) && <p className="mt-1 text-[.9rem] font-semibold" style={{ color: 'var(--muted)' }}>{x.starts}: <span style={{ color: 'var(--text)' }}>{new Date(info.startsAt).toLocaleString(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></p>}
            {(lang === 'en' ? info.descriptionEn || info.description : info.description || info.descriptionEn) && <div className="mt-3 text-[.92rem] leading-relaxed" style={{ color: 'var(--text)' }}>{((lang === 'en' ? info.descriptionEn || info.description : info.description || info.descriptionEn) ?? '').split(/\r?\n/).map((ln, i) => (ln.trim() ? <p key={i} dir="auto" style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}>{ln}</p> : <div key={i} className="h-2" />))}</div>}
            {!closedNow && when && <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{x.closes}: {when}</p>}
            {state === 'done' ? (
              <div className="py-8 text-center" role="status">
                {(lang === 'en' ? info.doneMsgEn || info.doneMsg : info.doneMsg || info.doneMsgEn) ? (
                  <div className="text-[1.05rem] font-semibold leading-relaxed">{((lang === 'en' ? info.doneMsgEn || info.doneMsg : info.doneMsg || info.doneMsgEn) ?? '').split(/\r?\n/).map((ln, i) => (ln.trim() ? <p key={i} dir="auto" style={{ unicodeBidi: 'plaintext', textAlign: 'center' }}>{linkify(ln)}</p> : <div key={i} className="h-2" />))}</div>
                ) : (
                  <>
                    <p className="text-[1.5rem] font-extrabold">{t.regDone}</p>
                    <p className="mt-2" style={{ color: 'var(--muted)' }}>{t.regDoneSub}</p>
                  </>
                )}
                <button type="button" className="mt-6 inline-flex h-11 items-center justify-center rounded-full border px-6 text-[.95rem] font-bold" style={{ borderColor: 'var(--glass-b)', background: 'var(--glass)', color: 'var(--text)' }} onClick={() => { setPlatoId('');  setIds([]); setAnswers({}); setBadQ(''); setState('idle'); }}>{team ? x.anotherTeam : x.another}</button>
              </div>
            ) : closedNow ? null : (
              <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
              {!team && (
                <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{(info.form?.idl?.trim() || t.regPlatoId)} <span style={{ color: '#ff6b7a' }}>*</span>
                  <input dir="ltr" className={field} style={fieldStyle} value={platoId} maxLength={80} onChange={(e) => setPlatoId(e.target.value)} autoComplete="off" />
                </label>
              )}
              {team && (
                <div className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{(info.form?.idl?.trim() || t.regTeamIds)} <span style={{ color: '#ff6b7a' }}>*</span>
                  <ChipInput dir="ltr" className={`${field} focus-within:border-[var(--link-on)]`} style={fieldStyle} value={ids} onChange={setIds} maxLen={40} maxChips={20} placeholder={t.regIdsPh} ariaLabel={t.regTeamIds} bad={(c) => !okId(c)} />
                </div>
              )}
                <FormFields qs={info.form?.qs ?? []} value={answers} onChange={(a) => { setAnswers(a); setBadQ(''); }} bad={badQ} />
                <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: 'absolute', insetInlineStart: '-9999px', width: 1, height: 1, opacity: 0 }} />
                {msg && <p role="alert" className="text-[.9rem]" style={{ color: '#ff6b7a' }}>{msg}</p>}
                <button type="submit" className="btn-primary self-start" disabled={state === 'sending'}>{state === 'sending' ? t.regSending : t.regSubmit}</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
