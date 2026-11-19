import { SHOW_AUTO_TOGGLE } from '../config/site';
import { siteUrl, noProto } from '../hooks/nav';
import { go as navTo } from '../hooks/nav';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MAX_PLAYERS, MAX_RR, isLeague, champion, setOrg, generate, addPlayers, removePlayer, setBench, setAuto, nameKey, draftBracket, hasResults, isDraft, resolve, shuffled, swapSeats, renamePlayer, dupNames, hasName, type BFormat, type BMatch, type Bracket } from '../data/bracket';
import { useAuth, type AuthUser, type Providers } from '../hooks/useAuth';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../services/api';
import BracketActions from './BracketActions';
import CommunityListing from './CommunityListing';
import RegistrantsCard from './RegistrantsCard';
import JoinPanel from './JoinPanel';
import EditorsPanel from './EditorsPanel';
import { AddPlayerBar, commitAutoAdds } from './AddPlayers';
import BracketSheetAny from './BracketSheetAny';
import { useBracketHistory } from '../hooks/useBracketHistory';
import BracketView from './BracketView';
import WinnerCard from './WinnerCard';
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
    name: 'اسم البطولة', namePh: 'مثلاً: كأس سيرفر الأصدقاء', format: 'النظام', single: 'خروج المغلوب (فردي)', double: 'خروج مزدوج', rr: 'دوري (كل لاعب ضد الكل)', swiss: 'سويسري', groups: 'مجموعات ثم إقصائيات', ffa: 'لوحة صدارة (الكل ضد الكل)', dbl: 'دوري مزدوج (ذهاب وإياب)', maxRr: `الدوري: الحد الأقصى ${MAX_RR}`, dupName: 'هذا الاسم مستخدم عند لاعب آخر.', dupList: 'فيه أسماء مكررة، عدّلها أولاً: ', players: 'اللاعبون / الفرق (سطر لكل واحد، الأعلى = الأقوى)',
    shuffle: 'خلط عشوائي', create: 'إنشاء البطولة', need: 'أدخل لاعبَين على الأقل', max: `الحد الأقصى ${MAX_RR}`,
    hint: 'اضغط على اسم الفائز في كل مباراة لتحديثه.', hintL: 'اكتب النتيجة في كل مباراة (أو الأرقام في كل جولة) والترتيب يتحدث تلقائياً.', score: 'نتيجة المباراة', undo: 'تراجع', save: 'حفظ في بطولاتي', saved: 'تم الحفظ', saving: '…', mine: 'بطولاتي',
    login: 'تسجيل الدخول', logout: 'خروج', loginTitle: 'سجّل دخولك عشان تحفظ بطولاتك', loginSub: 'تجد كل بطولاتك في مكان واحد وترجع لها من أي جهاز. ما ننشر شيء باسمك.',
    discord: 'الدخول بحساب Discord', google: 'الدخول بحساب Google', none: 'تسجيل الدخول غير مفعّل بعد.', close: 'إغلاق',
    editPlayers: 'تعديل أسماء اللاعبين', rebuild: 'إعادة البناء', rebuildAsk: 'إعادة البناء تمسح النتائج الحالية. متأكد؟', renameNote: 'تغيير الاسم يحافظ على النتائج.',
    notFound: 'البطولة غير موجودة.', by: 'من', copy: 'انسخه لأعدّله', readonly: 'عرض فقط', unsaved: 'لم تُحفظ التعديلات بعد',
    loginFailed: 'تعذّر تسجيل الدخول، جرّب مرة ثانية.', loginUnavailable: 'تسجيل الدخول غير مفعّل بعد.', limit: 'وصلت الحد الأقصى من البطولات المحفوظة (100). احذف واحد قديم.', private: 'هذه البطولة غير منشورة. اطلب من صاحبها تفعيل رابط العرض.', shTitle: 'المشاركة', shView: 'نشر رابط للعرض', shViewD: 'أي شخص معه الرابط يشوف البطولة (عرض فقط).', shCopy: 'نسخ', shCopied: 'تم النسخ', shSave: 'احفظ البطولة أولاً لتفعيل المشاركة.', twitch: 'الدخول بحساب Twitch', steam: 'الدخول بحساب Steam', orMail: 'أو بالبريد', saveFail: 'تعذّر الحفظ',
    myTitle: 'بطولاتي', newOne: '+ بطولة جديدة', empty: 'ما عندك بطولات محفوظة بعد.', open: 'فتح وتعديل', link: 'نسخ الرابط', linkDone: 'تم نسخ الرابط', img: 'صورة', del: 'حذف', delAsk: 'حذف هذه البطولة؟',
    needLogin: 'سجّل دخولك لتشوف بطولاتك المحفوظة.', players_n: 'لاعبين', hello: 'أهلاً',
    org: 'اسم المنظم (اختياري)', orgPh: 'مثلاً: النخبة', orgBy: 'تنظيم',
  },
  en: {
    title: 'Bracket tool', sub: 'Make a bracket for any server or community: single or double elimination, round robin or swiss. Update results, save it as an image or share it.',
    name: 'Tournament name', namePh: 'e.g. Friends Server Cup', format: 'Format', single: 'Single elimination', double: 'Double elimination', rr: 'Round robin', swiss: 'Swiss', groups: 'Groups then knockout', ffa: 'Leaderboard (free-for-all)', dbl: 'Double round robin (home & away)', maxRr: `Round robin: max ${MAX_RR}`, dupName: 'This name is already used by another player.', dupList: 'Some names are repeated, fix them first: ', players: 'Players / teams (one per line, top = strongest seed)',
    shuffle: 'Shuffle randomly', create: 'Create bracket', need: 'Enter at least 2 players', max: `Max ${MAX_RR}`,
    hint: 'Click the winner of each match to update it.', hintL: 'Type the score of each match (or round); the standings update automatically.', score: 'Match score', undo: 'Undo', save: 'Save to my brackets', saved: 'Saved', saving: '…', mine: 'My brackets',
    login: 'Sign in', logout: 'Sign out', loginTitle: 'Sign in to save your brackets', loginSub: 'Find all your brackets in one place from any device. We never post anything for you.',
    discord: 'Continue with Discord', google: 'Continue with Google', none: 'Sign-in is not enabled yet.', close: 'Close',
    editPlayers: 'Edit player names', rebuild: 'Rebuild', rebuildAsk: 'Rebuilding clears the current results. Sure?', renameNote: 'Renaming keeps the results.',
    notFound: 'Bracket not found.', by: 'by', copy: 'Copy to edit', readonly: 'View only', unsaved: 'Unsaved changes',
    loginFailed: 'Sign-in failed, please try again.', loginUnavailable: 'Sign-in is not enabled yet.', limit: 'You reached the limit of saved brackets (100). Delete an old one.', private: 'This bracket is not published. Ask its owner to turn on the view link.', shTitle: 'Sharing', shView: 'Publish a view link', shViewD: 'Anyone with the link can view the bracket (read-only).', shCopy: 'Copy', shCopied: 'Copied', shSave: 'Save the bracket first to turn on sharing.', twitch: 'Continue with Twitch', steam: 'Continue with Steam', orMail: 'or by email', saveFail: 'Could not save',
    myTitle: 'My brackets', newOne: '+ New bracket', empty: 'No saved brackets yet.', open: 'Open & edit', link: 'Copy link', linkDone: 'Link copied', img: 'Image', del: 'Delete', delAsk: 'Delete this bracket?',
    needLogin: 'Sign in to see your saved brackets.', players_n: 'players', hello: 'Hi',
    org: 'Organizer name (optional)', orgPh: 'e.g. Elite', orgBy: 'Organised by',
  },
} as const;
type Tx = (typeof TXT)['ar'] | (typeof TXT)['en'];

