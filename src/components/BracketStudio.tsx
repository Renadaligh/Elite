import { useEffect, useRef, useState } from 'react';
import { bracketBlob, downloadBlob } from '../data/bracketImage';
import type { Bracket } from '../data/bracket';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../services/api';
import BrandLockup from './BrandLockup';
import BracketToolPage, { Editor, TXT } from './BracketToolPage';
import Footer from './Footer';
import Header from './Header';
import LanguageSwitcher from './LanguageSwitcher';

/** Members' area of the bracket tool: a real sign-in screen, then a dashboard (no site header). Public links (#/bracket/<id>) stay in the normal site layout for guests. */
const S = {
  ar: {
    tool: 'أداة البراكت', welcome: 'أهلاً بك في', welcome2: 'أداة البراكت', sub: 'سجّل دخولك لإنشاء بطولاتك وإدارتها وحفظها في حسابك.',
    discord: 'المتابعة عبر Discord', google: 'المتابعة عبر Google', perks: 'ماذا ستحصل عليه',
    p1: 'براكتاتك محفوظة في حسابك', p2: 'خروج مغلوب، دوري، سويسري، مجموعات، لوحة صدارة', p3: 'صورة جاهزة للنشر ورابط للمشاركة',
    fine: 'بتسجيل الدخول نحفظ اسمك وصورتك من الحساب فقط. لا ننشر شيئاً باسمك.', back: 'العودة للموقع',
    pl: 'لاعب', rr: 'نظام الدوري', lb: 'لوحة الصدارة', h1: 'نظّم بطولتك', h2: 'بشكل', h3: 'احترافي', hp: 'براكت مباشر، ترتيب يتحدث لحاله، وصورة جاهزة للمشاركة في ثواني.',
    none: 'تسجيل الدخول غير مفعّل بعد.', failed: 'تعذّر تسجيل الدخول، حاول مرة ثانية.', unavailable: 'هذا الخيار غير مفعّل بعد.',
    mine: 'براكتاتي', fresh: 'براكت جديد', account: 'حسابي', logout: 'تسجيل الخروج', newBtn: '+ براكت جديد',
    total: 'براكتاتي', live: 'جارية الآن', done: 'مكتملة', stNew: 'جديد', recent: 'آخر التعديلات', empty: 'ما عندك براكتات محفوظة بعد.', emptyBtn: 'أنشئ أول براكت',
    edit: 'فتح وتعديل', link: 'نسخ الرابط', copied: 'تم نسخ الرابط', img: 'حفظ كصورة', del: 'حذف', delAsk: 'حذف هذا البراكت؟', players: 'لاعب', fail: 'تعذّر تنفيذ العملية',
    backList: 'براكتاتي', via: 'الدخول عبر', count: 'عدد براكتاتي', fmt: { single: 'خروج المغلوب', double: 'خروج مزدوج', rr: 'دوري', swiss: 'سويسري', groups: 'مجموعات', ffa: 'لوحة صدارة' },
  },
  en: {
    tool: 'Bracket Tool', welcome: 'Welcome to the', welcome2: 'Bracket Tool', sub: 'Sign in to create, manage and save your tournaments in your account.',
    discord: 'Continue with Discord', google: 'Continue with Google', perks: 'What you get',
    p1: 'Your brackets saved in your account', p2: 'Single/double elimination, round robin, swiss, groups, leaderboard', p3: 'A ready-to-post image and a share link',
    fine: 'Signing in saves only your name and avatar from the account. We never post anything for you.', back: 'Back to the site',
    pl: 'Player', rr: 'Round robin', lb: 'Leaderboard', h1: 'Run your tournament', h2: 'the', h3: 'professional way', hp: 'Live bracket, standings that update themselves, and a shareable image in seconds.',
    none: 'Sign-in is not enabled yet.', failed: 'Sign-in failed, please try again.', unavailable: 'This option is not enabled yet.',
    mine: 'My brackets', fresh: 'New bracket', account: 'Account', logout: 'Sign out', newBtn: '+ New bracket',
    total: 'My brackets', live: 'In progress', done: 'Completed', stNew: 'New', recent: 'Recent', empty: 'No saved brackets yet.', emptyBtn: 'Create your first bracket',
    edit: 'Open & edit', link: 'Copy link', copied: 'Link copied', img: 'Save as image', del: 'Delete', delAsk: 'Delete this bracket?', players: 'players', fail: 'Something went wrong',
    backList: 'My brackets', via: 'Signed in with', count: 'Saved brackets', fmt: { single: 'Single elimination', double: 'Double elimination', rr: 'Round robin', swiss: 'Swiss', groups: 'Groups', ffa: 'Leaderboard' },
  },
} as const;
type St = (typeof S)['ar'] | (typeof S)['en'];
const RESERVED = ['new', 'mine', 'account'];
const base = () => `${window.location.origin}${window.location.pathname}`;
const note = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('login');

