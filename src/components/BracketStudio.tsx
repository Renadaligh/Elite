import { siteUrl, noProto } from '../hooks/nav';
import { go as navTo } from '../hooks/nav';
import { useEffect, useRef, useState } from 'react';
import { downloadBlob } from '../data/bracketImage';
import { publicBracketExport } from '../data/publicBracketExport';
import type { Bracket } from '../data/bracket';
import { useAuth, type Providers } from '../hooks/useAuth';
import EmailLogin from './EmailLogin';
import { useI18n } from '../i18n/I18nProvider';
import { viewPath } from '../data/links';
import { api } from '../services/api';
import BrandLockup from './BrandLockup';
import { Editor, TXT, type EditorTab, type TabDef } from './BracketToolPage';
import Footer from './Footer';
import Header from './Header';
import LanguageSwitcher from './LanguageSwitcher';

/** Members' area of the bracket tool: a real sign-in screen, then a dashboard (no site header). Public links (#/bracket/<id>) stay in the normal site layout for guests. */
export const S = {
  ar: {
    tool: 'أداة تنظيم البطولات', welcome: 'أهلاً بك في', welcome2: 'أداة تنظيم البطولات', sub: 'سجّل دخولك لإنشاء بطولاتك وإدارتها وحفظها في حسابك.',
    discord: 'المتابعة عبر Discord', google: 'المتابعة عبر Google', twitch: 'Twitch', steam: 'Steam', orMail: 'أو بالبريد الإلكتروني', perks: 'ماذا ستحصل عليه',
    p1: 'بطولاتك محفوظة في حسابك', p2: 'خروج مغلوب، دوري، سويسري، مجموعات، لوحة صدارة', p3: 'صورة جاهزة للنشر ورابط للمشاركة',
    fine: 'بتسجيل الدخول نحفظ اسمك وصورتك من الحساب فقط. لا ننشر شيئاً باسمك.', back: 'العودة للموقع',
    pl: 'لاعب', rr: 'نظام الدوري', lb: 'لوحة الصدارة', grp: 'المجموعة', cP: 'لعب', cW: 'فوز', cD: 'تعادل', cL: 'خسارة', cPts: 'نقاط', h1: 'نظّم بطولتك', h2: 'بشكل', h3: 'احترافي', hp: 'بطولة مباشرة، وترتيب يتحدّث تلقائياً، وصورة جاهزة للمشاركة في ثوانٍ.',
    none: 'تسجيل الدخول غير مفعّل بعد.', failed: 'تعذّر تسجيل الدخول، حاول مرة أخرى.', unavailable: 'هذا الخيار غير مفعّل بعد.', expired: 'انتهى الرابط أو استُخدم من قبل. اطلب رابطاً جديداً.',
    mine: 'بطولاتي', fresh: 'بطولة جديدة', account: 'حسابي', toLight: 'الوضع الفاتح', toDark: 'الوضع الداكن', logout: 'تسجيل الخروج', newBtn: '+ بطولة جديدة',
    total: 'بطولاتي', live: 'جارية الآن', done: 'مكتملة', stNew: 'جديد', recent: 'آخر التعديلات', empty: 'ليس لديك بطولات محفوظة بعد.', emptyBtn: 'أنشئ أول بطولة',
    limitMsg: 'وصلت الحد الأقصى من البطولات (100)', dup: 'تكرار البطولة', dupSfx: '(نسخة)', dupOk: 'تم إنشاء نسخة', edit: 'فتح وتعديل', link: 'نسخ الرابط', copied: 'تم نسخ الرابط', img: 'حفظ كصورة', del: 'حذف', delAsk: 'حذف هذه البطولة؟', players: 'لاعب', fail: 'تعذّر تنفيذ العملية',
    backList: 'بطولاتي', via: 'الدخول عبر', count: 'عدد بطولاتي', needShare: 'فعّل «نشر رابط للعرض» من صفحة التعديل أولاً', accName: 'الاسم الظاهر', avChange: 'تغيير الصورة', avAdd: 'رفع صورة', avRemove: 'حذف الصورة', avHint: 'صورة واحدة، تُصغَّر تلقائياً (خفيفة جداً).', avBad: 'اختر صورة PNG أو JPG أو WebP.', accSave: 'حفظ', accSaved: 'تم الحفظ', accEmail: 'البريد', accJoined: 'تاريخ الانضمام', accUse: 'الاستخدام', accOf: 'من', accDanger: 'حذف الحساب', accDangerP: 'يحذف حسابك وكل بطولاتك نهائياً ولا يمكن التراجع.', accDel: 'حذف حسابي نهائياً', accMailT: 'الدخول بالبريد', accMailP: 'تبقى مسجّلاً 30 يوماً على هذا الجهاز. إذا سجّلت الخروج أو دخلت من جهاز أو متصفح آخر، اطلب رابط دخول جديداً من شاشة الدخول (يصلك على بريدك ويعمل مرة واحدة).', accAsk: 'سيتم حذف حسابك وكل بطولاتك نهائياً. متأكد؟', fmt: { single: 'خروج المغلوب', double: 'خروج مزدوج', rr: 'دوري', swiss: 'سويسري', groups: 'مجموعات', ffa: 'لوحة صدارة' },
  },
  en: {
    tool: 'Bracket Tool', welcome: 'Welcome to the', welcome2: 'Bracket Tool', sub: 'Sign in to create, manage and save your tournaments in your account.',
    discord: 'Continue with Discord', google: 'Continue with Google', twitch: 'Twitch', steam: 'Steam', orMail: 'or with your email', perks: 'What you get',
    p1: 'Your brackets saved in your account', p2: 'Single/double elimination, round robin, swiss, groups, leaderboard', p3: 'A ready-to-post image and a share link',
    fine: 'Signing in saves only your name and avatar from the account. We never post anything for you.', back: 'Back to the site',
    pl: 'Player', rr: 'Round robin', lb: 'Leaderboard', grp: 'Group', cP: 'P', cW: 'W', cD: 'D', cL: 'L', cPts: 'Pts', h1: 'Run your tournament', h2: 'the', h3: 'professional way', hp: 'Live bracket, standings that update themselves, and a shareable image in seconds.',
    none: 'Sign-in is not enabled yet.', failed: 'Sign-in failed, please try again.', unavailable: 'This option is not enabled yet.', expired: 'The link expired or was already used. Ask for a new one.',
    mine: 'My brackets', fresh: 'New bracket', account: 'Account', toLight: 'Light mode', toDark: 'Dark mode', logout: 'Sign out', newBtn: '+ New bracket',
    total: 'My brackets', live: 'In progress', done: 'Completed', stNew: 'New', recent: 'Recent', empty: 'No saved brackets yet.', emptyBtn: 'Create your first bracket',
    limitMsg: 'You reached the limit of brackets (100)', dup: 'Duplicate', dupSfx: '(copy)', dupOk: 'Copy created', edit: 'Open & edit', link: 'Copy link', copied: 'Link copied', img: 'Save as image', del: 'Delete', delAsk: 'Delete this bracket?', players: 'players', fail: 'Something went wrong',
    backList: 'My brackets', via: 'Signed in with', count: 'Saved brackets', needShare: 'Turn on “Publish a view link” on the edit page first', accName: 'Display name', avChange: 'Change photo', avAdd: 'Upload photo', avRemove: 'Remove photo', avHint: 'One photo, resized automatically (very light).', avBad: 'Pick a PNG, JPG or WebP image.', accSave: 'Save', accSaved: 'Saved', accEmail: 'Email', accJoined: 'Joined', accUse: 'Usage', accOf: 'of', accDanger: 'Delete account', accDangerP: 'Permanently deletes your account and all your brackets. This cannot be undone.', accDel: 'Delete my account', accMailT: 'Email sign-in', accMailP: 'You stay signed in for 30 days on this device. If you sign out or use another device or browser, ask for a new sign-in link on the sign-in screen (it arrives by email and works once).', accAsk: 'Your account and all your brackets will be deleted permanently. Sure?', fmt: { single: 'Single elimination', double: 'Double elimination', rr: 'Round robin', swiss: 'Swiss', groups: 'Groups', ffa: 'Leaderboard' },
  },
} as const;
type St = (typeof S)['ar'] | (typeof S)['en'];
const RESERVED = ['new', 'mine', 'account'];
const base = () => siteUrl("");
const note = () => new URLSearchParams(window.location.search).get('login');

