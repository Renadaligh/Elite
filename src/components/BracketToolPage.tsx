import { streamEmbed } from '../data/stream';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MAX_PLAYERS, MAX_RR, isLeague, champion, generate, addPlayers, draftBracket, hasResults, isDraft, resolve, setScore, setWinner, shuffled, swapSeats, toggleCurrent, renamePlayer, type BFormat, type BMatch, type Bracket } from '../data/bracket';
import { useAuth, type AuthUser, type Providers } from '../hooks/useAuth';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../services/api';
import BracketActions from './BracketActions';
import CommunityListing from './CommunityListing';
import { AddPlayerBar } from './AddPlayers';
import BracketSheetAny from './BracketSheetAny';
import { useBracketHistory } from '../hooks/useBracketHistory';
import BracketView from './BracketView';
import EmailLogin from './EmailLogin';
import FormatOpts, { fmtInit, hasOpts, toOpts } from './FormatOpts';

const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';
const DRAFT = 'elite-bracket-draft';
const card = { background: 'var(--glass)', borderColor: 'var(--glass-b)' };
const inp = 'w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[.95rem] outline-none focus:border-[#3d7bff]';
const pill = 'rounded-full border px-4 py-2 text-[.85rem] font-semibold disabled:opacity-60';

export const TXT = {
  ar: {
    title: 'أداة تنظيم البطولات', sub: 'سوِّ بطولة لأي سيرفر أو مجتمع: خروج مغلوب أو مزدوج أو دوري أو سويسري. حدّث النتائج واحفظه كصورة أو شاركه.',
    name: 'اسم البطولة', namePh: 'مثلاً: كأس سيرفر الأصدقاء', format: 'النظام', single: 'خروج المغلوب (فردي)', double: 'خروج مزدوج', rr: 'دوري (كل لاعب ضد الكل)', swiss: 'سويسري', groups: 'مجموعات ثم إقصائيات', ffa: 'لوحة صدارة (الكل ضد الكل)', dbl: 'دوري مزدوج (ذهاب وإياب)', maxRr: `الدوري: الحد الأقصى ${MAX_RR}`, players: 'اللاعبون / الفرق (سطر لكل واحد، الأعلى = الأقوى)',
    shuffle: 'خلط عشوائي', create: 'إنشاء البطولة', need: 'أدخل لاعبَين على الأقل', max: `الحد الأقصى ${MAX_RR}`,
    hint: 'اضغط على اسم الفائز في كل مباراة لتحديثه.', hintL: 'اكتب النتيجة في كل مباراة (أو الأرقام في كل جولة) والترتيب يتحدث تلقائياً.', score: 'نتيجة المباراة', undo: 'تراجع', save: 'حفظ في بطولاتي', saved: 'تم الحفظ', saving: '…', mine: 'بطولاتي',
    login: 'تسجيل الدخول', logout: 'خروج', loginTitle: 'سجّل دخولك عشان تحفظ بطولاتك', loginSub: 'تجد كل بطولاتك في مكان واحد وترجع لها من أي جهاز. ما ننشر شيء باسمك.',
    discord: 'الدخول بحساب Discord', google: 'الدخول بحساب Google', none: 'تسجيل الدخول غير مفعّل بعد.', close: 'إغلاق',
    editPlayers: 'تعديل أسماء اللاعبين', rebuild: 'إعادة البناء', rebuildAsk: 'إعادة البناء تمسح النتائج الحالية. متأكد؟', renameNote: 'تغيير الاسم يحافظ على النتائج.',
    notFound: 'البطولة غير موجودة.', by: 'من', copy: 'انسخه لأعدّله', readonly: 'عرض فقط', unsaved: 'لم تُحفظ التعديلات بعد',
    loginFailed: 'تعذّر تسجيل الدخول، جرّب مرة ثانية.', loginUnavailable: 'تسجيل الدخول غير مفعّل بعد.', limit: 'وصلت الحد الأقصى من البطولات المحفوظة (100). احذف واحد قديم.', private: 'هذه البطولة غير منشورة. اطلب من صاحبها تفعيل رابط العرض.', shTitle: 'المشاركة والبث', shView: 'نشر رابط للعرض', shViewD: 'أي شخص معه الرابط يشوف البطولة (عرض فقط).', shLive: 'البث المباشر (اختياري)', shLiveD: 'يظهر مشغّل بثك أعلى البطولة في صفحة العرض، فقط وأنت شغّال "بث الآن".', shStreamUrl: 'رابط قناتك أو بثك (Twitch / YouTube / Kick)', shStreamNow: 'بث الآن', shStreamBad: 'الرابط غير مدعوم. استخدم رابط Twitch أو YouTube أو Kick.', shStreamLive: 'بث مباشر', shSave2: 'حفظ', shCopy: 'نسخ', shCopied: 'تم النسخ', shFail: 'تعذّر التغيير. تأكد أنك شغّلت أوامر قاعدة البيانات الجديدة.', shSave: 'احفظ البطولة أولاً لتفعيل المشاركة.', twitch: 'الدخول بحساب Twitch', steam: 'الدخول بحساب Steam', orMail: 'أو بالبريد', saveFail: 'تعذّر الحفظ',
    myTitle: 'بطولاتي', newOne: '+ بطولة جديدة', empty: 'ما عندك بطولات محفوظة بعد.', open: 'فتح وتعديل', link: 'نسخ الرابط', linkDone: 'تم نسخ الرابط', img: 'صورة', del: 'حذف', delAsk: 'حذف هذه البطولة؟',
    needLogin: 'سجّل دخولك لتشوف بطولاتك المحفوظة.', players_n: 'لاعبين', hello: 'أهلاً',
  },
  en: {
    title: 'Bracket tool', sub: 'Make a bracket for any server or community: single or double elimination, round robin or swiss. Update results, save it as an image or share it.',
    name: 'Tournament name', namePh: 'e.g. Friends Server Cup', format: 'Format', single: 'Single elimination', double: 'Double elimination', rr: 'Round robin', swiss: 'Swiss', groups: 'Groups then knockout', ffa: 'Leaderboard (free-for-all)', dbl: 'Double round robin (home & away)', maxRr: `Round robin: max ${MAX_RR}`, players: 'Players / teams (one per line, top = strongest seed)',
    shuffle: 'Shuffle randomly', create: 'Create bracket', need: 'Enter at least 2 players', max: `Max ${MAX_RR}`,
    hint: 'Click the winner of each match to update it.', hintL: 'Type the score of each match (or round); the standings update automatically.', score: 'Match score', undo: 'Undo', save: 'Save to my brackets', saved: 'Saved', saving: '…', mine: 'My brackets',
    login: 'Sign in', logout: 'Sign out', loginTitle: 'Sign in to save your brackets', loginSub: 'Find all your brackets in one place from any device. We never post anything for you.',
    discord: 'Continue with Discord', google: 'Continue with Google', none: 'Sign-in is not enabled yet.', close: 'Close',
    editPlayers: 'Edit player names', rebuild: 'Rebuild', rebuildAsk: 'Rebuilding clears the current results. Sure?', renameNote: 'Renaming keeps the results.',
    notFound: 'Bracket not found.', by: 'by', copy: 'Copy to edit', readonly: 'View only', unsaved: 'Unsaved changes',
    loginFailed: 'Sign-in failed, please try again.', loginUnavailable: 'Sign-in is not enabled yet.', limit: 'You reached the limit of saved brackets (100). Delete an old one.', private: 'This bracket is not published. Ask its owner to turn on the view link.', shTitle: 'Sharing & stream', shView: 'Publish a view link', shViewD: 'Anyone with the link can view the bracket (read-only).', shLive: 'Live stream (optional)', shLiveD: 'Your stream player shows above the bracket on the view page, only while "Live now" is on.', shStreamUrl: 'Your channel or stream link (Twitch / YouTube / Kick)', shStreamNow: 'Live now', shStreamBad: 'Unsupported link. Use a Twitch, YouTube or Kick link.', shStreamLive: 'Live', shSave2: 'Save', shCopy: 'Copy', shCopied: 'Copied', shFail: 'Could not change it. Make sure you ran the new database statements.', shSave: 'Save the bracket first to turn on sharing.', twitch: 'Continue with Twitch', steam: 'Continue with Steam', orMail: 'or by email', saveFail: 'Could not save',
    myTitle: 'My brackets', newOne: '+ New bracket', empty: 'No saved brackets yet.', open: 'Open & edit', link: 'Copy link', linkDone: 'Link copied', img: 'Image', del: 'Delete', delAsk: 'Delete this bracket?',
    needLogin: 'Sign in to see your saved brackets.', players_n: 'players', hello: 'Hi',
  },
} as const;
type Tx = (typeof TXT)['ar'] | (typeof TXT)['en'];