const base = () => siteUrl("");
const loginNote = () => new URLSearchParams(window.location.search).get('login');

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
          {user && <a href="/bracket" className={pill} style={card}>{tx.mine}</a>}
        </div>
      </div>}
      {children}
    </article>
  );
}

interface Draft { title: string; names: string; fmt: BFormat; br: Bracket | null; org?: string }
const readDraft = (): Draft => { try { const d = JSON.parse(localStorage.getItem(DRAFT) ?? ''); if (d && typeof d.title === 'string') return d; } catch { /* none */ } return { title: '', names: '', fmt: 'single', br: null }; };

export function Editor({ id, tx, auth, readOnly, onForeign }: { id?: string; tx: Tx; auth: ReturnType<typeof useAuth>; readOnly?: boolean; onForeign?: () => void }) {
  const { lang } = useI18n();
  const init = useMemo(() => (id ? { title: '', names: '', fmt: 'single' as BFormat, br: null } : readDraft()), [id]);
  const [title, setTitle] = useState(init.title);
  const [org, setOrgName] = useState((init as Draft).org ?? '');
  const [names, setNames] = useState(init.names);
  const [fmt, setFmt] = useState<BFormat>(init.fmt);
  const [shuf, setShuf] = useState(false);
  const [br, setBr] = useState<Bracket | null>(init.br);
  const [owner, setOwner] = useState('');
  const [mine, setMine] = useState(!id);
  const [isOwner, setIsOwner] = useState(true); // false = co-editor added by the owner
  const [state, setState] = useState<'load' | 'ok' | 'missing' | 'private'>(id ? 'load' : 'ok');
  const share = true; // the view link is always on
  const [copied, setCopied] = useState('');
  const [login, setLogin] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lo, setLo] = useState(fmtInit());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(() => { const n = loginNote(); return n === 'failed' ? tx.loginFailed : n === 'unavailable' ? tx.loginUnavailable : ''; });
  const [, setEditP] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<{ title: string; bracket: Bracket | null; owner: string; mine: boolean; isOwner?: boolean; share: boolean }>(`/brackets/${id}`)
      .then((r) => { if (!r.mine && onForeign) { onForeign(); return; } if (!r.bracket) { setState('missing'); return; } setTitle(r.title); setBr(r.bracket); setOwner(r.owner); setMine(r.mine && !readOnly); setIsOwner(r.isOwner !== false); setState('ok'); })
      .catch((e: Error & { detail?: string }) => setState(e.detail === 'private' ? 'private' : 'missing'));
  }, [id, auth.user?.id]);

  // Guests keep their work in the browser, so signing in (a page round-trip) never loses it.
  useEffect(() => { if (id) return; try { localStorage.setItem(DRAFT, JSON.stringify({ title, names, fmt, br, org })); } catch { /* private mode */ } }, [id, title, names, fmt, br, org]);

  const ver = useRef(0); // bumps on every edit, so a save that finishes late never marks newer edits as saved
  const failed = useRef(-1); // edit number whose autosave failed (no retry loop)
  const hist = useBracketHistory<Bracket>();
  const edit = (b: Bracket | null) => { if (br) hist.record(br); ver.current += 1; setBr(b); setDirty(true); setMsg(''); };
  const applyHist = (b: Bracket | undefined) => { if (!b) return; ver.current += 1; setBr(b); setDirty(true); setMsg(''); };
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
  const url = id ? `${base()}/v/${id}` : `${base()}/bracket`;
  const shownTitle = title.trim() || (lang === 'ar' ? 'بطولة' : 'Bracket');

  function create() {
    const list = names.split('\n').map((n) => n.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
    const dups = dupNames(list); if (dups.length) { setMsg(tx.dupList + dups.join('، ')); return; }
    if (fmt === 'rr' && list.length > MAX_RR) { setMsg(tx.maxRr); return; }
    const opts = hasOpts(fmt) ? toOpts(fmt, lo, list.length) : undefined;
    // fewer than 2 names: an empty draft, players are added later (typed or from the registrants)
    edit(setOrg(list.length < 2 ? draftBracket(fmt, list, opts) : generate(fmt, shuf ? shuffled(list) : list, opts), org));
  }
  const rename = (i: number, v: string) => br && edit({ ...br, players: br.players.map((p, j) => (j === i ? v.slice(0, 40) : p)) });
  function addToBracket(add: string[]) {
    if (!br) return;
    const have = new Set(br.players.map((p) => p.trim().toLowerCase()));
    if (!add.some((n) => n.trim() && !have.has(n.trim().toLowerCase()))) return;
    if (br.format === 'rr' && br.players.length + add.length > MAX_RR) { setMsg(tx.maxRr); return; }
    // players join without a rebuild: the bracket is redrawn around them. Only if results exist does it ask first (they are cleared; Undo brings them back).
    if (hasResults(br) && !window.confirm(lang === 'ar' ? 'إضافة لاعبين بعد بدء المباريات تمسح النتائج الحالية (وتقدر تتراجع). متأكد؟' : 'Adding players after matches started clears the current results (Undo brings them back). Sure?')) return;
    edit(setBench(addPlayers(br, add), (br.bench ?? []).filter((b) => !add.some((a) => nameKey(a) === nameKey(b))))); setMsg('');
  }
  /** keep = a player added by hand: he stays in the registrants list (with +) after leaving the bracket. */
  function removeFromBracket(name: string, keep = false) {
    if (!br) return;
    const inBr = br.players.some((p) => nameKey(p) === nameKey(name));
    if (inBr && hasResults(br) && !window.confirm(lang === 'ar' ? 'إزالة لاعب بعد بدء المباريات تمسح النتائج الحالية (وتقدر تتراجع). متأكد؟' : 'Removing a player after matches started clears the current results (Undo brings them back). Sure?')) return;
    const bench = (br.bench ?? []).filter((b) => nameKey(b) !== nameKey(name));
    if (keep) bench.push(name);
    edit(setBench(removePlayer(br, name), bench)); setMsg('');
  }
  /** Everybody out of the bracket; the players added by hand stay in the list. */
  function removeAllFromBracket(keep: string[]) {
    if (!br || !br.players.length) return;
    let b = br; for (const p of [...br.players]) b = removePlayer(b, p);
    const bench = [...(br.bench ?? [])]; for (const k of keep) if (!bench.some((x) => nameKey(x) === nameKey(k))) bench.push(k);
    edit(setBench(b, bench)); setMsg('');
  }
  function rebuild() { if (!br || !window.confirm(tx.rebuildAsk)) return; setNames(br.players.join('\n')); setFmt(br.format); edit(null); setEditP(false); }

  async function save() {
    if (!br) return;
    if (!auth.user) { setLogin(true); return; }
    setBusy(true); setMsg('');
    const sent = ver.current;
    try {
      const cw = champion(br); // the winner closes the published tournament (winner + end date are written by themselves)
      const body = JSON.stringify({ title: shownTitle, bracket: br, champion: cw !== null ? br.players[cw] ?? '' : '' });
      if (id) { await api(`/brackets/${id}`, { method: 'PUT', body }); commitAutoAdds(id); if (ver.current === sent) setDirty(false); setMsg(tx.saved); }
      else {
        const r = await api<{ id: string }>('/brackets', { method: 'POST', body });
        try { localStorage.removeItem(DRAFT); } catch { /* ignore */ }
        navTo(`/bracket/${r.id}`);
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
  async function copyLink(key: string, link: string) {
    try { await navigator.clipboard.writeText(noProto(link)); setCopied(key); window.setTimeout(() => setCopied(''), 1800); } catch { window.prompt('', noProto(link)); }
  }

  const R = br ? resolve(br) : null;
  const champ = br ? champion(br) : null;
  const editable = mine;
  const sheetView = !editable && !!readOnly && !!br && !isDraft(br) ; // public view link: the whole bracket on one white sheet

  if (state === 'load') return <p style={{ color: 'var(--muted)' }}>…</p>;
  if (state === 'missing') return <p className="text-lg">{tx.notFound}</p>;
  if (state === 'private') return <p className="text-lg">{tx.private}</p>;
  const viewUrl = `${base()}/v/${id}`;

  return (
    <>
      {!br ? (
        editable && (
          <div className="st-nf grid gap-4 rounded-2xl border p-5" style={card}>
            <label className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.name}<input className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} maxLength={60} value={title} placeholder={tx.namePh} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.org}<input className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} maxLength={60} value={org} placeholder={tx.orgPh} onChange={(e) => setOrgName(e.target.value)} /></label>
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
        <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 md:gap-4 ${!editable && readOnly ? 'pv-body' : ''}`}>
          <div className={`flex flex-wrap items-center justify-between gap-2 ${!editable && readOnly ? 'pv-pad' : ''}`}>
            {!sheetView && <div>
              {editable ? <input className="w-full max-w-[26rem] rounded-xl border bg-transparent px-3 py-1 text-[1.2rem] md:text-[1.5rem] font-extrabold outline-none focus:border-[#3d7bff]" style={{ borderColor: 'var(--glass-b)' }} maxLength={60} value={title} placeholder={tx.namePh} onChange={(e) => { ver.current += 1; setTitle(e.target.value); setDirty(true); }} />
                : <h2 className="text-[1.7rem] md:text-[2rem] font-extrabold">{title}</h2>}
              {editable && <input className="mt-1.5 w-full max-w-[26rem] rounded-xl border bg-transparent px-3 py-1 text-[.85rem] outline-none focus:border-[#3d7bff]" style={{ borderColor: 'var(--glass-b)' }} maxLength={60} value={br.org ?? ''} placeholder={`${tx.org} · ${tx.orgPh}`} aria-label={tx.org} onChange={(e) => { const v = e.target.value.slice(0, 60); const { org: _o, ...rest } = br; void _o; ver.current += 1; setBr(v ? { ...rest, org: v } : rest); setDirty(true); }} />}
              {!editable && br.org && <p className="mt-1 text-[.95rem] font-semibold" style={{ color: 'var(--muted)' }}>{tx.orgBy}: <span dir="auto" style={{ color: 'var(--text)' }}>{br.org}</span></p>}
              {!editable && <p className="mt-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.readonly}</p>}
            </div>}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isDraft(br) && (champ !== null || editable) && <WinnerCard pill bracket={br} lang={lang === 'en' ? 'en' : 'ar'} editable={editable} onChange={editable ? (b) => edit(b) : undefined} />}
              <BracketActions undo={editable ? { onUndo: doUndo, onRedo: doRedo, canUndo: hist.canUndo, canRedo: hist.canRedo } : undefined} linkOk={!editable || (!!id && share)} bracket={br} title={shownTitle} url={editable && id ? viewUrl : url} />
              {editable && <button type="button" className={`${pill} text-white`} style={{ background: 'linear-gradient(135deg,#3d7bff,#5b5ff0)', borderColor: 'transparent' }} disabled={busy} onClick={save}>{busy ? tx.saving : tx.save}</button>}
            </div>
          </div>
          {(msg || dirty) && <p role="status" className="text-[.85rem]" style={{ color: msg === tx.saved ? '#27c27a' : '#ffb02e' }}>{msg || tx.unsaved}</p>}
          {editable && br && (isLeague(br) || br.format === 'groups' || br.format === 'ffa') && <p className="text-[.9rem]" style={{ color: 'var(--muted)' }}>{tx.hintL}</p>}
          <div className="st-stage">
          {sheetView ? <BracketSheetAny bracket={br} title={shownTitle} lang={lang === 'en' ? 'en' : 'ar'} /> : <div className="st-brcard rounded-2xl border p-3" style={card}><BracketView bracket={br} onApply={editable ? edit : undefined} canRename onChange={editable ? edit : undefined} onRename={editable ? (i, v) => { if (hasName(br, v, i)) { setMsg(tx.dupName); return; } edit(renamePlayer(br, i, v)); } : undefined} onSwap={editable && (br.format === 'single' || br.format === 'double') ? (a, b) => { const nb = swapSeats(br, a, b); if (nb) edit(nb); } : undefined} pub={!!readOnly && !editable} /></div>}
          </div>
          {editable && <AddPlayerBar lang={lang} onAdd={addToBracket} existing={br?.players ?? []} />}
          {editable && id && auth.user && <EditorsPanel id={id} lang={lang === 'en' ? 'en' : 'ar'} userId={auth.user.id} style={card} />}
          {editable && isOwner && (
            <div className="st-share" style={card}>
              <b>{tx.shTitle}</b>
              {!id ? <p className="st-shn">{tx.shSave}</p> : (
                <>
                  <div className="st-shr">
                    <div className="st-shh">
                      <div><span>{tx.shView}</span><small>{tx.shViewD}</small></div>
                    </div>
                    {share && <div className="st-shl"><input readOnly dir="ltr" value={noProto(viewUrl)} onFocus={(e) => e.currentTarget.select()} /><button type="button" onClick={() => copyLink('share', viewUrl)}>{copied === 'share' ? tx.shCopied : tx.shCopy}</button></div>}
                  </div>
                </>
              )}
            </div>
          )}
          {editable && isOwner && id && <JoinPanel id={id} lang={lang === 'en' ? 'en' : 'ar'} link={`${base()}/j/${id}`} />}
          {editable && isOwner && id && <RegistrantsCard id={id} lang={lang === 'en' ? 'en' : 'ar'} players={br?.players ?? []} onAdd={addToBracket} onUnadd={removeFromBracket} onUnaddAll={removeAllFromBracket} bench={br?.bench} autoOn={br?.auto !== false} onAuto={SHOW_AUTO_TOGGLE ? (on) => br && edit(setAuto(br, on)) : undefined} auto={!!br && (!SHOW_AUTO_TOGGLE || br.auto !== false) && !hasResults(br)} />}
          {editable && isOwner && id && <CommunityListing id={id} share={share} lang={lang} title={title} />}
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