const I = {
  list: <path d="M4 6h16M4 12h16M4 18h10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  dup: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  site: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10.5V19h12v-8.5" /></>,
  out: <path d="M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4M6 12h10" />,
  pen: <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16v4Z" /><path d="M13.5 6.5l4 4" /></>,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />,
  img: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></>,
  twitch: <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.43l-3 3v-3H6.857V1.714h13.714Z" fill="currentColor" stroke="none" />,
  trash: <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v6M14 11v6" />,
};
const Ic = ({ d, c = 'h-[18px] w-[18px]' }: { d: keyof typeof I; c?: string }) => <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{I[d]}</svg>;

export type Theme = 'dark' | 'light';
export function ThemeBtn({ theme, set, s }: { theme: Theme; set: (t: Theme) => void; s: St }) {
  const light = theme === 'light', label = light ? s.toDark : s.toLight;
  return (
    <button type="button" className="st-theme" aria-label={label} title={label} onClick={() => set(light ? 'dark' : 'light')}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {light ? <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>}
      </svg>
    </button>
  );
}

function Splash({ theme }: { theme: Theme }) {
  return <div className="st-splash" data-st={theme}><BrandLockup /><div className="st-bar"><b /></div></div>;
}


/** Animated showcase on the sign-in screen: one scene at a time, centred - a bracket plays out to a crowned winner, then round robin, groups and leaderboard. */
const SCENES = 4;
function Crown({ t }: { t: number }) {
  return <svg className="st-crown" style={{ '--t': `${t}s` } as React.CSSProperties} viewBox="0 0 64 44" aria-hidden><path d="M4 38 L9 10 L22 24 L32 4 L42 24 L55 10 L60 38 Z" fill="#ffc233" stroke="#ffdf7a" strokeWidth="3" strokeLinejoin="round" /><rect x="6" y="38" width="52" height="5" rx="2.5" fill="#e0a010" /></svg>;
}
function HeroStage({ s, k }: { s: St; k: number }) {
  const [view, setView] = useState(0);
  const [out, setOut] = useState(false);
  const calm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (calm) return;
    const stay = view === 0 ? 9500 : 6500;
    const a = window.setTimeout(() => setOut(true), stay);
    const b = window.setTimeout(() => { setView((v) => (v + 1) % SCENES); setOut(false); }, stay + 400);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [view, calm]);
  const go = (i: number) => { setOut(false); setView(i); };
  const P = (n: number) => `${s.pl} ${n}`;
  const t = (x: number) => ({ '--t': `${x}s` }) as React.CSSProperties;
  const r = (x: number, extra: Record<string, string> = {}) => ({ '--r': `${x}s`, ...extra }) as React.CSSProperties;
  const OY = 65;
  // x, y, top name, bottom name, top score, bottom score, top wins, delay
  const M: [number, number, string, string, number, number, boolean, number][] = [
    [0, 0, P(1), P(2), 3, 1, true, 0.2], [0, 100, P(3), P(4), 2, 0, true, 0.35], [0, 200, P(5), P(6), 1, 2, false, 0.5], [0, 300, P(7), P(8), 3, 0, true, 0.65],
    [350, 50, P(1), P(3), 2, 1, true, 1.7], [350, 250, P(6), P(7), 0, 2, false, 1.85], [700, 150, P(1), P(7), 3, 1, true, 3.0],
  ];
  const lines: [string, number][] = [
    ['M200 35 H275 V85 H350', 1.1], ['M200 135 H275 V85', 1.2], ['M200 235 H275 V285 H350', 1.3], ['M200 335 H275 V285', 1.4],
    ['M550 85 H625 V185 H700', 2.5], ['M550 285 H625 V185', 2.6],
  ];
  const rr: [string, number, number, number, number, number][] = [[P(1), 4, 3, 1, 0, 10], [P(2), 4, 2, 1, 1, 7], [P(3), 4, 2, 0, 2, 6], [P(4), 4, 1, 1, 2, 4], [P(5), 4, 0, 1, 3, 1]];
  const bars: [string, number][] = [[P(1), 92], [P(2), 78], [P(3), 61], [P(4), 44], [P(5), 30]];
  const grp = (g: string, base: number, pts: number[], d: number) => (
    <div className="st-card">
      <b>{s.grp} {g}</b>
      {pts.map((x, i) => <div key={i} className={`st-row ${i < 2 ? 'adv' : ''}`} style={r(d + i * 0.14)}><i>{i + 1}</i><span>{P(base + i)}</span><em className="pt">{x}</em></div>)}
    </div>
  );
  return (
    <div className="st-show">
      <div className="st-box" style={{ width: 900 * k, height: 500 * k }}>
        <div key={view} className={`st-scene ${out ? 'out' : ''}`} style={{ '--k': k } as React.CSSProperties}>
          {view === 0 && (<>
            <svg className="st-lines" viewBox="0 0 900 500" fill="none"><g transform={`translate(0 ${OY})`}>{lines.map(([d, x], i) => <path key={i} d={d} style={t(x)} />)}</g></svg>
            {M.map(([x, y, a, b, sa, sb, w, dl], i) => (
              <div key={i} className={`st-mc ${i === 6 ? 'hot' : ''}`} style={{ insetInlineStart: x, top: y + OY, ...t(dl) }}>
                <div className={w ? 'w' : ''}><span className="st-nm">{a}{i === 6 && <Crown t={4} />}</span><b>{sa}</b></div><div className={w ? '' : 'w'}><span>{b}</span><b>{sb}</b></div>
              </div>
            ))}
          </>)}
          {view === 1 && (
            <div className="st-card"><b>{s.rr}</b>
              <div className="st-row" style={r(0.2)}><i /><span /><em>{s.cP}</em><em>{s.cW}</em><em>{s.cD}</em><em>{s.cL}</em><em className="pt">{s.cPts}</em></div>
              {rr.map(([n, p, w, d, l, pt], i) => <div key={i} className="st-row" style={r(0.4 + i * 0.14)}><i>{i + 1}</i><span>{n}</span><em>{p}</em><em>{w}</em><em>{d}</em><em>{l}</em><em className="pt">{pt}</em></div>)}
            </div>
          )}
          {view === 2 && <div className="st-two">{grp('A', 1, [9, 6, 3, 0], 0.3)}{grp('B', 5, [7, 6, 4, 1], 0.45)}</div>}
          {view === 3 && (
            <div className="st-card"><b>{s.lb}</b>
              {bars.map(([n, v], i) => <div key={i} className="st-row" style={r(0.3 + i * 0.14, { '--w': `${v}%` })}><i>{i + 1}</i><span style={{ flex: '0 0 90px' }}>{n}</span><div className="bar"><u /></div><em className="pt">{v}</em></div>)}
            </div>
          )}
        </div>
      </div>
      <div className="st-dots" role="tablist">{Array.from({ length: SCENES }, (_, i) => <button key={i} type="button" className={view === i ? 'on' : ''} aria-label={`${i + 1}`} onClick={() => go(i)} />)}</div>
    </div>
  );
}