const base = () => `${window.location.origin}${window.location.pathname}`;
const loginNote = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('login');

function LoginModal({ tx, providers, r, onClose }: { tx: Tx; providers: Providers; r: 'tool' | 'mine'; onClose: () => void }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const any = Object.values(providers).some(Boolean);
  const { lang } = useI18n();
  return (
    <div className="backdrop-fade fixed inset-0 z-[90] grid place-items-center bg-black/60 p-5 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={tx.loginTitle} className="modal-in grid w-full max-w-[26rem] gap-3 rounded-2xl border p-7 text-center shadow-2xl" style={{ background: 'var(--dialog, #0b1038)', borderColor: 'var(--glass-b)' }}>
        <h2 className="text-[1.2rem] font-extrabold">{tx.loginTitle}</h2>
        <p className="text-[.9rem]" style={{ color: 'var(--muted)' }}>{tx.loginSub}</p>
        {providers.discord && <a href={`/api/auth/login/discord?r=${r}`} className="rounded-xl px-4 py-3 font-bold text-white" style={{ background: '#5865f2' }}>{tx.discord}</a>}
        {providers.google && <a href={`/api/auth/login/google?r=${r}`} className="rounded-xl bg-white px-4 py-3 font-bold text-[#222]">{tx.google}</a>}
        {providers.twitch && <a href={`/api/auth/login/twitch?r=${r}`} className="rounded-xl px-4 py-3 font-bold text-white" style={{ background: '#9146ff' }}>{tx.twitch}</a>}
        {providers.steam && <a href={`/api/auth/login/steam?r=${r}`} className="rounded-xl px-4 py-3 font-bold text-white" style={{ background: '#1b2838' }}>{tx.steam}</a>}
        {providers.email && <><p className="text-[.8rem]" style={{ color: 'var(--muted)' }}>{tx.orMail}</p><EmailLogin lang={lang} /></>}
        {!any && <p className="rounded-xl border px-4 py-3 text-[.9rem]" style={{ ...card, color: 'var(--muted)' }}>{tx.none}</p>}
        <button type="button" className={`${pill} justify-self-center`} style={card} onClick={onClose}>{tx.close}</button>
      </div>
    </div>
  );
}

