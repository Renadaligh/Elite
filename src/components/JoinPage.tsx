import { useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { S, ThemeBtn, type Theme } from './BracketStudio';

interface Info { title: string; org: string; mode: 'solo' | 'team'; count: number; cap: number; closesAt: number; reason: '' | 'closed' | 'full' }
type State = 'idle' | 'sending' | 'done' | 'error' | 'dup' | 'dupTeam' | 'dupMembers' | 'required' | 'closed' | 'full';
const key = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const field = 'w-full rounded-xl border bg-transparent px-4 py-3 text-[.95rem] outline-none transition-colors focus:border-[var(--link-on)]';
const fieldStyle = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
const X = {
  ar: { closed: 'التسجيل مغلق.', full: 'اكتمل العدد، التسجيل مغلق.', gone: 'رابط التسجيل غير متاح.', by: 'تنظيم', count: 'المسجّلون', closes: 'يُغلق التسجيل', open: 'التسجيل مفتوح' },
  en: { closed: 'Registration is closed.', full: 'It is full, registration is closed.', gone: 'This registration link is not available.', by: 'By', count: 'Registered', closes: 'Registration closes', open: 'Registration is open' },
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
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState('');
  const [hp, setHp] = useState('');

  useEffect(() => {
    let live = true;
    fetch(`/api/join/${encodeURIComponent(id)}`).then(async (r) => (r.ok ? ((await r.json()) as Info) : 'gone' as const)).then((d) => { if (live) setInfo(d); }).catch(() => { if (live) setInfo('gone'); });
    return () => { live = false; };
  }, [id]);

  const team = info !== null && info !== 'gone' && info.mode === 'team';
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    const pid = platoId.trim();
    if (!pid || (team && (!teamName.trim() || !members.trim()))) { setState('required'); return; }
    if (team) { const all = [pid, ...members.split(/[\n,،;]+/)].map(key).filter(Boolean); if (new Set(all).size !== all.length) { setState('dupMembers'); return; } }
    setState('sending');
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platoId: pid, teamName: teamName.trim(), members: members.trim(), hp }) });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      setState(d.ok ? 'done' : d.error === 'duplicate' ? 'dup' : d.error === 'duplicate_team' ? 'dupTeam' : d.error === 'duplicate_members' ? 'dupMembers' : d.error === 'closed' ? 'closed' : d.error === 'full' ? 'full' : d.error === 'required' ? 'required' : 'error');
    } catch { setState('error'); }
  }
  const msg = state === 'required' ? t.regRequired : state === 'dup' ? t.regDup : state === 'dupTeam' ? t.regDupTeam : state === 'dupMembers' ? t.regDupMembers : state === 'closed' ? x.closed : state === 'full' ? x.full : state === 'error' ? t.regErr : '';
  const closedNow = info && info !== 'gone' ? (info.reason || (state === 'closed' ? 'closed' : state === 'full' ? 'full' : '')) : '';
  const when = info && info !== 'gone' && info.closesAt > Date.now() ? new Date(info.closesAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  return (
    <div className="pv-root" data-st={theme}>
      <div className="pv-top">
        <a href="#/" className="pv-logo" aria-label="Plato AR"><img src={`${import.meta.env.BASE_URL}brand/plato-ar-white.png`} alt="" draggable={false} /></a>
        <div className="pv-tools"><ThemeBtn theme={theme} set={setTheme} s={st} /><LanguageSwitcher /></div>
      </div>
      <div className="jn-wrap">
        {info === null ? <p style={{ color: 'var(--muted)' }}>…</p> : info === 'gone' ? <p className="text-lg">{x.gone}</p> : (
          <div className="jn-card">
            <h1 className="text-[1.6rem] font-extrabold" dir="auto">{info.title}</h1>
            {info.org && <p className="mt-1 font-semibold" style={{ color: 'var(--muted)' }}>{x.by}: <span dir="auto" style={{ color: 'var(--text)' }}>{info.org}</span></p>}
            <p className="jn-stat">
              <span className={`jn-dot ${closedNow ? 'off' : ''}`} />
              <b>{closedNow === 'full' ? x.full : closedNow ? x.closed : x.open}</b>
              <span>· {x.count}: {info.count}{info.cap > 0 ? ` / ${info.cap}` : ''}</span>
            </p>
            {!closedNow && when && <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{x.closes}: {when}</p>}
            {state === 'done' ? (
              <div className="py-8 text-center" role="status">
                <p className="text-[1.5rem] font-extrabold">{t.regDone}</p>
                <p className="mt-2" style={{ color: 'var(--muted)' }}>{t.regDoneSub}</p>
              </div>
            ) : closedNow ? null : (
              <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
                {team && (
                  <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{t.regTeamName}
                    <input className={field} style={fieldStyle} value={teamName} maxLength={80} onChange={(e) => setTeamName(e.target.value)} autoComplete="off" />
                  </label>
                )}
                <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{team ? t.regCaptain : t.regPlatoId}
                  {team && <span className="text-[.8rem] font-normal" style={{ color: 'var(--muted)' }}>{t.regCaptainNote}</span>}
                  <input dir="ltr" className={field} style={fieldStyle} value={platoId} maxLength={80} onChange={(e) => setPlatoId(e.target.value)} autoComplete="off" />
                </label>
                {team && (
                  <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{t.regMembers}
                    <span className="text-[.8rem] font-normal" style={{ color: 'var(--muted)' }}>{t.regMembersNote}</span>
                    <textarea dir="ltr" rows={4} className={field} style={fieldStyle} value={members} maxLength={600} onChange={(e) => setMembers(e.target.value)} />
                  </label>
                )}
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
