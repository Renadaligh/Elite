import { siteUrl, noProto } from '../hooks/nav';
import { go as navTo } from '../hooks/nav';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { reshuffle, canPlace, setPlace, canThird, setThird, MAX_PLAYERS, MAX_RR, isLeague, champion, setOrg, generate, addPlayers, removePlayer, setBench, setAuto, nameKey, draftBracket, hasResults, isDraft, resolve, shuffled, swapSeats, swapPlayers, renamePlayer, dupNames, hasName, type BFormat, type BMatch, type Bracket } from '../data/bracket';
import { useAuth, type AuthUser, type Providers } from '../hooks/useAuth';
import { useI18n } from '../i18n/I18nProvider';
import { joinPath, viewPath } from '../data/links';
import { api } from '../services/api';
import BracketActions from './BracketActions';
import BracketHeadCard, { PodiumRow } from './BracketHeadCard';
import PublishToggle from './PublishToggle';
import InfoFields, { defaultStart } from './InfoFields';
import RegistrantsCard from './RegistrantsCard';
import JoinPanel from './JoinPanel';
import NewRegOpts, { regInit, defaultClose, type RegOpts } from './NewRegOpts';
import RegFormEditor from './RegFormEditor';
import { useMedia } from '../hooks/useMedia';
import EditorsPanel from './EditorsPanel';
import Fold, { FlatFold } from './Fold';
import type { BInfo } from '../data/bracket';
import { AddPlayerBar, commitAutoAdds } from './AddPlayers';
import BracketSheetAny from './BracketSheetAny';
import { useBracketHistory } from '../hooks/useBracketHistory';
import BracketView from './BracketView';
import EmailLogin from './EmailLogin';
import { buildBracket, fmtInit, hasOpts, loOf, toOpts, type FmtState } from './FormatOpts';
import { shrinkImage } from '../data/shrinkImage';

const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';
const DRAFT = 'elite-bracket-draft';
const card = { background: 'var(--glass)', borderColor: 'var(--glass-b)' };
const inp = 'w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[.95rem] outline-none focus:border-[#3d7bff]';
const pill = 'rounded-full border px-4 py-2 text-[.85rem] font-semibold disabled:opacity-60';