function LoginScreen({ s, providers, theme, setTheme }: { s: St; providers: Providers; theme: Theme; setTheme: (t: Theme) => void }) {
  const { dir, lang } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = heroRef.current; if (!el) return;
    const fit = () => setK(Math.max(0.45, Math.min(1.5, (el.clientWidth - 140) / 900, (el.clientHeight - 360) / 540)));
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  const n = note();
  const any = Object.values(providers).some(Boolean);
  const msg = n === 'failed' ? s.failed : n === 'unavailable' ? s.unavailable : n === 'expired' ? s.expired : '';
  const d = (i: number) => ({ '--d': `${i * 90}ms` }) as React.CSSProperties;
  return (
    <div className="st-login" dir={dir} data-st={theme}>
      <aside className="st-panel">
        <div className="st-rise flex items-center justify-between" style={d(0)}>
          <BrandLockup />
          <div className="flex items-center gap-2"><ThemeBtn theme={theme} set={setTheme} s={s} /><LanguageSwitcher /></div>
        </div>
        <div className="st-form">
          <h1 className="st-rise" style={d(1)}>{s.welcome}<br /><span className="st-red">{s.welcome2}</span></h1>
          <p className="st-rise st-sub" style={d(2)}>{s.sub}</p>
          {msg && <p role="alert" className="st-rise st-alert" style={d(2)}>{msg}</p>}
          {providers.discord && <a href="/api/auth/login/discord?r=tool" className="st-btn st-dc st-rise" style={d(3)}><span className="st-gl"><svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="#fff" aria-hidden><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg></span>{s.discord}</a>}
          {providers.google && <a href="/api/auth/login/google?r=tool" className="st-btn st-gg st-rise" style={d(4)}><span className="st-gl st-g"><svg viewBox="0 0 18 18" className="h-[20px] w-[20px]" aria-hidden><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" /><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" /><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" /><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" /></svg></span>{s.google}</a>}
          {(providers.twitch || providers.steam) && (
            <div className="st-duo st-rise" style={d(5)}>
              {providers.twitch && <a href="/api/auth/login/twitch?r=tool" className="st-btn st-tw"><svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="#fff" aria-hidden><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.43l-3 3v-3H6.857V1.714h13.714Z" /></svg>{s.twitch}</a>}
              {providers.steam && <a href="/api/auth/login/steam?r=tool" className="st-btn st-sm"><svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="#fff" aria-hidden><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" /></svg>{s.steam}</a>}
            </div>
          )}
          {providers.email && (<><div className="st-or st-rise" style={d(6)}>{s.orMail}</div><EmailLogin lang={lang} className="st-rise" /></>)}
          {!any && <p className="st-rise st-alert st-soft" style={d(3)}>{s.none}</p>}
          <div className="st-or st-rise" style={d(7)}>{s.perks}</div>
          <ul className="st-perks st-rise" style={d(8)}><li>{s.p1}</li><li>{s.p2}</li><li>{s.p3}</li></ul>
          <p className="st-fine st-rise" style={d(9)}>{s.fine}</p>
        </div>
        <a href="#top" className="st-back st-rise" style={d(10)}><span aria-hidden>{dir === 'rtl' ? '→' : '←'}</span> {s.back}</a>
      </aside>
      <section className="st-hero" aria-hidden ref={heroRef}>
        <div className="st-grid" /><div className="st-glow a" /><div className="st-glow b" />
        <HeroStage key={lang} s={s} k={k} />
        <div className="st-cap"><h2>{s.h1}<br />{s.h2} <span className="st-red">{s.h3}</span></h2><p>{s.hp}</p></div>
      </section>
    </div>
  );
}

type Notice = { id: string; bracketId: string; name: string; review: 'pending' | 'approved' | 'rejected'; note: string };
const SEEN = 'plato-notices-seen';
const seenSet = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN) || '[]') as string[]; } catch { return []; } };