function Shell({ tx, user, children, bare }: { tx: Tx; user: AuthUser | null; children: ReactNode; bare?: boolean }) {
  return (
    <article className={bare ? 'pv-page min-h-[100svh] pb-10' : `page-in min-h-[100svh] pb-20 pt-[clamp(6.5rem,12vw,9rem)] ${WRAP}`} style={{ backgroundColor: 'var(--bg)' }}>
      {!bare && <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[40rem]">
          <h1 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-tight">{tx.title}</h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>{tx.sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {user && <a href="#/bracket" className={pill} style={card}>{tx.mine}</a>}
        </div>
      </div>}
      {children}
    </article>
  );
}

interface Draft { title: string; names: string; fmt: BFormat; br: Bracket | null }
const readDraft = (): Draft => { try { const d = JSON.parse(localStorage.getItem(DRAFT) ?? ''); if (d && typeof d.title === 'string') return d; } catch { /* none */ } return { title: '', names: '', fmt: 'single', br: null }; };

export function Editor({ id, tx, auth, readOnly, onForeign }: { id?: string; tx: Tx; auth: ReturnType<typeof useAuth>; readOnly?: boolean; onForeign?: () => void }) {
  const { lang } = useI18n();
  const init = useMemo(() => (id ? { title: '', names: '', fmt: 'single' as BFormat, br: null } : readDraft()), [id]);
  const [title, setTitle] = useState(init.title);
  const [names, setNames] = useState(init.names);
  const [fmt, setFmt] = useState<BFormat>(init.fmt);
  const [shuf, setShuf] = useState(false);
  const [br, setBr] = useState<Bracket | null>(init.br);
  const [sel, setSel] = useState<string | null>(null);
  const [owner, setOwner] = useState('');
  const [mine, setMine] = useState(!id);
  const [state, setState] = useState<'load' | 'ok' | 'missing' | 'private'>(id ? 'load' : 'ok');
  const share = true; // the view link is always on
  const [live, setLive] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamOn, setStreamOn] = useState(false);
  const [copied, setCopied] = useState('');
  const [login, setLogin] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lo, setLo] = useState(fmtInit());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(() => { const n = loginNote(); return n === 'failed' ? tx.loginFailed : n === 'unavailable' ? tx.loginUnavailable : ''; });
  const [, setEditP] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<{ title: string; bracket: Bracket | null; owner: string; mine: boolean; share: boolean; live: boolean; streamLive?: boolean; streamUrl?: string }>(`/brackets/${id}`)
      .then((r) => { if (!r.mine && onForeign) { onForeign(); return; } if (!r.bracket) { setState('missing'); return; } setTitle(r.title); setBr(r.bracket); setOwner(r.owner); setMine(r.mine && !readOnly); setLive(r.live); setStreamUrl(r.streamUrl ?? ''); setStreamOn(!!r.streamLive); setState('ok'); })
      .catch((e: Error & { detail?: string }) => setState(e.detail === 'private' ? 'private' : 'missing'));
  }, [id, auth.user?.id]);

  // The public view refreshes itself: new scores and the stream switch show up without reloading.
  useEffect(() => {
    if (!id || mine || state !== 'ok') return;
    let stop = false;
    const tick = () => {
      if (document.hidden) return;
      api<{ bracket: Bracket | null; streamLive?: boolean; streamUrl?: string }>(`/brackets/${id}`)
        .then((r) => {
          if (stop || !r.bracket) return;
          setBr((old) => (JSON.stringify(old) === JSON.stringify(r.bracket) ? old : r.bracket));
          setStreamUrl(r.streamUrl ?? ''); setStreamOn(!!r.streamLive);
        }).catch(() => { /* keep showing the last version */ });
    };
    const t = window.setInterval(tick, 15000);
    document.addEventListener('visibilitychange', tick);
    return () => { stop = true; window.clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [id, mine, state]);

  // Guests keep their work in the browser, so signing in (a page round-trip) never loses it.
  useEffect(() => { if (id) return; try { localStorage.setItem(DRAFT, JSON.stringify({ title, names, fmt, br })); } catch { /* private mode */ } }, [id, title, names, fmt, br]);

  const ver = useRef(0); // bumps on every edit, so a save that finishes late never marks newer edits as saved
  const failed = useRef(-1); // edit number whose autosave failed (no retry loop)
  const hist = useBracketHistory<Bracket>();
  const edit = (b: Bracket | null) => { if (br) hist.record(br); ver.current += 1; setBr(b); setDirty(true); setMsg(''); };
  const applyHist = (b: Bracket | undefined) => { if (!b) return; ver.current += 1; setBr(b); setDirty(true); setMsg(''); setSel(null); };
  const doUndo = () => { if (br) applyHist(hist.undo(br)); };
  const doRedo = () => { if (br) applyHist(hist.redo(br)); };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!(e.ctrlKey || e.metaKey) || (k !== 'z' && k !== 'y')) return;
      if ((e.target as HTMLElement | null)?.closest('input,textarea,select,[contenteditable]')) return;
      e.preventDefault();
      if (k === 'y' || e.shiftKey) doRedo(); else doUndo();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });
  const url = id ? `${base()}#/view/${id}` : `${base()}#/bracket`;
  const shownTitle = title.trim() || (lang === 'ar' ? 'بطولة' : 'Bracket');

  function create() {
    const list = names.split('\n').map((n) => n.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
    if (fmt === 'rr' && list.length > MAX_RR) { setMsg(tx.maxRr); return; }
    const opts = hasOpts(fmt) ? toOpts(fmt, lo, list.length) : undefined;
    // fewer than 2 names: an empty draft, players are added later (typed or from the registrants)
    edit(list.length < 2 ? draftBracket(fmt, list, opts) : generate(fmt, shuf ? shuffled(list) : list, opts)); setSel(null);
  }
  const pick = (m: BMatch, side: 'a' | 'b') => { if (!br) return; setSel(m.id); edit(setWinner(br, m.id, m.win === side ? undefined : side)); };
  const rename = (i: number, v: string) => br && edit({ ...br, players: br.players.map((p, j) => (j === i ? v.slice(0, 40) : p)) });
  function addToBracket(add: string[]) {
    if (!br) return;
    const have = new Set(br.players.map((p) => p.trim().toLowerCase()));
    if (!add.some((n) => n.trim() && !have.has(n.trim().toLowerCase()))) return;
    if (br.format === 'rr' && br.players.length + add.length > MAX_RR) { setMsg(tx.maxRr); return; }
    // players join without a rebuild: the bracket is redrawn around them. Only if results exist does it ask first (they are cleared; Undo brings them back).
    if (hasResults(br) && !window.confirm(lang === 'ar' ? 'إضافة لاعبين بعد بدء المباريات تمسح النتائج الحالية (وتقدر تتراجع). متأكد؟' : 'Adding players after matches started clears the current results (Undo brings them back). Sure?')) return;
    edit(addPlayers(br, add)); setSel(null); setMsg('');
  }
  function rebuild() { if (!br || !window.confirm(tx.rebuildAsk)) return; setNames(br.players.join('\n')); setFmt(br.format); edit(null); setSel(null); setEditP(false); }

  async function save() {
    if (!br) return;
    if (!auth.user) { setLogin(true); return; }
    setBusy(true); setMsg('');
    const sent = ver.current;
    try {
      const body = JSON.stringify({ title: shownTitle, bracket: br });
      if (id) { await api(`/brackets/${id}`, { method: 'PUT', body }); if (ver.current === sent) setDirty(false); setMsg(tx.saved); }
      else {
        const r = await api<{ id: string }>('/brackets', { method: 'POST', body });
        try { localStorage.removeItem(DRAFT); } catch { /* ignore */ }
        window.location.hash = `#/bracket/${r.id}`;
      }
    } catch (e) { failed.current = sent; setMsg((e as Error & { detail?: string }).detail === 'limit' ? tx.limit : tx.saveFail); }
    setBusy(false);
  }
  // saved brackets save themselves ~1.5 s after the last change (new, unsaved ones still need the button: they have no name/link yet)
  useEffect(() => {
    if (!id || !mine || !dirty || busy || !br || !auth.user || failed.current === ver.current) return undefined;
    const h = window.setTimeout(() => { void save(); }, 1500);
    return () => window.clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mine, dirty, busy, br, title, auth.user]);
  async function flip(k: 'live', on: boolean) {
    if (!id) return;
    setLive(on);
    if (k === 'live') setStreamOn(on && !!streamUrl);
    try { await api(`/brackets/${id}`, { method: 'PATCH', body: JSON.stringify({ [k]: on }) }); }
    catch { setLive(!on); if (k === 'live') setStreamOn(!on && !!streamUrl); setMsg(tx.shFail); }
  }
  async function saveStream() {
    if (!id) return;
    const v = streamUrl.trim();
    if (v && !streamEmbed(v)) { setMsg(tx.shStreamBad); return; }
    try { await api(`/brackets/${id}`, { method: 'PATCH', body: JSON.stringify({ streamUrl: v }) }); setMsg(''); setStreamOn(live && !!v); }
    catch { setMsg(tx.shFail); }
  }
  async function copyLink(key: string, link: string) {
    try { await navigator.clipboard.writeText(link); setCopied(key); window.setTimeout(() => setCopied(''), 1800); } catch { window.prompt('', link); }
  }

  const m = br && sel ? br.matches.find((i) => i.id === sel) : undefined;
  const R = br ? resolve(br) : null;
  const champ = br ? champion(br) : null;
  const editable = mine;
  const sheetView = !editable && !!readOnly && !!br && !isDraft(br) ; // public view link: the whole bracket on one white sheet

  if (state === 'load') return <p style={{ color: 'var(--muted)' }}>…</p>;
  if (state === 'missing') return <p className="text-lg">{tx.notFound}</p>;
  if (state === 'private') return <p className="text-lg">{tx.private}</p>;
  const viewUrl = `${base()}#/view/${id}`;
  const embed = streamOn ? streamEmbed(streamUrl) : null;

  return (
    <>
      {!br ? (
        editable && (
          <div className="st-nf grid gap-4 rounded-2xl border p-5" style={card}>
            <label className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.name}<input className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} maxLength={60} value={title} placeholder={tx.namePh} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.format}
              <select className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)', backgroundColor: 'var(--bg)' }} value={fmt} onChange={(e) => setFmt(e.target.value as BFormat)}><option value="single">{tx.single}</option><option value="double">{tx.double}</option><option value="rr">{tx.rr}</option><option value="swiss">{tx.swiss}</option><option value="groups">{tx.groups}</option><option value="ffa">{tx.ffa}</option></select></label>
            <FormatOpts fmt={fmt} value={lo} onChange={setLo} lang={lang} inpCls={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)', backgroundColor: 'var(--bg)' }} border={{ borderColor: 'var(--glass-b)' }} players={names.split('\n').filter((q) => q.trim()).length} />
            <label className="st-nf-p grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.players}{fmt === 'rr' ? ` · ${tx.max}` : ''}<textarea rows={8} dir="auto" className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} value={names} onChange={(e) => setNames(e.target.value)} /></label>
            <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={shuf} onChange={(e) => setShuf(e.target.checked)} />{tx.shuffle}</label>
            <div><button type="button" className="btn-primary" onClick={create}>{tx.create}</button></div>
            {msg && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{msg}</p>}
          </div>
        )
      ) : (
        <div className={`grid min-w-0 gap-5 ${!editable && readOnly ? 'pv-body' : ''}`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 ${!editable && readOnly ? 'pv-pad' : ''}`}>
            {!sheetView && <div>
              {editable ? <input className="w-full max-w-[26rem] rounded-xl border bg-transparent px-3 py-2 text-[1.5rem] md:text-[1.6rem] font-extrabold outline-none focus:border-[#3d7bff]" style={{ borderColor: 'var(--glass-b)' }} maxLength={60} value={title} placeholder={tx.namePh} onChange={(e) => { ver.current += 1; setTitle(e.target.value); setDirty(true); }} />
                : <h2 className="text-[1.7rem] md:text-[2rem] font-extrabold">{title}</h2>}
              {!editable && <p className="mt-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.readonly}</p>}
            </div>}
            <div className="flex flex-wrap items-center gap-2.5">
              <BracketActions undo={editable ? { onUndo: doUndo, onRedo: doRedo, canUndo: hist.canUndo, canRedo: hist.canRedo } : undefined} linkOk={!editable || (!!id && share)} bracket={br} title={shownTitle} url={editable && id ? viewUrl : url} />
              {editable && <button type="button" className={`${pill} text-white`} style={{ background: 'linear-gradient(135deg,#3d7bff,#5b5ff0)', borderColor: 'transparent' }} disabled={busy} onClick={save}>{busy ? tx.saving : tx.save}</button>}
            </div>
          </div>
          {(msg || dirty) && <p role="status" className="text-[.85rem]" style={{ color: msg === tx.saved ? '#27c27a' : '#ffb02e' }}>{msg || tx.unsaved}</p>}
          {editable && <p className="text-[.9rem]" style={{ color: 'var(--muted)' }}>{br && (isLeague(br) || br.format === 'groups' || br.format === 'ffa') ? tx.hintL : tx.hint}</p>}
          <div className="st-stage">
          {embed && (
            <div className="stream-box-wrap" style={{ marginInline: 'auto', width: '100%' }}>
              <p className="st-livep"><i className="st-dot" />{tx.shStreamLive}</p>
              <div className="stream-box"><iframe src={embed} title="stream" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" /></div>
            </div>
          )}
          {sheetView ? <BracketSheetAny bracket={br} title={shownTitle} lang={lang === 'en' ? 'en' : 'ar'} /> : <div className="st-brcard rounded-2xl border p-3" style={card}><BracketView bracket={br} onPick={editable ? pick : undefined} selected={sel} onChange={editable ? edit : undefined} onRename={editable ? (i, v) => edit(renamePlayer(br, i, v)) : undefined} onLive={editable && (br.format === 'single' || br.format === 'double') ? (mm) => edit(toggleCurrent(br, mm.id)) : undefined} onScore={editable ? (mm, sa, sb) => edit(setScore(br, mm.id, sa, sb)) : undefined} onSwap={editable && (br.format === 'single' || br.format === 'double') ? (a, b) => { const nb = swapSeats(br, a, b); if (nb) edit(nb); } : undefined} pub={!!readOnly && !editable} /></div>}
          </div>
          {editable && <AddPlayerBar lang={lang} onAdd={addToBracket} />}
          {editable && (
            <div className="st-share" style={card}>
              <b>{tx.shTitle}</b>
              {!id ? <p className="st-shn">{tx.shSave}</p> : (
                <>
                  <div className="st-shr">
                    <div className="st-shh">
                      <div><span>{tx.shView}</span><small>{tx.shViewD}</small></div>
                    </div>
                    {share && <div className="st-shl"><input readOnly dir="ltr" value={viewUrl} onFocus={(e) => e.currentTarget.select()} /><button type="button" onClick={() => copyLink('share', viewUrl)}>{copied === 'share' ? tx.shCopied : tx.shCopy}</button></div>}
                  </div>
                  {share && (
                    <div className="st-shr">
                      <div className="st-shh"><div><span>{tx.shLive}</span><small>{tx.shLiveD}</small></div></div>
                      <div className="st-shl"><input dir="ltr" placeholder={tx.shStreamUrl} maxLength={300} value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} onBlur={saveStream} /><button type="button" onClick={saveStream}>{tx.shSave2}</button></div>
                      {streamUrl.trim() !== '' && (
                        <div className="st-shh" style={{ marginTop: '.6rem' }}>
                          <div><span>{tx.shStreamNow}</span></div>
                          <button type="button" role="switch" aria-checked={live} aria-label={tx.shStreamNow} className={`st-sw ${live ? 'on' : ''}`} onClick={() => flip('live', !live)}><i /></button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {editable && id && <CommunityListing id={id} share={share} lang={lang} title={title} players={br?.players ?? []} onAdd={addToBracket} />}
          {editable && <div><button type="button" className={pill} style={{ ...card, color: '#ffb02e' }} onClick={rebuild}>{tx.rebuild}</button></div>}
        </div>
      )}
      {login && <LoginModal tx={tx} providers={auth.providers} r="tool" onClose={() => setLogin(false)} />}
    </>
  );
}

/** Public bracket tool: #/bracket (new) · #/bracket/<id> (a saved bracket: view, or edit if it is yours) · #/bracket/mine (my brackets). */
export default function BracketToolPage({ id, auth: given, readOnly }: { id?: string; auth?: ReturnType<typeof useAuth>; readOnly?: boolean }) {
  const { lang } = useI18n();
  const tx = TXT[lang];
  const own = useAuth();
  const auth = given ?? own;
  return (
    <Shell tx={tx} user={auth.user} bare={!!readOnly && !!id}>
      <Editor key={`${id ?? 'new'}:${auth.user?.id ?? ''}`} id={id} tx={tx} auth={auth} readOnly={readOnly} />
    </Shell>
  );
}