const I = {
  list: <path d="M4 6h16M4 12h16M4 18h10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  site: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10.5V19h12v-8.5" /></>,
  out: <path d="M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4M6 12h10" />,
  pen: <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16v4Z" /><path d="M13.5 6.5l4 4" /></>,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />,
  img: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></>,
  trash: <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v6M14 11v6" />,
};
const Ic = ({ d, c = 'h-[18px] w-[18px]' }: { d: keyof typeof I; c?: string }) => <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{I[d]}</svg>;

function Splash() {
  return <div className="st-splash"><BrandLockup /><div className="st-bar"><b /></div></div>;
}


/** Animated showcase on the sign-in screen: an 8-player bracket plays out to a crowned champion, then a standings table and a leaderboard appear. */
function HeroStage({ s, k }: { s: St; k: number }) {
  const P = (n: number) => `${s.pl} ${n}`;
  const t = (x: number) => ({ '--t': `${x}s` }) as React.CSSProperties;
  // [x, y, round, top, bottom, topScore, bottomScore, topWins, delay]
  const M: [number, number, string, string, number, number, boolean, number][] = [
    [0, 0, P(1), P(2), 3, 1, true, 0.2], [0, 100, P(3), P(4), 2, 0, true, 0.35], [0, 200, P(5), P(6), 1, 2, false, 0.5], [0, 300, P(7), P(8), 3, 0, true, 0.65],
    [250, 50, P(1), P(3), 2, 1, true, 1.7], [250, 250, P(6), P(7), 0, 2, false, 1.85],
    [500, 150, P(1), P(7), 3, 1, true, 3.0],
  ];
  const lines: [string, number][] = [
    ['M170 35 H210 V85 H250', 1.1], ['M170 135 H210 V85', 1.2], ['M170 235 H210 V285 H250', 1.3], ['M170 335 H210 V285', 1.4],
    ['M420 85 H460 V185 H500', 2.5], ['M420 285 H460 V185', 2.6], ['M670 185 H740', 3.7],
  ];
  const rows = [[P(1), 7], [P(2), 5], [P(3), 4], [P(4), 1]] as const;
  const bars = [[P(1), 92], [P(2), 78], [P(3), 61], [P(4), 44]] as const;
  return (
    <div className="st-stage" style={{ '--k': k } as React.CSSProperties}>
      <svg className="st-lines" viewBox="0 0 900 420" fill="none">{lines.map(([d, x], i) => <path key={i} d={d} style={t(x)} />)}</svg>
      {M.map(([x, y, a, b, sa, sb, w, dl], i) => (
        <div key={i} className={`st-mc ${i === 6 ? 'hot' : ''}`} style={{ insetInlineStart: x, top: y, ...t(dl) }}>
          <div className={w ? 'w' : ''}>{a}<b>{sa}</b></div><div className={w ? '' : 'w'}>{b}<b>{sb}</b></div>
        </div>
      ))}
      <div className="st-champ" style={{ ...t(3.9), insetInlineStart: 740, top: 168 }}>
        <svg className="st-crown" viewBox="0 0 64 44" aria-hidden><path d="M4 38 L9 10 L22 24 L32 4 L42 24 L55 10 L60 38 Z" fill="#ffc233" stroke="#ffdf7a" strokeWidth="2" strokeLinejoin="round" /><rect x="6" y="38" width="52" height="5" rx="2.5" fill="#e0a010" /><circle cx="9" cy="10" r="3.2" fill="#fff3c0" /><circle cx="32" cy="4" r="3.2" fill="#fff3c0" /><circle cx="55" cy="10" r="3.2" fill="#fff3c0" /></svg>
        <span>{P(1)}</span>
      </div>
      <div className="st-panel2" style={{ insetInlineStart: 0, top: 450, ...t(4.4) }}>
        <b>{s.rr}</b>
        {rows.map(([n, pt], i) => <div key={i} style={{ '--r': `${4.6 + i * 0.12}s` } as React.CSSProperties}><i>{i + 1}</i><span>{n}</span><em>{pt}</em></div>)}
      </div>
      <div className="st-panel2" style={{ insetInlineStart: 470, top: 450, ...t(4.6) }}>
        <b>{s.lb}</b>
        {bars.map(([n, v], i) => <div key={i} className="bar" style={{ '--r': `${4.9 + i * 0.12}s`, '--w': `${v}%` } as React.CSSProperties}><span>{n}</span><u><i /></u><em>{v}</em></div>)}
      </div>
    </div>
  );
}