export const TXT = {
  ar: {
    title: 'أداة تنظيم البطولات', sub: 'أنشئ بطولة لأي خادم أو مجتمع: خروج مغلوب أو مزدوج أو دوري أو سويسري. حدّث النتائج واحفظها كصورة أو شاركها.',
    name: 'اسم البطولة', namePh: 'مثلاً: كأس خادم الأصدقاء', nameEn: 'اسم البطولة بالإنجليزي', nameEnPh: 'e.g. Friends Server Cup', format: 'النظام', single: 'خروج المغلوب (فردي)', double: 'خروج مزدوج', rr: 'دوري (كل لاعب ضد الكل)', swiss: 'سويسري', groups: 'مجموعات ثم إقصائيات', ffa: 'لوحة صدارة (الكل ضد الكل)', dbl: 'دوري مزدوج (ذهاب وإياب)', maxRr: `الدوري: الحد الأقصى ${MAX_RR}`, dupName: 'هذا الاسم مستخدم عند لاعب آخر.', dupList: 'توجد أسماء مكررة، عدّلها أولاً: ', players: 'اللاعبون / الفرق (سطر لكل واحد، الأعلى = الأقوى)',
    shuffle: 'قرعة عشوائية للاعبين', create: 'إنشاء البطولة', need: 'أدخل لاعبَين على الأقل', max: `الحد الأقصى ${MAX_RR}`,
    hint: 'اضغط على اسم الفائز في كل مباراة لتحديثه.', hintL: 'اكتب النتيجة في كل مباراة (أو الأرقام في كل جولة) والترتيب يتحدث تلقائياً.', score: 'نتيجة المباراة', undo: 'تراجع', save: 'حفظ في بطولاتي', saved: 'تم الحفظ', saving: '…', mine: 'بطولاتي',
    login: 'تسجيل الدخول', logout: 'خروج', loginTitle: 'سجّل دخولك لتحفظ بطولاتك', loginSub: 'تجد كل بطولاتك في مكان واحد وترجع لها من أي جهاز. ما ننشر شيء باسمك.',
    discord: 'الدخول بحساب Discord', google: 'الدخول بحساب Google', none: 'تسجيل الدخول غير مفعّل بعد.', close: 'إغلاق',
    editPlayers: 'تعديل أسماء اللاعبين', rebuild: 'إعادة البناء', rebuildAsk: 'إعادة البناء تمسح النتائج الحالية. متأكد؟', renameNote: 'تغيير الاسم يحافظ على النتائج.',
    notFound: 'البطولة غير موجودة.', by: 'من', copy: 'انسخه لأعدّله', readonly: 'عرض فقط', unsaved: 'لم تُحفظ التعديلات بعد',
    loginFailed: 'تعذّر تسجيل الدخول، جرّب مرة أخرى.', loginUnavailable: 'تسجيل الدخول غير مفعّل بعد.', limit: 'وصلت الحد الأقصى من البطولات المحفوظة (100). احذف واحد قديم.', private: 'هذه البطولة غير منشورة. اطلب من صاحبها تفعيل رابط العرض.', shTitle: 'المشاركة', shView: 'نشر رابط للعرض', shViewD: 'يستطيع أي شخص لديه الرابط مشاهدة البطولة (عرض فقط).', shCopy: 'نسخ', shCopied: 'تم النسخ', shSave: 'احفظ البطولة أولاً لتفعيل المشاركة.', twitch: 'الدخول بحساب Twitch', steam: 'الدخول بحساب Steam', orMail: 'أو بالبريد', saveFail: 'تعذّر الحفظ',
    myTitle: 'بطولاتي', newOne: '+ بطولة جديدة', empty: 'ليس لديك بطولات محفوظة بعد.', open: 'فتح وتعديل', link: 'نسخ الرابط', linkDone: 'تم نسخ الرابط', img: 'صورة', del: 'حذف', delAsk: 'حذف هذه البطولة؟',
    needLogin: 'سجّل دخولك لترى بطولاتك المحفوظة.', players_n: 'لاعبين', hello: 'أهلاً',
    needName: 'اكتب اسم البطولة أولاً', info: 'معلومات البطولة', apply: 'تطبيق النظام', applyAsk: 'تغيير النظام يمسح النتائج الحالية. متأكد؟', org: 'اسم المنظم / المجموعة (اختياري)', orgPh: 'مثلاً: النخبة', orgBy: 'تنظيم',
  },
  en: {
    title: 'Bracket tool', sub: 'Make a bracket for any server or community: single or double elimination, round robin or swiss. Update results, save it as an image or share it.',
    name: 'Tournament name', namePh: 'مثلاً: كأس خادم الأصدقاء', nameEn: 'Tournament name in English', nameEnPh: 'e.g. Friends Server Cup', format: 'Format', single: 'Single elimination', double: 'Double elimination', rr: 'Round robin', swiss: 'Swiss', groups: 'Groups then knockout', ffa: 'Leaderboard (free-for-all)', dbl: 'Double round robin (home & away)', maxRr: `Round robin: max ${MAX_RR}`, dupName: 'This name is already used by another player.', dupList: 'Some names are repeated, fix them first: ', players: 'Players / teams (one per line, top = strongest seed)',
    shuffle: 'Random draw for players', create: 'Create bracket', need: 'Enter at least 2 players', max: `Max ${MAX_RR}`,
    hint: 'Click the winner of each match to update it.', hintL: 'Type the score of each match (or round); the standings update automatically.', score: 'Match score', undo: 'Undo', save: 'Save to my brackets', saved: 'Saved', saving: '…', mine: 'My brackets',
    login: 'Sign in', logout: 'Sign out', loginTitle: 'Sign in to save your brackets', loginSub: 'Find all your brackets in one place from any device. We never post anything for you.',
    discord: 'Continue with Discord', google: 'Continue with Google', none: 'Sign-in is not enabled yet.', close: 'Close',
    editPlayers: 'Edit player names', rebuild: 'Rebuild', rebuildAsk: 'Rebuilding clears the current results. Sure?', renameNote: 'Renaming keeps the results.',
    notFound: 'Bracket not found.', by: 'by', copy: 'Copy to edit', readonly: 'View only', unsaved: 'Unsaved changes',
    loginFailed: 'Sign-in failed, please try again.', loginUnavailable: 'Sign-in is not enabled yet.', limit: 'You reached the limit of saved brackets (100). Delete an old one.', private: 'This bracket is not published. Ask its owner to turn on the view link.', shTitle: 'Sharing', shView: 'Publish a view link', shViewD: 'Anyone with the link can view the bracket (read-only).', shCopy: 'Copy', shCopied: 'Copied', shSave: 'Save the bracket first to turn on sharing.', twitch: 'Continue with Twitch', steam: 'Continue with Steam', orMail: 'or by email', saveFail: 'Could not save',
    myTitle: 'My brackets', newOne: '+ New bracket', empty: 'No saved brackets yet.', open: 'Open & edit', link: 'Copy link', linkDone: 'Link copied', img: 'Image', del: 'Delete', delAsk: 'Delete this bracket?',
    needLogin: 'Sign in to see your saved brackets.', players_n: 'players', hello: 'Hi',
    needName: 'Enter the tournament name first', info: 'Tournament info', apply: 'Apply format', applyAsk: 'Changing the format clears the current results. Sure?', org: 'Organizer / group name (optional)', orgPh: 'e.g. Elite', orgBy: 'Organised by',
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

interface Draft { title: string; titleEn?: string; names: string; fmt: BFormat; br: Bracket | null; org?: string }
const readDraft = (): Draft => { try { const d = JSON.parse(localStorage.getItem(DRAFT) ?? ''); if (d && typeof d.title === 'string') return d; } catch { /* none */ } return { title: '', names: '', fmt: 'single', br: null }; };

/** Sections of a saved tournament; each is a page of its own. In the dashboard the side menu (desktop) shows the same list, so the strip only shows on phones. */
export type EditorTab = 'tree' | 'info' | 'editors' | 'join' | 'regs';
export interface TabDef { k: EditorTab; label: string }
export function Editor({ id, tx, auth, readOnly, onForeign, tab: tabProp, onTab, onTabs }: { id?: string; tx: Tx; auth: ReturnType<typeof useAuth>; readOnly?: boolean; onForeign?: () => void; tab?: EditorTab; onTab?: (t: EditorTab) => void; onTabs?: (t: TabDef[]) => void }) {
  const { lang } = useI18n();
  const init = useMemo(() => (id ? { title: '', names: '', fmt: 'single' as BFormat, br: null } : readDraft()), [id]);
  const [title, setTitle] = useState(init.title);
  const [titleEn, setTitleEn] = useState((init as Draft).titleEn ?? '');
  const [org, setOrgName] = useState((init as Draft).org ?? '');
  const [names, setNames] = useState(init.names);
  const [fmt, setFmt] = useState<BFormat>(init.br?.format ?? init.fmt);
  const [br, setBr] = useState<Bracket | null>(init.br);
  const [owner, setOwner] = useState('');
  const [mine, setMine] = useState(!id);
  const [isOwner, setIsOwner] = useState(true); // false = co-editor added by the owner
  const [perms, setPerms] = useState<string[]>([]); // what a co-editor may do: tree, info, join, regs (the owner may do all; sending it to the site is the owner's only)
  const [site, setSite] = useState(false); // a site tournament the member was added to: no co-editors card, no publishing
  const can = (k: string) => isOwner || perms.includes(k);
  const [state, setState] = useState<'load' | 'ok' | 'missing' | 'private'>(id ? 'load' : 'ok');
  const share = true; // the view link is always on
  const [copied, setCopied] = useState('');
  const [login, setLogin] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lo, setLo] = useState<FmtState>(init.br ? loOf(init.br) : fmtInit());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(() => { const n = loginNote(); return n === 'failed' ? tx.loginFailed : n === 'unavailable' ? tx.loginUnavailable : ''; });
  const [, setEditP] = useState(false);
  const [secOpen, setSecOpen] = useState(false);
  const [tabS, setTabS] = useState<EditorTab>('tree');
  const tab = tabProp ?? tabS;
  const setTab = onTab ?? setTabS;
  const [ownerAv, setOwnerAv] = useState('');
  const [reg, setReg] = useState<RegOpts>(regInit); // registration link options chosen on the "new tournament" form
  const [newInfo, setNewInfo] = useState<BInfo>(() => ({ startsAt: defaultStart(), total: 0, mode: 'solo' })); // the form of a tournament being created
  const [newCover, setNewCover] = useState<File | null>(null);
  const wide = useMedia('(min-width:1024px)'); // two-column layout: the publish switch sits with "Add players" (on a phone it sits in the tournament card)
  const [designing, setDesigning] = useState(false); // the registration page designer is open (new tournament form)
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [cover, setCover] = useState(''); // picture of a saved tournament (kept with its registration link)
  const [coverBusy, setCoverBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<{ title: string; bracket: Bracket | null; owner: string; ownerAvatar?: string; mine: boolean; isOwner?: boolean; perms?: string[]; share: boolean; site?: boolean }>(`/brackets/${id}`)
      .then((r) => { if (!r.mine && onForeign) { onForeign(); return; } if (!r.bracket) { setState('missing'); return; } setTitle(r.title); setTitleEn(r.bracket.titleEn ?? ''); setFmt(r.bracket.format); setLo(loOf(r.bracket)); setBr(r.bracket); setOwner(r.owner); setOwnerAv(r.ownerAvatar ?? ''); setMine(r.mine && !readOnly); setIsOwner(r.isOwner !== false); setPerms(r.perms ?? ['tree', 'info']); setSite(!!r.site); setState('ok'); })
      .catch((e: Error & { detail?: string }) => setState(e.detail === 'private' ? 'private' : 'missing'));
  }, [id, auth.user?.id]);

  // Guests keep their work in the browser, so signing in (a page round-trip) never loses it.
  useEffect(() => { if (id) return; try { localStorage.setItem(DRAFT, JSON.stringify({ title, titleEn, names, fmt, br, org })); } catch { /* private mode */ } }, [id, title, titleEn, names, fmt, br, org]);

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
  const url = id ? `${base()}${viewPath(id)}` : `${base()}/bracket`;
  const shownTitle = title.trim() || (lang === 'ar' ? 'بطولة' : 'Bracket');
  const displayTitle = (lang === 'en' && titleEn.trim() ? titleEn.trim() : shownTitle);

  /** "New tournament": the whole settings form (name, organiser, format, game, start, seats, type, prize, picture), then the empty tree opens and is saved at once. */
  function create() {
    if (!title.trim()) { setMsg(tx.needName); return; }
    if (!newInfo.gameId) { setMsg(lang === 'ar' ? 'اختر اللعبة' : 'Choose a game'); return; }
    if (!newInfo.startsAt) { setMsg(lang === 'ar' ? 'حدد تاريخ ووقت البداية' : 'Choose the start date and time'); return; }
    justMade.current = true;
    const opts = hasOpts(fmt) ? toOpts(fmt, lo, 0) : undefined;
    edit({ ...setOrg(buildBracket(fmt, [], opts, lo), org), info: reg.on && reg.showCount ? newInfo : { ...newInfo, showCount: false }, ...(reg.on && reg.auto ? {} : { auto: false as const }) });
  }
  const fmtLabels = { single: tx.single, double: tx.double, rr: tx.rr, swiss: tx.swiss, groups: tx.groups, ffa: tx.ffa } as Record<BFormat, string>;
  /** Details edits are not "steps" for Undo: they change the bracket quietly (and autosave). */
  const patchBr = (nb: Bracket) => { ver.current += 1; setBr(nb); setDirty(true); setMsg(''); };
  const setInfo = (patch: Partial<BInfo>) => { if (br) patchBr({ ...br, info: { ...(br.info ?? {}), ...patch } }); };
  const uploadCover = async (bid: string, f: File) => {
    const fd = new FormData(); fd.append('file', await shrinkImage(f, 1280), 'image');
    const res = await fetch(`/api/brackets/${bid}/image`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { url: string };
    await api(`/brackets/${bid}/join`, { method: 'PUT', body: JSON.stringify({ cover: j.url }) });
    return j.url;
  };
  async function pickCover(f: File | null) {
    if (!id) { setNewCover(f); setNewCoverUrl(f ? URL.createObjectURL(f) : ''); return; }
    setCoverBusy(true);
    try {
      if (!f) { await api(`/brackets/${id}/join`, { method: 'PUT', body: JSON.stringify({ cover: '' }) }); setCover(''); }
      else setCover(await uploadCover(id, f));
    } catch { setMsg(lang === 'ar' ? 'تعذّر رفع الصورة' : 'Could not upload the picture'); }
    setCoverBusy(false);
  }
  // picture of a saved tournament
  useEffect(() => {
    if (!id || !mine || !(isOwner || perms.includes('info') || perms.includes('join'))) return;
    api<{ cover?: string }>(`/brackets/${id}/join`).then((d) => setCover(d.cover ?? '')).catch(() => undefined);
  }, [id, mine, isOwner, perms]);
  // a tournament made before the details card existed: take them from its published copy (if any), once
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !id || !mine || !isOwner || !br || br.info) return;
    seeded.current = true;
    api<{ listing: { gameId?: string; prize?: string; startsAt?: string; total?: number; mode?: 'solo' | 'team' } | null }>(`/brackets/${id}/listing`).then((r) => {
      const l = r.listing;
      const info: BInfo = l ? { ...(l.gameId ? { gameId: l.gameId } : {}), ...(l.prize ? { prize: l.prize } : {}), ...(l.startsAt ? { startsAt: l.startsAt } : {}), total: l.total ?? 0, mode: l.mode === 'team' ? 'team' : 'solo' } : { startsAt: defaultStart(), total: 0, mode: 'solo' };
      setBr((b) => (b && !b.info ? { ...b, info } : b));
    }).catch(() => undefined);
  }, [id, mine, isOwner, br]);
  // seats / type / start date also live on the registration link: keep it in step
  const joinKey = br?.info ? `${br.info.mode ?? 'solo'}|${br.info.total ?? 0}|${br.info.startsAt ?? ''}` : '';
  const joinSent = useRef('');
  useEffect(() => {
    if (!id || !mine || !(isOwner || perms.includes('info') || perms.includes('join')) || !joinKey) return undefined;
    if (joinSent.current === '') { joinSent.current = joinKey; return undefined; }
    if (joinSent.current === joinKey) return undefined;
    const inf = br?.info; if (!inf) return undefined;
    const h = window.setTimeout(() => { joinSent.current = joinKey; void api(`/brackets/${id}/join`, { method: 'PUT', body: JSON.stringify({ mode: inf.mode ?? 'solo', cap: Math.min(1000, inf.total ?? 0), ...(inf.startsAt ? { startsAt: inf.startsAt } : {}) }) }).catch(() => undefined); }, 1000);
    return () => window.clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinKey, id, mine, isOwner, perms]);
  const tabsDef: TabDef[] = id && mine ? [
    { k: 'tree', label: lang === 'ar' ? 'الشجرة' : 'Bracket' }, ...(can('info') ? [{ k: 'info' as const, label: tx.info }] : []), ...(site ? [] : [{ k: 'editors' as const, label: lang === 'ar' ? 'إضافة منظم' : 'Add organizer' }]),
    ...(can('join') ? [{ k: 'join' as const, label: lang === 'ar' ? 'رابط التسجيل' : 'Registration link' }] : []),
    ...(can('regs') ? [{ k: 'regs' as const, label: lang === 'ar' ? 'المسجلون' : 'Participants' }] : []),
  ] : [];
  const tabsKey = tabsDef.map((t) => `${t.k}:${t.label}`).join('|');
  useEffect(() => { onTabs?.(tabsDef); return () => onTabs?.([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tabsKey]);
  /** Changes the format / its settings of the open tournament: the players stay, the matches are redrawn (a random draw if ticked). */
  function applyFmt() {
    if (!br) return;
    if (hasResults(br) && !window.confirm(tx.applyAsk)) return;
    const list = br.players;
    if (fmt === 'rr' && list.length > MAX_RR) { setMsg(tx.maxRr); return; }
    const opts = hasOpts(fmt) ? toOpts(fmt, lo, list.length) : undefined;
    const nb0 = setOrg(buildBracket(fmt, list, opts, { ...lo, place: lo.place && !!br.place }), br.org ?? '');
    const nb1 = br.third && fmt === 'single' && canThird(nb0) ? setThird(nb0, true) : nb0;
    const nb = br.place && (fmt === 'single' || fmt === 'double') && list.length >= 2 ? { ...setPlace(nb1, true, lo.placeTo), place: true as const } : nb1;
    edit({ ...nb, ...(br.info ? { info: br.info } : {}), ...(br.bench ? { bench: br.bench } : {}), ...(br.auto === false ? { auto: false as const } : {}) });
  }
  const rename = async (i: number, v: string) => {
    if (!br) return;
    const old = br.players[i], nv = v.slice(0, 80);
    // a registered player: the server applies the registration form's rules first (English ID, not taken, team name not taken); if it says no, the name stays as it was
    if (id && mine && can('regs') && old && nameKey(old) !== nameKey(nv) && nv.trim()) {
      try { await api(`/brackets/${id}/regname`, { method: 'PUT', body: JSON.stringify({ from: old, name: nv }) }); window.dispatchEvent(new Event('elite-regs-refresh')); }
      catch (e) {
        const d = (e as Error & { detail?: string }).detail ?? '';
        const msg = ({ bad_id: lang === 'ar' ? 'اكتب المعرّف بالإنجليزي (حروف وأرقام و _ فقط)' : 'Write the ID in English (letters, numbers and _ only)', duplicate: lang === 'ar' ? 'هذا المعرّف مسجّل بالفعل في البطولة' : 'This ID is already registered in this tournament', duplicate_members: lang === 'ar' ? 'معرّف مكرر في الفريق' : 'An ID is repeated in the team', required: lang === 'ar' ? 'الفريق يحتاج معرّفين على الأقل، افصل بينهم بـ |' : 'A team needs at least two IDs, separate them with |' } as Record<string, string>)[d];
        if (msg) { window.alert(msg); return; }
      }
    }
    edit({ ...br, players: br.players.map((p, j) => (j === i ? nv : p)) });
  };
  /** a person renamed in the registrants list: the same name inside the bracket (and the "out of the bracket" list) changes too */
  const renameByName = (from: string, to: string) => {
    if (!br) return;
    const k = nameKey(from), i = br.players.findIndex((p) => nameKey(p) === k), inBench = !!br.bench?.some((b) => nameKey(b) === k);
    if (i < 0 && !inBench) return;
    edit({ ...br, ...(i >= 0 ? { players: br.players.map((p, j) => (j === i ? to.slice(0, 80) : p)) } : {}), ...(inBench ? { bench: (br.bench ?? []).map((b) => (nameKey(b) === k ? to.slice(0, 80) : b)) } : {}) });
  };
  function addToBracket(add: string[]) {
    if (!br) return;
    const have = new Set(br.players.map((p) => p.trim().toLowerCase()));
    if (!add.some((n) => n.trim() && !have.has(n.trim().toLowerCase()))) return;
    if (br.format === 'rr' && br.players.length + add.length > MAX_RR) { setMsg(tx.maxRr); return; }
    // players join without a rebuild: the bracket is redrawn around them. Only if results exist does it ask first (they are cleared; Undo brings them back).
    if (hasResults(br) && !window.confirm(lang === 'ar' ? 'إضافة لاعبين بعد بدء المباريات تمسح النتائج الحالية (ويمكنك التراجع). هل أنت متأكد؟' : 'Adding players after matches started clears the current results (Undo brings them back). Sure?')) return;
    edit(setBench(addPlayers(br, add), (br.bench ?? []).filter((b) => !add.some((a) => nameKey(a) === nameKey(b))))); setMsg('');
  }
  /** Two names traded places in the Registrants list: their seats in the tree trade places (after results the bracket is redrawn, which clears them: ask first). */
  function reorderPlayers(a: string, b: string) {
    if (!br) return;
    const i = br.players.findIndex((p) => nameKey(p) === nameKey(a)), j = br.players.findIndex((p) => nameKey(p) === nameKey(b));
    if (i < 0 || j < 0 || i === j) return;
    if (hasResults(br) && !window.confirm(lang === 'ar' ? 'تغيير الأماكن بعد بدء المباريات يمسح النتائج الحالية (ويمكنك التراجع). هل أنت متأكد؟' : 'Changing places after matches started clears the current results (Undo brings them back). Sure?')) return;
    edit(swapPlayers(br, i, j)); setMsg('');
  }
  /** keep = a player added by hand: he stays in the registrants list (with +) after leaving the bracket. */
  function removeFromBracket(name: string, keep = false) {
    if (!br) return;
    const inBr = br.players.some((p) => nameKey(p) === nameKey(name));
    if (inBr && hasResults(br) && !window.confirm(lang === 'ar' ? 'إزالة لاعب بعد بدء المباريات تمسح النتائج الحالية (ويمكنك التراجع). هل أنت متأكد؟' : 'Removing a player after matches started clears the current results (Undo brings them back). Sure?')) return;
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

  const [draftEd, setDraftEd] = useState<string[]>([]);
  const justMade = useRef(false); // the bracket was just created here: save it at once (no "save" button, no trip to the saved list)
  async function save() {
    if (!br) return;
    if (!auth.user) { setLogin(true); return; }
    setBusy(true); setMsg('');
    const sent = ver.current;
    try {
      const cw = champion(br); // the winner closes the published tournament (winner + end date are written by themselves)
      const body = JSON.stringify({ title: shownTitle, bracket: { ...br, titleEn: titleEn.trim() }, champion: cw !== null ? br.players[cw] ?? '' : '' });
      if (id) { await api(`/brackets/${id}`, { method: 'PUT', body }); commitAutoAdds(id); if (ver.current === sent) setDirty(false); setMsg(tx.saved); }
      else {
        const r = await api<{ id: string }>('/brackets', { method: 'POST', body });
        const inf = br.info;
        if (inf) { try { await api(`/brackets/${r.id}/join`, { method: 'PUT', body: JSON.stringify({ mode: inf.mode ?? 'solo', cap: Math.min(1000, inf.total ?? 0), ...(inf.startsAt ? { startsAt: inf.startsAt } : {}), ...(reg.on ? { form: reg.form, enabled: true, closesAt: reg.autoClose ? (reg.closeAt || defaultClose(inf.startsAt)) : 0, description: reg.desc.trim(), doneMsg: reg.done.trim() } : {}) }) }); } catch { /* the details are also kept inside the bracket */ } }
        if (newCover) { try { await uploadCover(r.id, newCover); } catch { /* can be added later from Tournament info */ } }
        const bad: { h: string; c: string }[] = [];
        for (const h of draftEd) { try { await api(`/brackets/${r.id}/editors`, { method: 'POST', body: JSON.stringify({ handle: h }) }); } catch (e) { bad.push({ h, c: (e as Error & { detail?: string }).detail ?? '' }); } }
        if (bad.length) { try { sessionStorage.setItem(`plato-editor-fail-${r.id}`, JSON.stringify(bad)); } catch { /* ignore */ } } // shown once on the new bracket's co-editors card
        try { localStorage.removeItem(DRAFT); } catch { /* ignore */ }
        navTo(`/bracket/${r.id}`, true); // replaces the "new" page in the history, so Back returns to where the user was
      }
    } catch (e) { failed.current = sent; setMsg((e as Error & { detail?: string }).detail === 'limit' ? tx.limit : tx.saveFail); }
    setBusy(false);
  }
  // a bracket that was just created is saved right away (signed-in users); it opens at its own address and goes on autosaving
  useEffect(() => {
    if (id || !justMade.current || !br || !auth.user || busy) return;
    justMade.current = false;
    void save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [br]);
  // a final decided before the winner sync existed: sync the published tournament once on open
  const syncedChamp = useRef(false);
  useEffect(() => {
    if (syncedChamp.current || !id || !mine || !br || !auth.user || busy || champion(br) === null) return;
    syncedChamp.current = true; void save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mine, br, auth.user]);
  // saved brackets save themselves ~1.5 s after the last change (new, unsaved ones still need the button: they have no name/link yet)
  useEffect(() => {
    if (!id || !mine || !dirty || busy || !br || !auth.user || failed.current === ver.current) return undefined;
    const h = window.setTimeout(() => { void save(); }, 1500);
    return () => window.clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mine, dirty, busy, br, title, titleEn, auth.user]);
  async function copyLink(key: string, link: string) {
    try { await navigator.clipboard.writeText(noProto(link)); setCopied(key); window.setTimeout(() => setCopied(''), 1800); } catch { window.prompt('', noProto(link)); }
  }

  const R = br ? resolve(br) : null;
  const champ = br ? champion(br) : null;
  const editable = mine;
  const canTree = mine && can('tree'); // may change results / players / format; without it the tree is only shown
  const sheetView = !editable && !!readOnly && !!br && !isDraft(br) ; // public view link: the whole bracket on one white sheet

  if (state === 'load') return <p style={{ color: 'var(--muted)' }}>…</p>;
  if (state === 'missing') return <p className="text-lg">{tx.notFound}</p>;
  if (state === 'private') return <p className="text-lg">{tx.private}</p>;
  const viewUrl = id ? `${base()}${viewPath(id)}` : `${base()}/bracket`;

  const ar = lang !== 'en';
  const L2 = lang === 'en' ? 'en' : 'ar';
  const flat = (node: ReactNode) => <FlatFold.Provider value>{node}</FlatFold.Provider>;
  return (
    <>
      {!br ? (
        editable && (designing ? (
          <RegFormEditor lang={L2} title={title} org={org} mode={newInfo.mode ?? 'solo'} cover={newCoverUrl} onCover={(f) => void pickCover(f)} desc={reg.desc} onDesc={(desc) => setReg((o) => ({ ...o, desc }))} form={reg.form} onForm={(form) => setReg((o) => ({ ...o, form }))} onClose={() => setDesigning(false)} />
        ) : (
          <div className="st-nf grid gap-4 rounded-2xl border p-5" style={card}>
            <b className="text-[1.1rem]">{tx.info}</b>
            <InfoFields wide lang={L2} title={title} onTitle={setTitle} org={org} onOrg={setOrgName} fmt={fmt} onFmt={setFmt} lo={lo} onLo={setLo} players={0} fmtLabels={fmtLabels}
              placeOpt={{ on: lo.place, disabled: false, set: (on) => setLo({ ...lo, place: on }), to: lo.placeTo, setTo: (n) => setLo({ ...lo, placeTo: n }) }}
              info={newInfo} onInfo={(pt) => setNewInfo((o) => ({ ...o, ...pt }))} cover={newCoverUrl} onCover={(f) => void pickCover(f)}
              after={<NewRegOpts lang={L2} v={reg} onChange={(pt) => setReg((o) => ({ ...o, ...pt }))} startsAt={newInfo.startsAt} onDesign={() => setDesigning(true)} />} />
            <div><button type="button" className="btn-primary" onClick={create}>{tx.create}</button></div>
            {msg && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{msg}</p>}
          </div>
        ))
      ) : (
        <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 md:gap-4 ${!editable && readOnly ? 'pv-body' : ''}`}>
          {tabsDef.length > 0 && (
            <div className="st-secsel">
              <button type="button" className="st-secbtn" aria-haspopup="listbox" aria-expanded={secOpen} onClick={() => setSecOpen((o) => !o)}><span>{tabsDef.find((t) => t.k === tab)?.label}</span><span className="st-chev" aria-hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: secOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="m6 9 6 6 6-6" /></svg></span></button>
              {secOpen && <>
                <button type="button" className="st-secbd" aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'} onClick={() => setSecOpen(false)} />
                <div className="st-secmenu" role="listbox">{tabsDef.map((t) => <button key={t.k} type="button" role="option" aria-selected={tab === t.k} className={tab === t.k ? 'on' : ''} onClick={() => { setTab(t.k); setSecOpen(false); }}>{t.label}</button>)}</div>
              </>}
            </div>
          )}
          {(!editable || !id || tab === 'tree') && (
            <>
              {editable ? (
                <div className="hc-grid">
                  <BracketHeadCard bracket={br} title={shownTitle} ownerName={owner || auth.user?.handle || auth.user?.name || ''} avatar={ownerAv || auth.user?.avatar} formatLabel={fmtLabels[br.format]} lang={L2} foot={(!wide || !canTree) && isOwner && id ? <PublishToggle id={id} lang={L2} name={title} info={br.info} cover={cover} onPickCover={pickCover} /> : undefined} />
                  {canTree && <FlatFold.Provider value={wide}>{/* wide screens: the card is always open and as tall as the tournament card */}
                    <Fold title={ar ? 'إضافة لاعبين' : 'Add players'} style={card} defaultOpen>
                      <AddPlayerBar lang={lang} onAdd={addToBracket} existing={br?.players ?? []} />
                      {wide && isOwner && id && <PublishToggle id={id} lang={L2} name={title} info={br.info} cover={cover} onPickCover={pickCover} />}
                    </Fold>
                  </FlatFold.Provider>}
                </div>
              ) : (
                <div className={`flex flex-wrap items-center justify-between gap-2 ${readOnly ? 'pv-pad' : ''}`}>
                  {!sheetView && <div>
                    <h2 className="text-[1.7rem] md:text-[2rem] font-extrabold">{title}</h2>
                    {br.org && <p className="mt-1 text-[.95rem] font-semibold" style={{ color: 'var(--muted)' }}>{tx.orgBy}: <span dir="auto" style={{ color: 'var(--text)' }}>{br.org}</span></p>}
                    <p className="mt-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.readonly}</p>
                  </div>}
                </div>
              )}
              <div className={`flex flex-wrap items-center justify-between gap-2 ${!editable && readOnly ? 'pv-pad' : ''}`}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <BracketActions undo={canTree ? { onUndo: doUndo, onRedo: doRedo, canUndo: hist.canUndo, canRedo: hist.canRedo } : undefined} linkOk={!editable || (!!id && share)} bracket={br} title={displayTitle} url={editable && id ? viewUrl : url} exportId={id} exportTheme={typeof document !== 'undefined' && (document.querySelector('[data-st]')?.getAttribute('data-st') === 'light' || (!document.querySelector('[data-st]') && document.documentElement.dataset.hero === 'day')) ? 'light' : 'dark'} beforeExport={dirty && editable ? save : undefined} onShuffle={canTree ? () => { if (hasResults(br) && !window.confirm(lang === 'ar' ? 'خلط الأماكن يمسح النتائج الحالية (ويمكنك التراجع). متأكد؟' : 'Shuffling clears the current results (you can undo). Sure?')) return; edit(reshuffle(br)); } : undefined} />
                </div>
              </div>
              {(msg || dirty) && <p role="status" className="text-[.85rem]" style={{ color: msg === tx.saved ? '#27c27a' : '#ffb02e' }}>{msg || tx.unsaved}</p>}
              {canTree && br && (isLeague(br) || br.format === 'groups' || br.format === 'ffa') && <p className="text-[.9rem]" style={{ color: 'var(--muted)' }}>{tx.hintL}</p>}
              <div className="st-stage">
                {sheetView ? <><BracketSheetAny bracket={br} title={displayTitle} lang={lang === 'en' ? 'en' : 'ar'} /><PodiumRow bracket={br} lang={lang === 'en' ? 'en' : 'ar'} bare /></> : <div className="st-brcard rounded-2xl border p-3" style={card}><BracketView bracket={br} onApply={canTree ? edit : undefined} canRename onChange={canTree ? edit : undefined} onRename={canTree ? (i, v) => { if (hasName(br, v, i)) { setMsg(tx.dupName); return; } edit(renamePlayer(br, i, v)); } : undefined} onSwap={canTree && (br.format === 'single' || br.format === 'double') ? (a, b) => { const nb = swapSeats(br, a, b); if (nb) edit(nb); } : undefined} pub={!!readOnly && !editable} /></div>}
              </div>
            </>
          )}
          {editable && id && can('info') && tab === 'info' && flat(
            <div className="grid gap-3 rounded-2xl border p-4" style={card}>
              <b className="text-[1.05rem]">{tx.info}</b>
              <InfoFields lang={L2} title={title} onTitle={(v) => { ver.current += 1; setTitle(v); setDirty(true); }}
                org={br.org ?? ''} onOrg={(v) => { const { org: _o, ...rest } = br; void _o; patchBr(v ? { ...rest, org: v } : rest); }}
                fmt={fmt} onFmt={setFmt} lo={lo} onLo={setLo} players={br.players.length} fmtLabels={fmtLabels} noFormat={!canTree}
                info={br.info ?? {}} onInfo={setInfo} cover={cover} onCover={(f) => void pickCover(f)} coverBusy={coverBusy}
                third={br.format === 'single' ? { on: !!br.third, disabled: !canThird(br) || !!br.place, set: (on) => edit(setThird(br, on)) } : undefined}
                placeOpt={br.format === 'single' || br.format === 'double' ? { on: !!br.place, disabled: !canPlace(br) && !br.place, set: (on) => { setLo({ ...lo, place: on }); edit(on ? { ...setPlace(br, true, lo.placeTo), place: true as const } : setPlace(br, false)); }, to: br.placeTo ?? 16, setTo: (n) => { setLo({ ...lo, placeTo: n }); edit({ ...setPlace(br, true, n), place: true as const }); } } : undefined}
                apply={{ label: tx.apply, run: applyFmt }} />
            </div>
          )}
          {editable && id && tab === 'editors' && auth.user && flat(<EditorsPanel id={id} lang={L2} userId={auth.user.id} style={card} />)}
          {editable && can('join') && id && tab === 'join' && flat(<JoinPanel id={id} lang={L2} link={`${base()}${joinPath(id)}`} autoOn={br.auto !== false} onAuto={(on) => edit(setAuto(br, on))} showCount={br.info?.showCount} onShowCount={(on) => setInfo({ showCount: on ? undefined : false })} onCover={setCover} title={title} org={org} />)}
          {editable && can('regs') && id && tab === 'regs' && flat(<RegistrantsCard onRenamePlayer={renameByName} onReorder={br.format === 'ffa' || br.format === 'groups' ? undefined : reorderPlayers} id={id} lang={lang === 'en' ? 'en' : 'ar'} players={br?.players ?? []} onAdd={addToBracket} onUnadd={removeFromBracket} onUnaddAll={removeAllFromBracket} bench={br?.bench} autoOn={br?.auto !== false} onAuto={undefined} auto={!!br && (br.auto !== false) && !hasResults(br)} />)}
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
