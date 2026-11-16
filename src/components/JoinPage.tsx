import { useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { S, ThemeBtn, type Theme } from './BracketStudio';

interface Info { description?: string; cover?: string; startsAt?: string; title: string; org: string; mode: 'solo' | 'team'; count: number; cap: number; closesAt: number; reason: '' | 'closed' | 'full' }
type State = 'idle' | 'sending' | 'done' | 'error' | 'dup' | 'dupTeam' | 'dupMembers' | 'required' | 'badId' | 'closed' | 'full';
const okId = (s: string) => /^[\p{L}\p{N}_]+$/u.test(s);
const okIds = (l: string) => l.split(/[\n,،;]+/).map((v) => v.trim()).filter(Boolean).every(okId);
/** Most prominent hue of the cover (30° bins, only vivid pixels). null = grey/white picture or unreadable: keep the site colours. */
function useCoverHue(src?: string): number | null {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    setH(null);
    if (!src) return;
    let live = true;
    const img = new Image();
    img.onload = () => {
      try {
        const w = 48, hgt = Math.max(1, Math.round((48 * img.naturalHeight) / Math.max(1, img.naturalWidth)));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt;
        const cx = cv.getContext('2d'); if (!cx) return;
        cx.drawImage(img, 0, 0, w, hgt);
        const d = cx.getImageData(0, 0, w, hgt).data;
        const bins = new Array<number>(12).fill(0), sum = new Array<number>(12).fill(0);
        let vivid = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx, s = mx === 0 ? 0 : (mx - mn) / mx;
          if (s < 0.35 || v < 0.25 || v > 0.97) continue;
          const dl = mx - mn; let hu = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; hu = (hu * 60 + 360) % 360;
          const bi = Math.floor(((hu + 15) % 360) / 30); bins[bi]++; vivid++;
          sum[bi] += hu > 180 && bi === 0 ? hu - 360 : hu;
        }
        if (vivid < d.length / 4 * 0.08) return;
        let best = 0; for (let i = 1; i < 12; i++) if (bins[i] > bins[best]) best = i;
        if (live) setH(Math.round((sum[best] / bins[best] + 360) % 360));
      } catch { /* unreadable picture: default colours */ }
    };
    img.src = src;
    return () => { live = false; };
  }, [src]);
  return h;
}
const key = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const field = 'w-full rounded-xl border bg-transparent px-4 py-3 text-[.95rem] outline-none transition-colors focus:border-[var(--link-on)]';
const fieldStyle = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
const X = {
  ar: { closed: 'التسجيل مغلق.', full: 'اكتمل العدد، التسجيل مغلق.', gone: 'رابط التسجيل غير متاح.', by: 'تنظيم', starts: 'تاريخ بداية البطولة', another: 'تسجيل لاعب آخر', anotherTeam: 'تسجيل فريق آخر', count: 'المسجّلون', closes: 'يُغلق التسجيل', open: 'التسجيل مفتوح' },
  en: { closed: 'Registration is closed.', full: 'It is full, registration is closed.', gone: 'This registration link is not available.', by: 'By', starts: 'Tournament start date', another: 'Register another user', anotherTeam: 'Register another team', count: 'Registered', closes: 'Registration closes', open: 'Registration is open' },
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
    // keep the "registered" count (and open/closed) fresh while the page stays open
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      fetch(`/api/join/${encodeURIComponent(id)}`).then(async (r) => { if (live && r.ok) setInfo((await r.json()) as Info); }).catch(() => undefined);
    };
    const t = window.setInterval(refresh, 20000);
    document.addEventListener('visibilitychange', refresh);
    return () => { live = false; window.clearInterval(t); document.removeEventListener('visibilitychange', refresh); };
  }, [id]);

  const hue = useCoverHue(info && info !== 'gone' ? info.cover : undefined);
  const tint = hue === null ? undefined : (theme === 'dark'
    ? { '--bg': `hsl(${hue} 55% 8%)`, '--bg2': `hsl(${hue} 60% 14%)`, '--glass': `hsl(${hue} 35% 13%)`, '--glass-b': `hsla(${hue} 40% 60% / .26)`, '--muted': `hsl(${hue} 22% 72%)`, '--jn-ac': `hsl(${hue} 90% 55%)` }
    : { '--bg': `hsl(${hue} 80% 93%)`, '--bg2': `hsl(${hue} 90% 86%)`, '--glass': '#fff', '--glass-b': `hsla(${hue} 45% 30% / .2)`, '--muted': `hsl(${hue} 22% 36%)`, '--jn-ac': `hsl(${hue} 88% 46%)` }) as React.CSSProperties;
  const team = info !== null && info !== 'gone' && info.mode === 'team';
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    const pid = platoId.trim();
    if (!pid || (team && (!teamName.trim() || !members.trim()))) { setState('required'); return; }
    if (!okId(pid) || (team && !okIds(members))) { setState('badId'); return; }
    if (team) { const all = [pid, ...members.split(/[\n,،;]+/)].map(key).filter(Boolean); if (new Set(all).size !== all.length) { setState('dupMembers'); return; } }
    setState('sending');
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platoId: pid, teamName: teamName.trim(), members: members.trim(), hp }) });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (d.ok || d.error === 'full' || d.error === 'closed') fetch(`/api/join/${encodeURIComponent(id)}`).then(async (r) => { if (r.ok) setInfo((await r.json()) as Info); }).catch(() => undefined); // count / state right after sending
      setState(d.ok ? 'done' : d.error === 'duplicate' ? 'dup' : d.error === 'duplicate_team' ? 'dupTeam' : d.error === 'duplicate_members' ? 'dupMembers' : d.error === 'closed' ? 'closed' : d.error === 'full' ? 'full' : d.error === 'bad_id' ? 'badId' : d.error === 'required' ? 'required' : 'error');
    } catch { setState('error'); }
  }
  const msg = state === 'required' ? t.regRequired : state === 'badId' ? t.regBadId : state === 'dup' ? t.regDup : state === 'dupTeam' ? t.regDupTeam : state === 'dupMembers' ? t.regDupMembers : state === 'closed' ? x.closed : state === 'full' ? x.full : state === 'error' ? t.regErr : '';
  const closedNow = info && info !== 'gone' ? (info.reason || (state === 'closed' ? 'closed' : state === 'full' ? 'full' : '')) : '';
  const when = info && info !== 'gone' && info.closesAt > Date.now() ? new Date(info.closesAt).toLocaleString(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  return (
    <div className="pv-root" data-st={theme} data-jn={hue === null ? undefined : ''} style={tint}>
      <div className="pv-top" style={hue === null ? undefined : { background: 'var(--bg)' }}>
        <a href="#/" className="pv-logo" aria-label="Plato AR"><img src={`${import.meta.env.BASE_URL}brand/plato-ar-white.png`} alt="" draggable={false} /></a>
        <div className="pv-tools"><ThemeBtn theme={theme} set={setTheme} s={st} /><LanguageSwitcher /></div>
      </div>
      <div className="jn-wrap">
        {info === null ? <p style={{ color: 'var(--muted)' }}>…</p> : info === 'gone' ? <p className="text-lg">{x.gone}</p> : (
          <div className="jn-card">
            {info.cover && <img className="jn-cover" src={info.cover} alt="" draggable={false} />}
            <h1 className="text-[1.6rem] font-extrabold" dir="auto">{info.title}</h1>
            {info.org && <p className="mt-1 font-semibold" style={{ color: 'var(--muted)' }}>{x.by}: <span dir="auto" style={{ color: 'var(--text)' }}>{info.org}</span></p>}
            <p className="jn-stat">
              <span className={`jn-dot ${closedNow ? 'off' : ''}`} />
              <b>{closedNow === 'full' ? x.full : closedNow ? x.closed : x.open}</b>
              <span>· {x.count}: {info.count}{info.cap > 0 ? ` / ${info.cap}` : ''}</span>
            </p>
            {info.startsAt && !Number.isNaN(Date.parse(info.startsAt)) && <p className="mt-1 text-[.9rem] font-semibold" style={{ color: 'var(--muted)' }}>{x.starts}: <span style={{ color: 'var(--text)' }}>{new Date(info.startsAt).toLocaleString(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></p>}
            {info.description && <p className="mt-3 whitespace-pre-line text-[.92rem] leading-relaxed" style={{ color: 'var(--text)' }}>{info.description}</p>}
            {!closedNow && when && <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{x.closes}: {when}</p>}
            {state === 'done' ? (
              <div className="py-8 text-center" role="status">
                <p className="text-[1.5rem] font-extrabold">{t.regDone}</p>
                <p className="mt-2" style={{ color: 'var(--muted)' }}>{t.regDoneSub}</p>
                <button type="button" className="mt-6 inline-flex h-11 items-center justify-center rounded-full border px-6 text-[.95rem] font-bold" style={{ borderColor: 'var(--glass-b)', background: 'var(--glass)', color: 'var(--text)' }} onClick={() => { setPlatoId(''); setTeamName(''); setMembers(''); setState('idle'); }}>{team ? x.anotherTeam : x.another}</button>
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