function LoginScreen({ s, providers }: { s: St; providers: { discord: boolean; google: boolean } }) {
  const { dir, lang } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = heroRef.current; if (!el) return;
    const fit = () => setK(Math.max(0.5, Math.min(1.4, el.clientWidth / 960, (el.clientHeight - 380) / 640)));
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  const n = note();
  const any = providers.discord || providers.google;
  const msg = n === 'failed' ? s.failed : n === 'unavailable' ? s.unavailable : '';
  const d = (i: number) => ({ '--d': `${i * 90}ms` }) as React.CSSProperties;
  return (
    <div className="st-login" dir={dir}>
      <aside className="st-panel">
        <div className="st-rise flex items-center justify-between" style={d(0)}>
          <BrandLockup />
          <LanguageSwitcher />
        </div>
        <div className="st-form">
          <h1 className="st-rise" style={d(1)}>{s.welcome}<br /><span className="st-red">{s.welcome2}</span></h1>
          <p className="st-rise st-sub" style={d(2)}>{s.sub}</p>
          {msg && <p role="alert" className="st-rise st-alert" style={d(2)}>{msg}</p>}
          {providers.discord && <a href="/api/auth/login/discord?r=tool" className="st-btn st-dc st-rise" style={d(3)}><span className="st-gl"><svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="#fff" aria-hidden><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg></span>{s.discord}</a>}
          {providers.google && <a href="/api/auth/login/google?r=tool" className="st-btn st-gg st-rise" style={d(4)}><span className="st-gl st-g"><svg viewBox="0 0 18 18" className="h-[20px] w-[20px]" aria-hidden><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" /><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" /><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" /><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" /></svg></span>{s.google}</a>}
          {!any && <p className="st-rise st-alert st-soft" style={d(3)}>{s.none}</p>}
          <div className="st-or st-rise" style={d(5)}>{s.perks}</div>
          <ul className="st-perks st-rise" style={d(6)}><li>{s.p1}</li><li>{s.p2}</li><li>{s.p3}</li></ul>
          <p className="st-fine st-rise" style={d(7)}>{s.fine}</p>
        </div>
        <a href="#top" className="st-back st-rise" style={d(8)}><span aria-hidden>{dir === 'rtl' ? '→' : '←'}</span> {s.back}</a>
      </aside>
      <section className="st-hero" aria-hidden ref={heroRef}>
        <div className="st-grid" /><div className="st-glow a" /><div className="st-glow b" />
        <HeroStage key={lang} s={s} k={k} />
        <div className="st-cap"><h2>{s.h1}<br />{s.h2} <span className="st-red">{s.h3}</span></h2><p>{s.hp}</p></div>
      </section>
    </div>
  );
}

type Row = { id: string; title: string; format: string; players: number; status?: 'new' | 'live' | 'done'; updatedAt: string };