/** Review results shown inside the dashboard (for organizers who gave no email). Approved/rejected can be dismissed. */
function Notices({ lang }: { lang: 'ar' | 'en' }) {
  const [rows, setRows] = useState<Notice[]>([]);
  const [seen, setSeen] = useState<string[]>(seenSet);
  useEffect(() => { api<Notice[]>('/brackets/notices').then((r) => setRows(Array.isArray(r) ? r : [])).catch(() => undefined); }, []);
  const ar = lang === 'ar';
  const key = (n: Notice) => `${n.id}:${n.review}:${n.note}`;
  const show = rows.filter((n) => n.review === 'pending' || !seen.includes(key(n)));
  if (!show.length) return null;
  const dismiss = (n: Notice) => { const v = [...seen, key(n)].slice(-100); setSeen(v); try { localStorage.setItem(SEEN, JSON.stringify(v)); } catch { /* ignore */ } };
  return (
    <div className="st-cards" style={{ marginBottom: '1rem' }} aria-label={ar ? 'الإشعارات' : 'Notifications'}>
      {show.map((n) => (
        <div key={key(n)} className="st-bc">
          <div className="flex items-start justify-between gap-3">
            <b className="st-bt">{n.name}</b>
            <span className={`st-chip ${n.review === 'approved' ? 'done' : n.review === 'pending' ? 'live' : ''}`}>{n.review === 'approved' ? (ar ? 'تمت الموافقة' : 'Approved') : n.review === 'pending' ? (ar ? 'قيد المراجعة' : 'In review') : (ar ? 'مرفوضة' : 'Rejected')}</span>
          </div>
          {n.review === 'rejected' && n.note && <p className="st-meta">{ar ? 'السبب: ' : 'Reason: '}{n.note}</p>}
          <div className="flex items-center justify-between gap-2">
            {n.review === 'rejected' ? <a href={`/bracket/${n.bracketId}`} className="st-meta" style={{ textDecoration: 'underline' }}>{ar ? 'عدّل وأعد الإرسال' : 'Edit and resubmit'}</a> : n.review === 'approved' ? <a href={`/tournaments/${n.id}`} className="st-meta" style={{ textDecoration: 'underline' }}>{ar ? 'عرض في الموقع' : 'View on the site'}</a> : <span />}
            {n.review !== 'pending' && <button type="button" className="st-meta" onClick={() => dismiss(n)}>{ar ? 'تم' : 'Dismiss'}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

type Row = { id: string; title: string; titleEn?: string; format: string; players: number; status?: 'new' | 'live' | 'done'; share?: boolean; live?: boolean; updatedAt: string; shared?: boolean; owner?: string };

function Mine({ s, lang, theme }: { s: St; lang: 'ar' | 'en'; theme: Theme }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [flash, setFlash] = useState('');
  const load = () => api<Row[]>('/brackets').then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const when = (iso: string) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso));
  const say = (m: string) => { setFlash(m); window.setTimeout(() => setFlash(''), 2200); };
  async function image(r: Row) { try { downloadBlob(await publicBracketExport(r.id, lang, theme), `${(lang === 'en' && r.titleEn ? r.titleEn : r.title).replace(/[^\p{L}\p{N}]+/gu, '-') || 'bracket'}.png`); } catch { say(s.fail); } }
  async function dup(r: Row) {
    try {
      const d = await api<{ bracket: Bracket }>(`/brackets/${r.id}`);
      await api('/brackets', { method: 'POST', body: JSON.stringify({ title: `${r.title} ${s.dupSfx}`.slice(0, 60), bracket: d.bracket }) });
      load(); say(s.dupOk);
    } catch (e) { say((e as Error & { detail?: string }).detail === 'limit' ? s.limitMsg : s.fail); }
  }
  async function del(r: Row) { if (!window.confirm(s.delAsk)) return; await api(`/brackets/${r.id}`, { method: 'DELETE' }).catch(() => undefined); load(); }
  async function copy(r: Row) { try { await navigator.clipboard.writeText(noProto(`${base()}${viewPath(r.id)}`)); say(s.copied); } catch { say(noProto(`${base()}${viewPath(r.id)}`)); } }
  const cnt = (k: string) => rows?.filter((r) => r.status === k).length ?? '–';
  return (
    <>
      <div className="st-stats">
        <div className="st-stat"><b>{rows?.length ?? '–'}</b><span>{s.total}</span></div>
        <div className="st-stat"><b>{cnt('live')}</b><span>{s.live}</span></div>
        <div className="st-stat"><b>{cnt('done')}</b><span>{s.done}</span></div>
      </div>
      <Notices lang={lang} />
      <h2 className="st-h2">{s.recent}</h2>
      <p role="status" className="st-flash" style={{ opacity: flash ? 1 : 0 }}>{flash || '·'}</p>
      {rows && !rows.length && <div className="st-empty"><p>{s.empty}</p><a href="/bracket/new" className="btn-primary">{s.emptyBtn}</a></div>}
      <div className="st-cards">
        {rows?.map((r, i) => (
          <div key={r.id} className="st-bc" style={{ '--d': `${Math.min(i, 8) * 60}ms` } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-3"><a href={`/bracket/${r.id}`} className="st-bt">{lang === 'en' && r.titleEn ? r.titleEn : r.title}{r.shared && <small className="st-meta" style={{ display: 'block' }}>{lang === 'ar' ? `مشترك معك · ${r.owner || ''}` : `Shared with you · ${r.owner || ''}`}</small>}</a><span className={`st-chip ${r.status === 'live' ? 'live' : r.status === 'done' ? 'done' : ''}`}>{r.status === 'live' ? s.live : r.status === 'done' ? s.done : s.stNew}</span></div>
            <div className="st-mini"><i className="w" /><i className="w" /><i /><i /></div>
            <div className="flex items-center justify-between gap-2">
              <span className="st-meta">{(s.fmt as Record<string, string>)[r.format] ?? r.format} · {r.players} {s.players}</span>
              <div className="st-act">
                <a href={`/bracket/${r.id}`} title={s.edit} aria-label={s.edit}><Ic d="pen" /></a>
                <button type="button" title={s.link} aria-label={s.link} onClick={() => copy(r)}><Ic d="link" /></button>
                {!r.shared && <button type="button" title={s.del} aria-label={s.del} className="dng" onClick={() => del(r)}><Ic d="trash" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Account({ s, auth, lang }: { s: St; auth: ReturnType<typeof useAuth>; lang: 'ar' | 'en' }) {
  const user = auth.user!;
  const [handle, setHandle] = useState(user.handle ?? '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const pct = Math.min(100, Math.round((auth.count / auth.max) * 100));
  const joined = user.createdAt ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(user.createdAt)) : '–';
  async function saveHandle() {
    const h = handle.trim().toLowerCase().replace(/^@/, '');
    setBusy(true);
    try { await api('/auth/me', { method: 'PUT', body: JSON.stringify({ handle: h }) }); auth.reload(); setMsg(s.accSaved); }
    catch (e) { const c = (e as Error & { detail?: string }).detail; setMsg(c === 'taken' ? (lang === 'ar' ? 'اسم المستخدم محجوز، جرّب غيره.' : 'That username is taken.') : c === 'bad_handle' ? (lang === 'ar' ? 'حروف إنجليزية وأرقام و _ فقط (3–20).' : 'English letters, digits and _ only (3–20).') : s.fail); }
    setBusy(false); window.setTimeout(() => setMsg(''), 2600);
  }
  async function pickPhoto(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setMsg(s.avBad); return; }
    setBusy(true);
    try {
      const bmp = await createImageBitmap(f);
      const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
      const g = c.getContext('2d')!, m = Math.min(bmp.width, bmp.height);
      g.drawImage(bmp, (bmp.width - m) / 2, (bmp.height - m) / 2, m, m, 0, 0, N, N);
      let blob: Blob | null = await new Promise((ok) => c.toBlob(ok, 'image/webp', 0.82));
      if (!blob || blob.type !== 'image/webp') blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
      if (!blob) throw new Error('x');
      const fd = new FormData(); fd.append('file', blob, 'a');
      const r = await fetch('/api/auth/avatar', { method: 'POST', body: fd, credentials: 'same-origin' });
      if (!r.ok) throw new Error('x');
      auth.reload(); setMsg(s.accSaved);
    } catch { setMsg(s.fail); }
    setBusy(false); window.setTimeout(() => setMsg(''), 2200);
  }
  async function dropPhoto() {
    setBusy(true);
    try { await api('/auth/avatar', { method: 'DELETE' }); auth.reload(); setMsg(s.accSaved); } catch { setMsg(s.fail); }
    setBusy(false); window.setTimeout(() => setMsg(''), 2200);
  }
  async function wipe() {
    if (!window.confirm(s.accAsk)) return;
    try { await api('/auth/me', { method: 'DELETE' }); } catch { setMsg(s.fail); return; }
    navTo('/bracket'); auth.reload();
  }
  return (
    <div className="st-acc">
      <section className="st-box2">
        <div className="st-prof">
          {user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="st-av big">{(user.handle || user.name).slice(0, 1).toUpperCase()}</span>}
          <div><b dir="ltr">{user.handle || user.name}</b></div>
        </div>
        <div className="st-avrow">
          <label className="st-pbtn">{user.avatar ? s.avChange : s.avAdd}<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={busy} onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ''; }} /></label>
          {user.avatar.startsWith('/api/img/') && <button type="button" className="st-pbtn" disabled={busy} onClick={dropPhoto}>{s.avRemove}</button>}
          <small>{s.avHint}</small>
        </div>
        <label className="st-fld">{lang === 'ar' ? 'اسم المستخدم (لإضافتك محرراً في القرعة)' : 'Username (so others can add you as a co-editor)'}
          <span className="st-inl"><input dir="ltr" value={handle} maxLength={20} onChange={(e) => setHandle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveHandle()} /><button type="button" disabled={busy || handle.trim().toLowerCase() === (user.handle ?? '') || handle.trim().length < 3} onClick={saveHandle}>{s.accSave}</button></span>
        </label>
        <p role="status" className="st-flash" style={{ opacity: msg ? 1 : 0 }}>{msg || '·'}</p>
        <dl className="st-dl">
          {user.email && <><dt>{s.accEmail}</dt><dd dir="ltr">{user.email}</dd></>}
          <dt>{s.accJoined}</dt><dd>{joined}</dd>
        </dl>
      </section>
      {user.provider === 'email' && <section className="st-box2"><h3>{s.accMailT}</h3><p>{s.accMailP}</p></section>}
      <section className="st-box2">
        <h3>{s.accUse}</h3>
        <p className="st-use"><b>{auth.count}</b> {s.accOf} {auth.max} · {s.count}</p>
        <div className="st-meter"><i style={{ width: `${pct}%` }} /></div>
      </section>
      <section className="st-box2 danger">
        <h3>{s.accDanger}</h3>
        <p>{s.accDangerP}</p>
        <button type="button" className="st-out" onClick={wipe}>{s.accDel}</button>
      </section>
    </div>
  );
}


/** First sign-in: offers to pick a username (used to add co-editors). Asked once per account on this device; always changeable from "My account". */
function HandlePrompt({ auth, lang }: { auth: ReturnType<typeof useAuth>; lang: 'ar' | 'en' }) {
  const user = auth.user!;
  const key = `plato-handle-asked-${user.id}`;
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem(key); } catch { return false; } });
  const [handle, setHandle] = useState(user.handle ?? '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const ar = lang === 'ar';
  useEffect(() => { if (user.handle && !handle) setHandle(user.handle); }, [user.handle]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  const done = () => { try { localStorage.setItem(key, '1'); } catch { /* private mode */ } setOpen(false); };
  async function save() {
    const h = handle.trim().toLowerCase().replace(/^@/, '');
    if (h === (user.handle ?? '')) { done(); return; }
    setBusy(true); setMsg('');
    try { await api('/auth/me', { method: 'PUT', body: JSON.stringify({ handle: h }) }); auth.reload(); done(); }
    catch (e) { const c = (e as Error & { detail?: string }).detail; setMsg(c === 'taken' ? (ar ? 'اسم المستخدم محجوز، جرّب غيره.' : 'That username is taken.') : c === 'bad_handle' ? (ar ? 'حروف إنجليزية وأرقام و _ فقط (3–20).' : 'English letters, digits and _ only (3–20).') : (ar ? 'تعذّر الحفظ، حاول مرة أخرى.' : 'Could not save, try again.')); }
    setBusy(false);
  }
  return (
    <div className="st-modal" role="dialog" aria-modal="true" aria-labelledby="st-hp-t">
      <div className="st-modal-card">
        <h3 id="st-hp-t">{ar ? 'اختر اسم المستخدم' : 'Choose your username'}</h3>
        <p>{ar ? 'اسم المستخدم هو ما يضيفك به المنظمون محرراً مشاركاً في القرعة. هل تريد تغييره؟' : 'Organisers add you as a co-editor with your username. Want to change it?'}</p>
        <span className="st-inl"><input dir="ltr" autoFocus value={handle} maxLength={20} onChange={(e) => setHandle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void save()} /><button type="button" disabled={busy || handle.trim().length < 3} onClick={() => void save()}>{ar ? 'حفظ' : 'Save'}</button></span>
        <p role="status" className="st-flash" style={{ opacity: msg ? 1 : 0 }}>{msg || '·'}</p>
        <small>{ar ? 'يمكنك تغييره في أي وقت من صفحة «حسابي».' : 'You can change it any time from “My account”.'}</small>
        <button type="button" className="st-pbtn" onClick={done}>{ar ? 'لاحقاً، أبقيه كما هو' : 'Later, keep it as is'}</button>
      </div>
    </div>
  );
}

function Studio({ id, auth, s, theme, setTheme }: { id?: string; auth: ReturnType<typeof useAuth>; s: St; theme: Theme; setTheme: (t: Theme) => void }) {
  const { lang, dir } = useI18n();
  const tx = TXT[lang];
  const user = auth.user!;
  const [mobileMenu, setMobileMenu] = useState(false);
  const [tab, setTab] = useState<EditorTab>('tree'); // section of the open tournament (side menu on desktop, strip on phones)
  const [tabs, setTabs] = useState<TabDef[]>([]);
  const sec: 'mine' | 'new' | 'account' = id === 'new' ? 'new' : id === 'account' ? 'account' : 'mine';
  const editing = !!id && !RESERVED.includes(id);
  const nav = [{ k: 'mine', href: '/bracket', label: s.mine, i: 'list' }, { k: 'new', href: '/bracket/new', label: s.fresh, i: 'plus' }, { k: 'account', href: '/bracket/account', label: s.account, i: 'user' }] as const;
  const title = editing ? '' : sec === 'new' ? s.fresh : sec === 'account' ? s.account : s.mine;
  return (
    <div className="st-app" dir={dir} data-st={theme}>
      <HandlePrompt auth={auth} lang={lang} />
      <aside className="st-side">
        <div className="st-side-top">
          <BrandLockup />
          <span className="st-tool">{s.tool}</span>
          <nav className="st-nav">
            {editing && tabs.length > 0 ? (
              <>
                <a href="/bracket" className="st-nav-back">{dir === 'rtl' ? '→' : '←'} {s.backList}</a>
                {tabs.map((t) => <button key={t.k} type="button" className={`st-nav-tab ${tab === t.k ? 'on' : ''}`} aria-current={tab === t.k ? 'page' : undefined} onClick={() => setTab(t.k)}>{t.label}</button>)}
              </>
            ) : nav.map((n) => <a key={n.k} href={n.href} className={sec === n.k ? 'on' : ''} aria-current={sec === n.k ? 'page' : undefined}><Ic d={n.i} />{n.label}</a>)}
          </nav>
        </div>
        <div className="st-side-bot">
          <div className="st-tools"><LanguageSwitcher /><ThemeBtn theme={theme} set={setTheme} s={s} />
            <div className="st-mobile-menu">
              <button type="button" className="st-theme st-menu-trigger" aria-label={mobileMenu ? (lang === 'ar' ? 'إغلاق القائمة' : 'Close menu') : (lang === 'ar' ? 'فتح القائمة' : 'Open menu')} aria-expanded={mobileMenu} aria-controls="st-mobile-nav" onClick={() => setMobileMenu(!mobileMenu)}><svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" aria-hidden="true"><path d={mobileMenu ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'} /></svg></button>
              {mobileMenu && <><button type="button" className="st-menu-backdrop" aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'} onClick={() => setMobileMenu(false)} /><nav id="st-mobile-nav" className="st-mobile-popup" aria-label={lang === 'ar' ? 'القائمة' : 'Navigation'}>{nav.map((n) => <a key={n.k} href={n.href} className={sec === n.k ? 'on' : ''} onClick={() => setMobileMenu(false)}><Ic d={n.i} />{n.label}</a>)}<hr className="st-pop-hr" /><a href="#top" onClick={() => setMobileMenu(false)}><Ic d="site" />{s.back}</a><button type="button" className="st-pop-out" onClick={() => { setMobileMenu(false); auth.logout(); }}><Ic d="out" />{s.logout}</button></nav></>}
            </div>
          </div>
          <div className="st-me">{user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="st-av">{(user.handle || user.name).slice(0, 1).toUpperCase()}</span>}<div><b dir="ltr">{user.handle || user.name}</b></div></div>
          <div className="st-acts">
            <a href="#top" className="st-logout st-site" aria-label={s.back} title={s.back}><Ic d="site" />{s.back}</a>
            <button type="button" className="st-logout" aria-label={s.logout} title={s.logout} onClick={auth.logout}><Ic d="out" />{s.logout}</button>
          </div>
        </div>
      </aside>
      <main className="st-main">
        <div key={`${sec}:${id ?? ''}`} className={`st-page ${editing ? 'st-wide' : ''}`}>
          {editing ? (
            <>
              <a href="/bracket" className="st-crumb">{dir === 'rtl' ? '→' : '←'} {s.backList}</a>
              <Editor key={id} id={id} tx={tx} auth={auth} tab={tab} onTab={setTab} onTabs={setTabs} onForeign={() => { window.location.assign(siteUrl(viewPath(id))); }} />
            </>
          ) : (
            <>
              <div className="st-top"><h1>{title}</h1>{sec === 'mine' && <a href="/bracket/new" className="st-new">{s.newBtn}</a>}</div>
              {sec === 'mine' && <Mine s={s} lang={lang} theme={theme} />}
              {sec === 'new' && <Editor key="new" tx={tx} auth={auth} />}
              {sec === 'account' && <Account s={s} auth={auth} lang={lang} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/** Handoff for old hash links and clients still running an earlier bundle. */
export function PublicView({ id }: { id: string }) {
  const { lang } = useI18n();
  const url = siteUrl(viewPath(id));
  useEffect(() => {
    if (window.location.href !== url) window.location.replace(url);
  }, [url]);
  return <main style={{ padding: '2rem' }}>
    <p>{lang === 'ar' ? 'تعذّر فتح عرض البطولة.' : 'Could not open the bracket view.'}</p>
    <a href={url}>{lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}</a>
  </main>;
}

export default function BracketRoute({ id }: { id?: string }) {
  const { lang } = useI18n();
  const auth = useAuth();
  const s = S[lang];
  const [theme, setTheme] = useState<Theme>(() => { try { return localStorage.getItem('elite-st-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } });
  useEffect(() => { try { localStorage.setItem('elite-st-theme', theme); } catch { /* private mode */ } }, [theme]);
  if (!auth.ready) return <Splash theme={theme} />;
  // Old shared links (#/bracket/<id>) still work for guests: they get the public view.
  if (!auth.user && id && !RESERVED.includes(id)) return <PublicView id={id} />;
  if (!auth.user) return <LoginScreen s={s} providers={auth.providers} theme={theme} setTheme={setTheme} />;
  return <Studio id={id} auth={auth} s={s} theme={theme} setTheme={setTheme} />;
}