function Mine({ s, lang }: { s: St; lang: 'ar' | 'en' }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [flash, setFlash] = useState('');
  const load = () => api<Row[]>('/brackets').then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const when = (iso: string) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const say = (m: string) => { setFlash(m); window.setTimeout(() => setFlash(''), 2200); };
  async function image(r: Row) { try { const d = await api<{ bracket: Bracket }>(`/brackets/${r.id}`); downloadBlob(await bracketBlob(d.bracket, { title: r.title, lang }), `${r.title.replace(/[^\p{L}\p{N}]+/gu, '-') || 'bracket'}.png`); } catch { say(s.fail); } }
  async function del(r: Row) { if (!window.confirm(s.delAsk)) return; await api(`/brackets/${r.id}`, { method: 'DELETE' }).catch(() => undefined); load(); }
  async function copy(r: Row) { try { await navigator.clipboard.writeText(`${base()}#/bracket/${r.id}`); say(s.copied); } catch { say(`${base()}#/bracket/${r.id}`); } }
  const cnt = (k: string) => rows?.filter((r) => r.status === k).length ?? '–';
  return (
    <>
      <div className="st-stats">
        <div className="st-stat"><b>{rows?.length ?? '–'}</b><span>{s.total}</span></div>
        <div className="st-stat"><b>{cnt('live')}</b><span>{s.live}</span></div>
        <div className="st-stat"><b>{cnt('done')}</b><span>{s.done}</span></div>
      </div>
      <h2 className="st-h2">{s.recent}</h2>
      <p role="status" className="st-flash" style={{ opacity: flash ? 1 : 0 }}>{flash || '·'}</p>
      {rows && !rows.length && <div className="st-empty"><p>{s.empty}</p><a href="#/bracket/new" className="btn-primary">{s.emptyBtn}</a></div>}
      <div className="st-cards">
        {rows?.map((r, i) => (
          <div key={r.id} className="st-bc" style={{ '--d': `${Math.min(i, 8) * 60}ms` } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-3"><a href={`#/bracket/${r.id}`} className="st-bt">{r.title}</a><span className={`st-chip ${r.status === 'live' ? 'live' : r.status === 'done' ? 'done' : ''}`}>{r.status === 'live' ? s.live : r.status === 'done' ? s.done : s.stNew}</span></div>
            <div className="st-mini"><i className="w" /><i className="w" /><i /><i /></div>
            <div className="flex items-center justify-between gap-2">
              <span className="st-meta">{(s.fmt as Record<string, string>)[r.format] ?? r.format} · {r.players} {s.players}</span>
              <div className="st-act">
                <a href={`#/bracket/${r.id}`} title={s.edit} aria-label={s.edit}><Ic d="pen" /></a>
                <button type="button" title={s.link} aria-label={s.link} onClick={() => copy(r)}><Ic d="link" /></button>
                <button type="button" title={s.img} aria-label={s.img} onClick={() => image(r)}><Ic d="img" /></button>
                <button type="button" title={s.del} aria-label={s.del} className="dng" onClick={() => del(r)}><Ic d="trash" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Studio({ id, auth, s }: { id?: string; auth: ReturnType<typeof useAuth>; s: St }) {
  const { lang, dir } = useI18n();
  const tx = TXT[lang];
  const user = auth.user!;
  const sec: 'mine' | 'new' | 'account' = id === 'new' ? 'new' : id === 'account' ? 'account' : 'mine';
  const editing = !!id && !RESERVED.includes(id);
  const nav = [{ k: 'mine', href: '#/bracket', label: s.mine, i: 'list' }, { k: 'new', href: '#/bracket/new', label: s.fresh, i: 'plus' }, { k: 'account', href: '#/bracket/account', label: s.account, i: 'user' }] as const;
  const title = editing ? '' : sec === 'new' ? s.fresh : sec === 'account' ? s.account : s.mine;
  return (
    <div className="st-app" dir={dir}>
      <aside className="st-side">
        <div className="st-side-top">
          <BrandLockup />
          <span className="st-tool">{s.tool}</span>
          <nav className="st-nav">
            {nav.map((n) => <a key={n.k} href={n.href} className={sec === n.k ? 'on' : ''} aria-current={sec === n.k ? 'page' : undefined}><Ic d={n.i} />{n.label}</a>)}
          </nav>
        </div>
        <div className="st-side-bot">
          <div className="st-me">{user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="st-av">{user.name.slice(0, 1)}</span>}<div><b>{user.name}</b><small>{user.provider}</small></div></div>
          <nav className="st-nav">
            <a href="#top"><Ic d="site" />{s.back}</a>
            <a href="#/bracket" className="dng" onClick={(e) => { e.preventDefault(); auth.logout(); }}><Ic d="out" />{s.logout}</a>
          </nav>
        </div>
      </aside>
      <main className="st-main">
        <div key={`${sec}:${id ?? ''}`} className="st-page">
          {editing ? (
            <>
              <a href="#/bracket" className="st-crumb">{dir === 'rtl' ? '→' : '←'} {s.backList}</a>
              <Editor id={id} tx={tx} auth={auth} />
            </>
          ) : (
            <>
              <div className="st-top"><h1>{title}</h1>{sec === 'mine' && <a href="#/bracket/new" className="st-new">{s.newBtn}</a>}</div>
              {sec === 'mine' && <Mine s={s} lang={lang} />}
              {sec === 'new' && <Editor key="new" tx={tx} auth={auth} />}
              {sec === 'account' && (
                <div className="st-account">
                  {user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="st-av big">{user.name.slice(0, 1)}</span>}
                  <div><b>{user.name}</b><p>{s.via} {user.provider}</p></div>
                  <button type="button" className="st-out" onClick={auth.logout}>{s.logout}</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BracketRoute({ id }: { id?: string }) {
  const { lang } = useI18n();
  const auth = useAuth();
  const s = S[lang];
  if (!auth.ready) return <Splash />;
  // A shared link (#/bracket/<id>) is public: guests see it inside the normal site.
  if (!auth.user && id && !RESERVED.includes(id)) return (<><Header page="bracket" /><main><BracketToolPage id={id} auth={auth} /></main><Footer /></>);
  if (!auth.user) return <LoginScreen s={s} providers={auth.providers} />;
  return <Studio id={id} auth={auth} s={s} />;
}
