import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type SVGProps } from 'react';
import { GENRE_KEYS, emptyDetails, genreLabel, mergeGames, type AdminGame, type GameDetails, type GameRow } from '../data/games';
import { useGames } from '../hooks/useGames';
import type { NewsItem, NewsTag } from '../data/news';
import { statusOf, type Tournament } from '../data/tournaments';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../services/api';
import { ArrowIcon } from './icons';
import LanguageSwitcher from './LanguageSwitcher';

/** Dashboard (#/admin): its own full-screen app (no site header/footer). Follows the site language (AR/EN) and theme. */
type Adm<T> = T & { published?: boolean };
type Reg = { id: number; tournament_id: string; tournament_name: string; mode: string; plato_id: string; team_name: string; members: string; lang: string; created_at: string };
type Tab = 'overview' | 'news' | 'tournaments' | 'games' | 'regs';

const KEY = 'elite-admin-key';
const BASE = import.meta.env.BASE_URL;
const TAG_AR: Record<NewsTag, string> = { update: 'تحديث', tournament: 'بطولة', community: 'مجتمع', event: 'فعالية' };

const EN: Record<string, string> = {
  'تحديث': 'Update', 'بطولة': 'Tournament', 'مجتمع': 'Community', 'فعالية': 'Event',
  'لوحة التحكم': 'Dashboard', 'مرحباً بك': 'Welcome back', 'أدخل كلمة السر للمتابعة': 'Enter the password to continue',
  'كلمة السر': 'Password', 'دخول': 'Sign in', 'جارٍ الدخول…': 'Signing in…', 'كلمة السر غير صحيحة': 'Wrong password',
  'تعذّر الاتصال بالخادم': 'Could not reach the server', 'العودة للموقع': 'Back to the site', 'إظهار': 'Show', 'إخفاء': 'Hide',
  'نظرة عامة': 'Overview', 'الأخبار': 'News', 'البطولات': 'Tournaments', 'التسجيلات': 'Registrations', 'تسجيل خروج': 'Sign out',
  'ملخص سريع لكل شيء في الموقع': 'A quick look at everything on the site', 'أخبار منشورة': 'Published news', 'من أصل': 'of',
  'بطولات قادمة': 'Upcoming tournaments', 'مباشرة الآن': 'live now', 'إجمالي التسجيلات': 'Total registrations', 'آخر 24 ساعة': 'last 24 hours',
  'أحدث التسجيلات': 'Latest registrations', 'إجراءات سريعة': 'Quick actions', 'ما فيه تسجيلات بعد.': 'No registrations yet.',
  '+ خبر جديد': '+ New news item', '+ بطولة جديدة': '+ New tournament', 'عرض كل التسجيلات': 'View all registrations',
  'أضف وعدّل أخبار الموقع': 'Add and edit site news', 'أضف وعدّل البطولات وعدد المقاعد': 'Add and edit tournaments and slots',
  'من سجّل في كل بطولة': 'Who signed up for each tournament',
  'تعذّر تحميل الأخبار': 'Could not load news', 'تم الحفظ': 'Saved', 'تحقق من التاريخ والعنوان': 'Check the date and title',
  'حذف هذا الخبر؟': 'Delete this news item?', 'خبر جديد': 'New news item', 'تعديل الخبر': 'Edit news item',
  'العنوان (عربي)': 'Title (Arabic)', 'الملخص (عربي)': 'Summary (Arabic)', 'التاريخ': 'Date', 'التصنيف': 'Category',
  'رابط الصورة (اختياري)': 'Image link (optional)', 'https://… أو /images/x.jpg': 'https://… or /images/x.jpg',
  'رابط الخبر (اختياري)': 'Story link (optional)', 'منشور (يظهر في الموقع)': 'Published (visible on the site)',
  'حفظ': 'Save', 'إلغاء': 'Cancel', 'مسودة': 'Draft', 'منشور': 'Published', 'تعديل': 'Edit', 'حذف': 'Delete', 'ما فيه أخبار بعد.': 'No news yet.',
  'تعذّر تحميل البطولات': 'Could not load tournaments', 'تحقق من الاسم وتاريخ البداية': 'Check the name and start date',
  'حذف هذه البطولة؟': 'Delete this tournament?', 'بطولة جديدة': 'New tournament', 'تعديل البطولة': 'Edit tournament',
  'اسم البطولة': 'Tournament name', 'اللعبة': 'Game', 'النوع': 'Type', 'فردي (Plato ID)': 'Solo (Plato ID)',
  'فرق (اسم الفريق + القائد + الأعضاء)': 'Teams (team name + captain + members)', 'النظام': 'Format', 'فردي · أسرع لفة': 'Solo · Fastest lap',
  'الجائزة': 'Prize', '5,000 ريال': '5,000 SAR', 'البداية (توقيت الرياض)': 'Start (Riyadh time)', 'النهاية (توقيت الرياض)': 'End (Riyadh time)',
  'العدد الأقصى': 'Max slots', 'المسجّلين حالياً (يزيد تلقائياً مع كل تسجيل)': 'Registered now (auto-increments on each sign-up)',
  'رابط تسجيل خارجي (اختياري، يلغي نموذج الموقع)': 'External registration link (optional, replaces the site form)',
  'الفائز (بعد الانتهاء)': 'Winner (after it ends)', 'صورة الفائز (طولية 9:16، اختياري)': 'Winner portrait (tall 9:16, optional)', 'أو الصق رابط': 'or paste a link', 'اختر صورة من جهازك': 'Choose from your device', 'جارٍ الرفع…': 'Uploading…', 'فشل رفع الصورة': 'Image upload failed', 'التخزين غير مفعّل بعد (R2)': 'Storage is not enabled yet (R2)', 'إزالة': 'Remove', 'منشورة (تظهر في الموقع)': 'Published (visible on the site)',
  'ما فيه بطولات بعد.': 'No tournaments yet.', 'مباشرة': 'Live', 'قادمة': 'Upcoming', 'منتهية': 'Completed',
  'تعذّر تحميل التسجيلات': 'Could not load registrations', 'البطولة': 'Tournament', 'الأعضاء': 'Members',
  'حذف هذا التسجيل؟': 'Delete this registration?', 'كل البطولات': 'All tournaments', 'تصدير CSV': 'Export CSV',
  'الفريق': 'Team', 'المقاعد': 'Slots', 'ابحث…': 'Search…',
  'تم التحديث بنجاح': 'Updated successfully', 'تمت الإضافة بنجاح': 'Added successfully', 'تم الحذف بنجاح': 'Deleted successfully', 'تعذّر تنفيذ العملية': 'Action failed',
  'تم إظهار اللعبة في الموقع': 'Game is now shown on the site', 'تم إخفاء اللعبة من الموقع': 'Game is now hidden from the site', 'تم رفع الصورة بنجاح': 'Image uploaded successfully', 'القائمة': 'Menu',
  'كل الأنواع': 'All genres', 'لا توجد ألعاب مطابقة': 'No matching games',
  'أسماء أعضاء الفريق الفائز (اسم في كل سطر)': 'Winning team members (one name per line)', 'أسماء أعضاء الفريق الفائز إجبارية': 'The winning team members\' names are required',
  'الألعاب': 'Games', 'أضف وعدّل صور وأسماء الألعاب': 'Add games and edit their names and images', '+ لعبة جديدة': '+ New game', 'صفحة اللعبة': 'Game page', 'طريقة اللعب (سطر لكل خطوة)': 'How to play (one line per step)', 'نصيحة': 'Tip', 'رابط فيديو الشرح (يوتيوب)': 'Explainer video (YouTube link)', 'عدد اللاعبين': 'Players', 'مدة الجولة (دقائق)': 'Round length (minutes)', 'المستوى': 'Level', 'سهلة': 'Easy', 'متوسطة': 'Medium', 'صعبة': 'Hard', 'للبطولات فقط': 'Tournaments only', 'تظهر في': 'Shown in', 'الموقع والبطولات': 'Site & tournaments', 'البطولات فقط': 'Tournaments only', 'لعبة جديدة': 'New game', 'تعديل اللعبة': 'Edit game',
  'اسم اللعبة': 'Game name', 'الوصف القصير': 'Short description', 'التصنيف (نوع اللعبة)': 'Genre', 'صورة اللعبة': 'Game image', 'أركيد': 'Arcade', 'ألعاب لوحية': 'Board', 'ألعاب ورق': 'Card', 'اجتماعية': 'Social', 'رياضة': 'Sports', 'كلمات': 'Word',
  'مخفية': 'Hidden', 'مضافة': 'Custom', 'مخصّصة': 'Edited', 'إخفاء من الموقع': 'Hide from the site', 'إظهار في الموقع': 'Show on the site', 'تعذّر تحميل الألعاب': 'Could not load games', 'حذف هذه اللعبة؟': 'Delete this game?',
  'اترك أي حقل فارغاً ليرجع للافتراضي': 'Leave any field empty to restore its default', 'تحقق من اسم اللعبة': 'Check the game name', 'الفئة': 'Tier', 'عادية': 'Regular', 'بطولة كبرى (Major) — تظهر عليها شارة': 'Major tournament — shows a badge',
};

function useX() {
  const { lang } = useI18n();
  return { lang, x: (ar: string) => (lang === 'en' ? EN[ar] ?? ar : ar) };
}


/* ---------- Toasts (success / error notices) ---------- */
type ToastItem = { id: number; text: string; kind: 'ok' | 'err' };
type Toaster = { ok: (text: string) => void; err: (text: string) => void };
const ToastCtx = createContext<Toaster>({ ok: () => undefined, err: () => undefined });
const useToast = () => useContext(ToastCtx);
/** Error text for a failed save: the usual hint plus the server's reason, so a real problem is visible instead of guessed. */
const why = (err: unknown, base: string) => { const d = (err as { detail?: string }).detail; return d ? `${base} (${d})` : base; };

function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const api2 = useMemo<Toaster>(() => {
    const add = (kind: 'ok' | 'err') => (text: string) => {
      const id = ++seq.current;
      setItems((l) => [...l.slice(-2), { id, text, kind }]);
      window.setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === 'ok' ? 3200 : 5000);
    };
    return { ok: add('ok'), err: add('err') };
  }, []);
  return (
    <ToastCtx.Provider value={api2}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[120] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} role={t.kind === 'err' ? 'alert' : 'status'} className="toast pointer-events-auto flex max-w-[26rem] items-center gap-3 rounded-2xl border px-4 py-3 text-[.92rem] font-semibold shadow-2xl"
            style={{ background: 'var(--dialog)', borderColor: t.kind === 'ok' ? 'rgba(39,194,122,.55)' : 'rgba(255,77,94,.55)', color: 'var(--text)' }}>
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[.8rem] font-black text-white" style={{ background: t.kind === 'ok' ? '#27c27a' : '#ff4d5e' }}>{t.kind === 'ok' ? '✓' : '!'}</span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const getKey = () => { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } };

/* ---------- Tiny inline icons ---------- */
type IP = SVGProps<SVGSVGElement>;
const ic = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
const LockI = (p: IP) => <svg {...ic} {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="3" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
const EyeI = (p: IP) => <svg {...ic} {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffI = (p: IP) => <svg {...ic} {...p}><path d="M4 4l16 16M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.2 7.6A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 3.6-.7" /></svg>;
const GridI = (p: IP) => <svg {...ic} {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>;
const NewsI = (p: IP) => <svg {...ic} {...p}><path d="M5 4.5h11a2 2 0 0 1 2 2V19a1.5 1.5 0 0 0 1.5 1.5H7A2.5 2.5 0 0 1 4.5 18V5A.5.5 0 0 1 5 4.5Z" /><path d="M8 9h7M8 12.5h7M8 16h4" /></svg>;
const CupI = (p: IP) => <svg {...ic} {...p}><path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5Z" /><path d="M8 6.5H5a3 3 0 0 0 3 4M16 6.5h3a3 3 0 0 1-3 4M12 13.5v3.5M8.5 20h7M10 17h4" /></svg>;
const UsersI = (p: IP) => <svg {...ic} {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5a6 6 0 0 1 12 0M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.2a6 6 0 0 1 3.5 5.3" /></svg>;
const OutI = (p: IP) => <svg {...ic} {...p}><path d="M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4M6 12h10" /></svg>;
const SearchI = (p: IP) => <svg {...ic} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
const XI = (p: IP) => <svg {...ic} strokeWidth={2.2} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;

const PadI = (p: IP) => <svg {...ic} {...p}><rect x="3" y="7" width="18" height="11" rx="4" /><path d="M8 10.5v4M6 12.5h4M15.5 11.5h.01M17.5 13.5h.01" /></svg>;
const TAB_ICON: Record<Tab, (p: IP) => JSX.Element> = { overview: GridI, news: NewsI, tournaments: CupI, games: PadI, regs: UsersI };
const TAB_LABEL: Record<Tab, string> = { overview: 'نظرة عامة', news: 'الأخبار', tournaments: 'البطولات', games: 'الألعاب', regs: 'التسجيلات' };

/* ---------- Shared UI ---------- */
const inp = 'w-full rounded-xl border bg-[var(--chip-bg)] px-3.5 py-2.5 text-[.92rem] outline-none transition-colors focus:border-[var(--link-on)]';
const sel = `${inp} sel`;
const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
const btnP = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[.9rem] font-bold text-white transition hover:-translate-y-px disabled:opacity-60';
const gradBtn = { background: 'linear-gradient(135deg,#ff3347,#d90f26)', boxShadow: '0 8px 22px -8px rgba(235,40,60,.7)' };
const btnG = 'inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-[.85rem] font-semibold transition hover:bg-[var(--glass)]';
const ninja = { WebkitMask: `url(${BASE}brand/ninja.png) center / contain no-repeat`, mask: `url(${BASE}brand/ninja.png) center / contain no-repeat` };

/** Downscale big photos in the browser (max 1800px, WebP) before upload. GIFs and failures are sent as-is. */
async function shrink(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || !file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const r = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r);
    c.getContext('2d')?.drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/webp', 0.88));
    return out && out.size < file.size ? out : file;
  } catch { return file; }
}

/** Image field: choose a file from the computer (uploaded to R2) or paste a link/path. */
function ImageField({ label, value, onChange, k, placeholder }: { label: string; value: string; onChange: (v: string) => void; k: string; placeholder?: string }) {
  const { x } = useX();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pick(file?: File) {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', await shrink(file), 'image');
      const res = await fetch('/api/upload', { method: 'POST', headers: { authorization: `Bearer ${k}` }, body: fd });
      if (!res.ok) throw new Error(String(res.status));
      onChange(((await res.json()) as { url: string }).url);
      toast.ok(x('تم رفع الصورة بنجاح'));
    } catch (e) { setErr((e as Error).message === '500' ? x('التخزين غير مفعّل بعد (R2)') : x('فشل رفع الصورة')); }
    setBusy(false);
  }
  return (
    <div className="flex flex-col gap-1.5 text-[.82rem] font-semibold" style={{ color: 'var(--muted)' }}>
      {label}
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="h-14 w-10 shrink-0 rounded-lg border object-cover" style={{ borderColor: 'var(--glass-b)' }} />}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input dir="ltr" className={inp} style={bd} value={value} placeholder={placeholder ?? 'https://… / ' + x('أو الصق رابط')} onChange={(e) => onChange(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2">
            <label className={`${btnG} cursor-pointer ${busy ? 'opacity-60' : ''}`} style={bd}>
              {busy ? x('جارٍ الرفع…') : x('اختر صورة من جهازك')}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={busy} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {value && <button type="button" className="text-[.82rem] font-semibold" style={{ color: '#ff6b7a' }} onClick={() => onChange('')}>{x('إزالة')}</button>}
            {err && <span role="alert" className="text-[.82rem] font-semibold" style={{ color: '#ff6b7a' }}>{err}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={`flex flex-col gap-1.5 text-[.82rem] font-semibold ${wide ? 'sm:col-span-2' : ''}`} style={{ color: 'var(--muted)' }}>{label}{children}</label>;
}
const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border ${className}`} style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)', backdropFilter: 'blur(10px)' }}>{children}</div>
);
function Badge({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'gray' | 'blue'; children: ReactNode }) {
  const c = { green: '#27c27a', amber: '#ffb02e', red: '#ff4d5e', gray: '#8d93ad', blue: '#ff4455' }[tone];
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[.74rem] font-bold" style={{ color: c, background: `color-mix(in srgb, ${c} 15%, transparent)` }}><i className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{children}</span>;
}
function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-[1.6rem] font-extrabold leading-tight">{title}</h1>{sub && <p className="mt-1 text-[.92rem]" style={{ color: 'var(--muted)' }}>{sub}</p>}</div>
      {action}
    </div>
  );
}
function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="backdrop-fade fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={title} className="modal-in flex h-full w-full flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-[42rem] sm:rounded-2xl sm:border sm:shadow-2xl" style={{ background: 'var(--dialog)', borderColor: 'var(--glass-b)' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--glass-b)' }}>
          <h2 className="text-[1.15rem] font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border" style={{ borderColor: 'var(--glass-b)' }} aria-label="Close"><XI className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}

/* ---------- Riyadh date-time helpers (stored as ISO with +03:00) ---------- */
const toInput = (iso: string) => {
  if (!iso) return '';
  if (/\+03:00$/.test(iso)) return iso.slice(0, 16);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('sv-SE', { timeZone: 'Asia/Riyadh' }).replace(' ', 'T').slice(0, 16);
};
const fromInput = (v: string) => (v ? `${v}:00+03:00` : '');
const when = (iso: string) => toInput(iso).replace('T', ' ');

/* ---------- Overview ---------- */
function OverviewTab({ k, go }: { k: string; go: (t: Tab) => void }) {
  const { x } = useX();
  const [news, setNews] = useState<Adm<NewsItem>[]>([]);
  const [tours, setTours] = useState<Adm<Tournament>[]>([]);
  const [regs, setRegs] = useState<Reg[]>([]);
  useEffect(() => {
    api<Adm<NewsItem>[]>('/news', { key: k }).then(setNews).catch(() => undefined);
    api<Adm<Tournament>[]>('/tournaments', { key: k }).then(setTours).catch(() => undefined);
    api<Reg[]>('/registrations', { key: k }).then(setRegs).catch(() => undefined);
  }, [k]);
  const now = Date.now();
  const upcoming = tours.filter((t) => t.published !== false && statusOf(t, now) === 'upcoming').length;
  const live = tours.filter((t) => t.published !== false && statusOf(t, now) === 'live').length;
  const day = regs.filter((r) => now - Date.parse(`${r.created_at.replace(' ', 'T')}Z`) < 864e5).length;
  const stats = [
    { icon: NewsI, label: x('أخبار منشورة'), value: news.filter((n) => n.published !== false).length, note: `${x('من أصل')} ${news.length}`, tab: 'news' as Tab },
    { icon: CupI, label: x('بطولات قادمة'), value: upcoming, note: `${live} ${x('مباشرة الآن')}`, tab: 'tournaments' as Tab },
    { icon: UsersI, label: x('إجمالي التسجيلات'), value: regs.length, note: `${day} · ${x('آخر 24 ساعة')}`, tab: 'regs' as Tab },
  ];
  return (
    <div>
      <PageHead title={x('نظرة عامة')} sub={x('ملخص سريع لكل شيء في الموقع')} />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <button key={s.label} type="button" onClick={() => go(s.tab)} className="text-start">
            <Card className="relative h-full overflow-hidden p-5 transition hover:-translate-y-0.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={gradBtn}><s.icon className="h-5 w-5" /></span>
              <div className="mt-4 text-[2.2rem] font-black leading-none">{s.value}</div>
              <div className="mt-1.5 text-[.9rem] font-semibold">{s.label}</div>
              <div className="text-[.8rem]" style={{ color: 'var(--muted)' }}>{s.note}</div>
              <div aria-hidden="true" className="pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl" style={{ background: '#ff3347' }} />
            </Card>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold">{x('أحدث التسجيلات')}</h2><button type="button" className="text-[.85rem] font-semibold" style={{ color: 'var(--link-on)' }} onClick={() => go('regs')}>{x('عرض كل التسجيلات')}</button></div>
          <ul className="divide-y" style={{ borderColor: 'var(--glass-b)' }}>
            {regs.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-[.9rem]" style={{ borderColor: 'var(--glass-b)' }}>
                <div className="min-w-0"><b dir="ltr" className="block truncate">{r.team_name || r.plato_id}</b><span className="block truncate text-[.8rem]" style={{ color: 'var(--muted)' }}>{r.tournament_name}</span></div>
                <span dir="ltr" className="shrink-0 text-[.78rem]" style={{ color: 'var(--muted)' }}>{r.created_at.slice(0, 16)}</span>
              </li>
            ))}
            {!regs.length && <li className="py-6 text-center" style={{ color: 'var(--muted)' }}>{x('ما فيه تسجيلات بعد.')}</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-extrabold">{x('إجراءات سريعة')}</h2>
          <div className="flex flex-col gap-2.5">
            <button type="button" className={btnP} style={gradBtn} onClick={() => go('news')}>{x('+ خبر جديد')}</button>
            <button type="button" className={btnP} style={gradBtn} onClick={() => go('tournaments')}>{x('+ بطولة جديدة')}</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- News ---------- */
const emptyNews = (): Adm<NewsItem> => ({ id: '', date: new Date().toISOString().slice(0, 10), tag: 'update', title: { ar: '', en: '' }, summary: { ar: '', en: '' }, image: '', href: '', published: true });

function NewsTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const { lang, x } = useX();
  const [rows, setRows] = useState<Adm<NewsItem>[]>([]);
  const [f, setF] = useState<Adm<NewsItem> | null>(null);
  const toast = useToast();
  const load = useCallback(() => { api<Adm<NewsItem>[]>('/news', { key: k }).then(setRows).catch(() => toast.err(x('تعذّر تحميل الأخبار'))); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!f) return;
    try {
      await api(f.id ? `/news/${f.id}` : '/news', { method: f.id ? 'PUT' : 'POST', body: JSON.stringify(f), key: k });
      setF(null); toast.ok(x(f.id ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح')); load();
    } catch (err) { if ((err as Error).message === '401') onAuthFail(); else toast.err(why(err, x('تحقق من التاريخ والعنوان'))); }
  }
  async function del(id: string) {
    if (!window.confirm(x('حذف هذا الخبر؟'))) return;
    await api(`/news/${id}`, { method: 'DELETE', key: k }).then(() => toast.ok(x('تم الحذف بنجاح'))).catch(() => toast.err(x('تعذّر تنفيذ العملية')));
    load();
  }

  return (
    <div>
      <PageHead title={`${x('الأخبار')} (${rows.length})`} sub={x('أضف وعدّل أخبار الموقع')} action={<button className={btnP} style={gradBtn} onClick={() => { setF(emptyNews()); }}>{x('+ خبر جديد')}</button>} />
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{r.title[lang] || r.title.ar || r.title.en}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[.8rem]" style={{ color: 'var(--muted)' }}>
                <span dir="ltr">{r.date}</span><Badge tone="blue">{x(TAG_AR[r.tag])}</Badge>
                {r.published === false ? <Badge tone="gray">{x('مسودة')}</Badge> : <Badge tone="green">{x('منشور')}</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <button className={btnG} style={bd} onClick={() => { setF({ ...r, image: r.image ?? '', href: r.href ?? '' }); }}>{x('تعديل')}</button>
              <button className={btnG} style={{ ...bd, color: '#ff6b7a' }} onClick={() => del(r.id)}>{x('حذف')}</button>
            </div>
          </Card>
        ))}
        {!rows.length && <Card className="p-8 text-center"><span style={{ color: 'var(--muted)' }}>{x('ما فيه أخبار بعد.')}</span></Card>}
      </div>

      {f && (
        <Drawer title={x(f.id ? 'تعديل الخبر' : 'خبر جديد')} onClose={() => setF(null)}>
          <form onSubmit={save} className="grid gap-4">
            <Field label={x('العنوان (عربي)')}><input className={inp} style={bd} value={f.title.ar} onChange={(e) => setF({ ...f, title: { ...f.title, ar: e.target.value } })} /></Field>
            <Field label="Title (English)"><input dir="ltr" className={inp} style={bd} value={f.title.en} onChange={(e) => setF({ ...f, title: { ...f.title, en: e.target.value } })} /></Field>
            <Field label={x('الملخص (عربي)')}><textarea rows={3} className={inp} style={bd} value={f.summary.ar} onChange={(e) => setF({ ...f, summary: { ...f.summary, ar: e.target.value } })} /></Field>
            <Field label="Summary (English)"><textarea dir="ltr" rows={3} className={inp} style={bd} value={f.summary.en} onChange={(e) => setF({ ...f, summary: { ...f.summary, en: e.target.value } })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={x('التاريخ')}><input type="date" className={inp} style={bd} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
              <Field label={x('التصنيف')}>
                <select className={sel} style={bd} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value as NewsTag })}>
                  {(Object.keys(TAG_AR) as NewsTag[]).map((g) => <option key={g} value={g}>{x(TAG_AR[g])}</option>)}
                </select>
              </Field>
            </div>
            <ImageField k={k} label={x('رابط الصورة (اختياري)')} value={f.image ?? ''} onChange={(v) => setF({ ...f, image: v })} />
            <Field label={x('رابط الخبر (اختياري)')}><input dir="ltr" className={inp} style={bd} value={f.href ?? ''} placeholder="https://…" onChange={(e) => setF({ ...f, href: e.target.value })} /></Field>
            <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={f.published !== false} onChange={(e) => setF({ ...f, published: e.target.checked })} />{x('منشور (يظهر في الموقع)')}</label>
            <div className="flex gap-3 pt-2"><button className={btnP} style={gradBtn} type="submit">{x('حفظ')}</button><button type="button" className={btnG} style={bd} onClick={() => setF(null)}>{x('إلغاء')}</button></div>
          </form>
        </Drawer>
      )}
    </div>
  );
}

/* ---------- Tournaments ---------- */
const emptyT = (): Adm<Tournament> => ({ id: '', gameId: '', name: { ar: '', en: '' }, format: { ar: '', en: '' }, prize: { ar: '', en: '' }, startsAt: '', endsAt: '', slots: { filled: 0, total: 16 }, mode: 'solo', tier: 'regular', registerUrl: '', image: '', winner: { ar: '', en: '' }, winnerMembers: [], published: true });
const ST_TONE = { live: 'red', upcoming: 'amber', completed: 'gray' } as const;
const ST_AR = { live: 'مباشرة', upcoming: 'قادمة', completed: 'منتهية' } as const;

function TournamentsTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const { lang, x } = useX();
  const GAMES = useGames();
  const [rows, setRows] = useState<Adm<Tournament>[]>([]);
  const [f, setF] = useState<Adm<Tournament> | null>(null);
  const toast = useToast();
  const load = useCallback(() => { api<Adm<Tournament>[]>('/tournaments', { key: k }).then(setRows).catch(() => toast.err(x('تعذّر تحميل البطولات'))); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  const pair = (name: 'name' | 'format' | 'prize' | 'winner', label: string, en: string, ph = '') => f && (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={lang === 'en' ? `${en} (Arabic)` : `${label} (عربي)`}><input className={inp} style={bd} value={f[name]?.ar ?? ''} placeholder={ph} onChange={(e) => setF({ ...f, [name]: { ar: e.target.value, en: f[name]?.en ?? '' } })} /></Field>
      <Field label={`${en} (English)`}><input dir="ltr" className={inp} style={bd} value={f[name]?.en ?? ''} onChange={(e) => setF({ ...f, [name]: { en: e.target.value, ar: f[name]?.ar ?? '' } })} /></Field>
    </div>
  );

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!f) return;
    if (f.mode === 'team' && (f.winner?.ar.trim() || f.winner?.en.trim()) && !(f.winnerMembers ?? []).some((m) => m.trim())) { toast.err(x('أسماء أعضاء الفريق الفائز إجبارية')); return; }
    try {
      await api(f.id ? `/tournaments/${f.id}` : '/tournaments', { method: f.id ? 'PUT' : 'POST', body: JSON.stringify(f), key: k });
      setF(null); toast.ok(x(f.id ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح')); load();
    } catch (err) { if ((err as Error).message === '401') onAuthFail(); else toast.err(why(err, x('تحقق من الاسم وتاريخ البداية'))); }
  }
  async function del(id: string) {
    if (!window.confirm(x('حذف هذه البطولة؟'))) return;
    await api(`/tournaments/${id}`, { method: 'DELETE', key: k }).then(() => toast.ok(x('تم الحذف بنجاح'))).catch(() => toast.err(x('تعذّر تنفيذ العملية')));
    load();
  }
  const now = Date.now();

  return (
    <div>
      <PageHead title={`${x('البطولات')} (${rows.length})`} sub={x('أضف وعدّل البطولات وعدد المقاعد')} action={<button className={btnP} style={gradBtn} onClick={() => { setF(emptyT()); }}>{x('+ بطولة جديدة')}</button>} />
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const st = statusOf(r, now);
          const pct = Math.min(100, (r.slots.filled / Math.max(1, r.slots.total)) * 100);
          return (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b className="truncate">{r.name[lang] || r.name.ar || r.name.en}</b><Badge tone={ST_TONE[st]}>{x(ST_AR[st])}</Badge>{r.tier === 'major' && <Badge tone="blue">Major</Badge>}{r.published === false && <Badge tone="gray">{x('مسودة')}</Badge>}</div>
                <div className="mt-1 text-[.8rem]" dir="ltr" style={{ color: 'var(--muted)', textAlign: lang === 'ar' ? 'right' : 'left' }}>{when(r.startsAt)}</div>
              </div>
              <div className="w-36">
                <div className="mb-1 flex justify-between text-[.76rem]" style={{ color: 'var(--muted)' }}><span>{x('المقاعد')}</span><span dir="ltr">{r.slots.filled}/{r.slots.total}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--track)' }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#ff3347,#d90f26)' }} /></div>
              </div>
              <div className="flex gap-2">
                <button className={btnG} style={bd} onClick={() => { setF({ ...r, winner: r.winner ?? { ar: '', en: '' }, registerUrl: r.registerUrl ?? '', image: r.image ?? '', winnerMembers: r.winnerMembers ?? [] }); }}>{x('تعديل')}</button>
                <button className={btnG} style={{ ...bd, color: '#ff6b7a' }} onClick={() => del(r.id)}>{x('حذف')}</button>
              </div>
            </Card>
          );
        })}
        {!rows.length && <Card className="p-8 text-center"><span style={{ color: 'var(--muted)' }}>{x('ما فيه بطولات بعد.')}</span></Card>}
      </div>

      {f && (
        <Drawer title={x(f.id ? 'تعديل البطولة' : 'بطولة جديدة')} onClose={() => setF(null)}>
          <form onSubmit={save} className="grid gap-4">
            {pair('name', x('اسم البطولة'), 'Name')}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={x('اللعبة')}><select className={sel} style={bd} value={f.gameId || GAMES[0]?.id || ''} onChange={(e) => setF({ ...f, gameId: e.target.value })}>{GAMES.map((g) => <option key={g.id} value={g.id}>{g.name[lang]}</option>)}</select></Field>
              <Field label={x('الفئة')}><select className={sel} style={bd} value={f.tier ?? 'regular'} onChange={(e) => setF({ ...f, tier: e.target.value as 'major' | 'regular' })}><option value="regular">{x('عادية')}</option><option value="major">Major</option></select></Field>
              <Field label={x('النوع')}><select className={sel} style={bd} value={f.mode ?? 'solo'} onChange={(e) => setF({ ...f, mode: e.target.value as 'solo' | 'team' })}><option value="solo">{x('فردي (Plato ID)')}</option><option value="team">{x('فرق (اسم الفريق + القائد + الأعضاء)')}</option></select></Field>
            </div>
            {pair('format', x('النظام'), 'Format', x('فردي · أسرع لفة'))}
            {pair('prize', x('الجائزة'), 'Prize', x('5,000 ريال'))}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={x('البداية (توقيت الرياض)')}><input type="datetime-local" className={inp} style={bd} value={toInput(f.startsAt)} onChange={(e) => setF({ ...f, startsAt: fromInput(e.target.value) })} required /></Field>
              <Field label={x('النهاية (توقيت الرياض)')}><input type="datetime-local" className={inp} style={bd} value={toInput(f.endsAt)} onChange={(e) => setF({ ...f, endsAt: fromInput(e.target.value) })} /></Field>
              <Field label={x('العدد الأقصى')}><input type="number" min={1} className={inp} style={bd} value={f.slots.total} onChange={(e) => setF({ ...f, slots: { ...f.slots, total: Number(e.target.value) } })} /></Field>
              <Field label={x('المسجّلين حالياً (يزيد تلقائياً مع كل تسجيل)')}><input type="number" min={0} className={inp} style={bd} value={f.slots.filled} onChange={(e) => setF({ ...f, slots: { ...f.slots, filled: Number(e.target.value) } })} /></Field>
            </div>
            <Field label={x('رابط تسجيل خارجي (اختياري، يلغي نموذج الموقع)')}><input dir="ltr" className={inp} style={bd} value={f.registerUrl ?? ''} placeholder="https://…" onChange={(e) => setF({ ...f, registerUrl: e.target.value })} /></Field>
            <ImageField k={k} label={x('رابط الصورة (اختياري)')} value={f.image ?? ''} onChange={(v) => setF({ ...f, image: v })} />
            {pair('winner', x('الفائز (بعد الانتهاء)'), 'Winner')}
            {f.mode === 'team' && (
              <Field label={`${x('أسماء أعضاء الفريق الفائز (اسم في كل سطر)')} *`}>
                <textarea rows={4} dir="auto" className={inp} style={bd} value={(f.winnerMembers ?? []).join('\n')} placeholder={'Faisal\nSara\nOmar'} onChange={(e) => setF({ ...f, winnerMembers: e.target.value.split('\n') })} required={!!(f.winner?.ar.trim() || f.winner?.en.trim())} />
              </Field>
            )}
            <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={f.published !== false} onChange={(e) => setF({ ...f, published: e.target.checked })} />{x('منشورة (تظهر في الموقع)')}</label>
            <div className="flex gap-3 pt-2"><button className={btnP} style={gradBtn} type="submit">{x('حفظ')}</button><button type="button" className={btnG} style={bd} onClick={() => setF(null)}>{x('إلغاء')}</button></div>
          </form>
        </Drawer>
      )}
    </div>
  );
}

/* ---------- Games ---------- */
type GForm = { id: string; custom: boolean; hidden: boolean; name: { ar: string; en: string }; tagline: { ar: string; en: string }; genre: string; image: string; tournamentOnly: boolean; details: GameDetails };

function GamesTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const { lang, x } = useX();
  const [rows, setRows] = useState<AdminGame[]>([]);
  const [f, setF] = useState<GForm | null>(null);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('all');
  const toast = useToast();
  const load = useCallback(() => { api<GameRow[]>('/games', { key: k }).then((r) => setRows(mergeGames(r))).catch(() => toast.err(x('تعذّر تحميل الألعاب'))); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  const toForm = (g: AdminGame): GForm => ({ id: g.id, custom: g.custom, hidden: g.hidden, name: { ar: g.name.ar, en: g.name.en }, tagline: { ar: g.tagline.ar, en: g.tagline.en }, genre: g.genreKey, image: g.image ?? '', tournamentOnly: !!g.tournamentOnly, details: { ...emptyDetails(), ...(g.details ?? {}) } });
  const dset = (patch: Partial<GameDetails>) => setF((cur) => (cur ? { ...cur, details: { ...cur.details, ...patch } } : cur));
  const fail = (err: unknown, m: string) => { if ((err as Error).message === '401') onAuthFail(); else toast.err(m); };
  const term = q.trim().toLowerCase();
  const shown = rows.filter((g) => (genre === 'all' || g.genreKey === genre) && (!term || `${g.name.ar} ${g.name.en} ${g.tagline.ar} ${g.tagline.en}`.toLowerCase().includes(term)));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!f) return;
    try {
      await api(f.id ? `/games/${f.id}` : '/games', { method: f.id ? 'PUT' : 'POST', body: JSON.stringify(f), key: k });
      setF(null); toast.ok(x(f.id ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح')); load();
    } catch (err) { fail(err, why(err, x('تحقق من اسم اللعبة'))); }
  }
  async function toggle(g: AdminGame) {
    try { await api(`/games/${g.id}`, { method: 'PUT', body: JSON.stringify({ ...toForm(g), hidden: !g.hidden }), key: k }); toast.ok(x(g.hidden ? 'تم إظهار اللعبة في الموقع' : 'تم إخفاء اللعبة من الموقع')); load(); } catch (err) { fail(err, x('تعذّر تحميل الألعاب')); }
  }
  async function del(g: AdminGame) {
    if (!window.confirm(x('حذف هذه اللعبة؟'))) return;
    await api(`/games/${g.id}`, { method: 'DELETE', key: k }).then(() => toast.ok(x('تم الحذف بنجاح'))).catch(() => toast.err(x('تعذّر تنفيذ العملية')));
    load();
  }
  const pairF = (name: 'name' | 'tagline', label: string, en: string, area = false) => f && (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={lang === 'en' ? `${en} (Arabic)` : `${label} (عربي)`}>{area ? <textarea rows={2} className={inp} style={bd} value={f[name].ar} onChange={(e) => setF({ ...f, [name]: { ...f[name], ar: e.target.value } })} /> : <input className={inp} style={bd} value={f[name].ar} onChange={(e) => setF({ ...f, [name]: { ...f[name], ar: e.target.value } })} />}</Field>
      <Field label={`${en} (English)`}>{area ? <textarea dir="ltr" rows={2} className={inp} style={bd} value={f[name].en} onChange={(e) => setF({ ...f, [name]: { ...f[name], en: e.target.value } })} /> : <input dir="ltr" className={inp} style={bd} value={f[name].en} onChange={(e) => setF({ ...f, [name]: { ...f[name], en: e.target.value } })} />}</Field>
    </div>
  );

  return (
    <div>
      <PageHead title={`${x('الألعاب')} (${shown.length})`} sub={x('أضف وعدّل صور وأسماء الألعاب')} action={<button className={btnP} style={gradBtn} onClick={() => { setF({ id: '', custom: true, hidden: false, name: { ar: '', en: '' }, tagline: { ar: '', en: '' }, genre: 'Arcade', image: '', tournamentOnly: false, details: emptyDetails() }); }}>{x('+ لعبة جديدة')}</button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <SearchI className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <input className={`${inp} !ps-9`} style={bd} value={q} onChange={(e) => setQ(e.target.value)} placeholder={x('ابحث…')} />
        </div>
        <select className={`${sel} !w-auto`} style={bd} value={genre} onChange={(e) => setGenre(e.target.value)} aria-label={x('التصنيف (نوع اللعبة)')}>
          <option value="all">{x('كل الأنواع')}</option>
          {GENRE_KEYS.map((gk) => <option key={gk} value={gk}>{genreLabel(gk)[lang]}</option>)}
        </select>
      </div>
      {!shown.length && <p className="py-10 text-center" style={{ color: 'var(--muted)' }}>{x('لا توجد ألعاب مطابقة')}</p>}
      <div className="flex flex-col gap-2.5">
        {shown.map((g) => (
          <Card key={g.id} className={`flex flex-wrap items-center gap-4 p-3.5 ${g.hidden ? 'opacity-60' : ''}`}>
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}>
              {g.image && <img src={g.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{g.name[lang] || g.name.ar || g.name.en}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[.8rem]" style={{ color: 'var(--muted)' }}>
                <span>{genreLabel(g.genreKey)[lang]}</span>
                {g.custom && <Badge tone="blue">{x('مضافة')}</Badge>}
                {g.hidden && <Badge tone="gray">{x('مخفية')}</Badge>}
                {g.tournamentOnly && <Badge tone="amber">{x('للبطولات فقط')}</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btnG} style={bd} onClick={() => { setF(toForm(g)); }}>{x('تعديل')}</button>
              {g.custom
                ? <button className={btnG} style={{ ...bd, color: '#ff6b7a' }} onClick={() => del(g)}>{x('حذف')}</button>
                : <button className={btnG} style={bd} onClick={() => toggle(g)}>{g.hidden ? x('إظهار في الموقع') : x('إخفاء من الموقع')}</button>}
            </div>
          </Card>
        ))}
      </div>

      {f && (
        <Drawer title={x(f.id ? 'تعديل اللعبة' : 'لعبة جديدة')} onClose={() => setF(null)}>
          <form onSubmit={save} className="grid gap-4">
            {pairF('name', x('اسم اللعبة'), 'Name')}
            {pairF('tagline', x('الوصف القصير'), 'Short description', true)}
            <Field label={x('التصنيف (نوع اللعبة)')}>
              <select className={sel} style={bd} value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })}>
                {GENRE_KEYS.map((gk) => <option key={gk} value={gk}>{genreLabel(gk)[lang]}</option>)}
              </select>
            </Field>
            <Field label={x('تظهر في')}>
              <select className={sel} style={bd} value={f.tournamentOnly ? '1' : '0'} onChange={(e) => setF({ ...f, tournamentOnly: e.target.value === '1' })}>
                <option value="0">{x('الموقع والبطولات')}</option>
                <option value="1">{x('البطولات فقط')}</option>
              </select>
            </Field>
            <ImageField k={k} label={x('صورة اللعبة')} value={f.image} onChange={(v) => setF({ ...f, image: v })} />
            <h4 className="-mb-1 mt-2 font-bold">{x('صفحة اللعبة')}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${x('طريقة اللعب (سطر لكل خطوة)')} — ${lang === 'en' ? 'Arabic' : 'عربي'}`}><textarea rows={5} className={inp} style={bd} value={f.details.how.ar} onChange={(e) => dset({ how: { ...f.details.how, ar: e.target.value } })} /></Field>
              <Field label={`${x('طريقة اللعب (سطر لكل خطوة)')} — English`}><textarea dir="ltr" rows={5} className={inp} style={bd} value={f.details.how.en} onChange={(e) => dset({ how: { ...f.details.how, en: e.target.value } })} /></Field>
              <Field label={`${x('نصيحة')} — ${lang === 'en' ? 'Arabic' : 'عربي'}`}><textarea rows={2} className={inp} style={bd} value={f.details.tip.ar} onChange={(e) => dset({ tip: { ...f.details.tip, ar: e.target.value } })} /></Field>
              <Field label={`${x('نصيحة')} — English`}><textarea dir="ltr" rows={2} className={inp} style={bd} value={f.details.tip.en} onChange={(e) => dset({ tip: { ...f.details.tip, en: e.target.value } })} /></Field>
            </div>
            <Field label={x('رابط فيديو الشرح (يوتيوب)')}><input dir="ltr" className={inp} style={bd} placeholder="https://youtu.be/…" value={f.details.video} onChange={(e) => dset({ video: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={x('عدد اللاعبين')}><input dir="ltr" className={inp} style={bd} placeholder="1v1 / 2-4" value={f.details.players} onChange={(e) => dset({ players: e.target.value })} /></Field>
              <Field label={x('مدة الجولة (دقائق)')}><input dir="ltr" className={inp} style={bd} inputMode="numeric" value={f.details.minutes} onChange={(e) => dset({ minutes: e.target.value })} /></Field>
              <Field label={x('المستوى')}>
                <select className={sel} style={bd} value={f.details.level} onChange={(e) => dset({ level: e.target.value })}>
                  <option value="">—</option><option value="easy">{x('سهلة')}</option><option value="medium">{x('متوسطة')}</option><option value="hard">{x('صعبة')}</option>
                </select>
              </Field>
            </div>
            {!f.custom && <p className="text-[.8rem]" style={{ color: 'var(--muted)' }}>{x('اترك أي حقل فارغاً ليرجع للافتراضي')}</p>}
            <div className="flex gap-3 pt-2"><button className={btnP} style={gradBtn} type="submit">{x('حفظ')}</button><button type="button" className={btnG} style={bd} onClick={() => setF(null)}>{x('إلغاء')}</button></div>
          </form>
        </Drawer>
      )}
    </div>
  );
}

/* ---------- Registrations ---------- */
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function RegsTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const { x } = useX();
  const [rows, setRows] = useState<Reg[]>([]);
  const [tid, setTid] = useState('all');
  const [q, setQ] = useState('');
  const toast = useToast();
  const load = useCallback(() => { api<Reg[]>('/registrations', { key: k }).then(setRows).catch((e: Error) => { if (e.message === '401') onAuthFail(); else toast.err(x('تعذّر تحميل التسجيلات')); }); }, [k, onAuthFail]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  const tournaments = useMemo(() => [...new Map(rows.map((r) => [r.tournament_id, r.tournament_name])).entries()], [rows]);
  const shown = rows.filter((r) => (tid === 'all' || r.tournament_id === tid) && (!q.trim() || `${r.plato_id} ${r.team_name} ${r.members}`.toLowerCase().includes(q.trim().toLowerCase())));

  function exportCsv() {
    const head = ['البطولة', 'النوع', 'Plato ID', 'اسم الفريق', 'الأعضاء', 'اللغة', 'التاريخ'];
    const lines = [head, ...shown.map((r) => [r.tournament_name, r.mode === 'team' ? 'فريق' : 'فردي', r.plato_id, r.team_name, r.members, r.lang, r.created_at])];
    const blob = new Blob(['﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'elite-registrations.csv'; a.click();
    URL.revokeObjectURL(a.href);
  }
  async function del(id: number) {
    if (!window.confirm(x('حذف هذا التسجيل؟'))) return;
    await api(`/registrations/${id}`, { method: 'DELETE', key: k }).then(() => toast.ok(x('تم الحذف بنجاح'))).catch(() => toast.err(x('تعذّر تنفيذ العملية')));
    load();
  }

  return (
    <div>
      <PageHead title={`${x('التسجيلات')} (${shown.length})`} sub={x('من سجّل في كل بطولة')} action={<button className={btnP} style={gradBtn} onClick={exportCsv} disabled={!shown.length}>{x('تصدير CSV')}</button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <SearchI className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <input className={`${inp} !ps-9`} style={bd} value={q} onChange={(e) => setQ(e.target.value)} placeholder={x('ابحث…')} />
        </div>
        <select className={`${sel} !w-auto`} style={bd} value={tid} onChange={(e) => setTid(e.target.value)}>
          <option value="all">{x('كل البطولات')}</option>
          {tournaments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-[.88rem]">
          <thead><tr style={{ color: 'var(--muted)' }}>{[x('البطولة'), 'Plato ID', x('الفريق'), x('الأعضاء'), x('التاريخ'), ''].map((h, i) => <th key={i} className="px-4 py-3 text-start text-[.78rem] font-bold uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t align-top" style={{ borderColor: 'var(--glass-b)' }}>
                <td className="px-4 py-3">{r.tournament_name}</td>
                <td className="px-4 py-3 font-semibold" dir="ltr" style={{ textAlign: 'start' }}>{r.plato_id}</td>
                <td className="px-4 py-3">{r.team_name || '—'}</td>
                <td className="whitespace-pre-line px-4 py-3" dir="ltr" style={{ textAlign: 'start' }}>{r.members || '—'}</td>
                <td className="px-4 py-3" dir="ltr" style={{ textAlign: 'start', color: 'var(--muted)' }}>{r.created_at}</td>
                <td className="px-4 py-3"><button className="text-[.82rem] font-semibold" style={{ color: '#ff6b7a' }} onClick={() => del(r.id)}>{x('حذف')}</button></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>{x('ما فيه تسجيلات بعد.')}</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- Login ---------- */
function Login({ onDone }: { onDone: (key: string) => void }) {
  const { x } = useX();
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !pw) return;
    setBusy(true); setErr('');
    try {
      await api('/registrations', { key: pw });
      try { sessionStorage.setItem(KEY, pw); } catch { /* ignore */ }
      onDone(pw);
    } catch (ex) { setErr((ex as Error).message === '401' ? x('كلمة السر غير صحيحة') : x('تعذّر الاتصال بالخادم')); }
    setBusy(false);
  }

  return (
    <section className="admin-bg relative grid min-h-[100svh] place-items-center overflow-hidden px-5 py-10">
      <div className="absolute end-4 top-4 z-10 flex gap-2"><LanguageSwitcher /></div>
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle,#ff3347,transparent 70%)' }} />
      <form onSubmit={submit} className="relative w-full max-w-[26rem] rounded-[1.75rem] border p-8 shadow-2xl" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)' }}>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white" style={gradBtn}>
          <span aria-hidden="true" className="inline-block h-7 w-11 bg-current" style={ninja} />
        </div>
        <h1 className="mt-5 text-center text-[1.55rem] font-extrabold">{x('مرحباً بك')}</h1>
        <p className="mt-1 text-center text-[.92rem]" style={{ color: 'var(--muted)' }}>Elite · {x('لوحة التحكم')}</p>

        <label className="mt-7 flex flex-col gap-2 text-[.85rem] font-semibold" style={{ color: 'var(--muted)' }}>{x('أدخل كلمة السر للمتابعة')}
          <span className="relative block">
            <LockI className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 opacity-60" />
            <input type={show ? 'text' : 'password'} autoFocus autoComplete="current-password" dir="ltr" className={`${inp} !py-3 !ps-10 !pe-11`} style={{ ...bd, textAlign: 'start' }} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={x('كلمة السر')} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? x('إخفاء') : x('إظهار')} className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg opacity-70 hover:opacity-100">
              {show ? <EyeOffI className="h-[18px] w-[18px]" /> : <EyeI className="h-[18px] w-[18px]" />}
            </button>
          </span>
        </label>
        {err && <p role="alert" className="mt-3 rounded-lg px-3 py-2 text-[.88rem] font-semibold" style={{ color: '#ff6b7a', background: 'rgba(255,77,94,.12)' }}>{err}</p>}
        <button type="submit" disabled={busy || !pw} className={`${btnP} mt-6 w-full !py-3 text-[1rem]`} style={gradBtn}>{busy ? x('جارٍ الدخول…') : x('دخول')}</button>
        <a href="#/" className="mt-5 flex items-center justify-center gap-2 text-[.85rem]" style={{ color: 'var(--muted)' }}><ArrowIcon className="h-4 w-4 -scale-x-100 rtl:scale-x-100" />{x('العودة للموقع')}</a>
      </form>
    </section>
  );
}

/* ---------- Shell ---------- */
export default function AdminPage() {
  const { x } = useX();
  const [key, setKey] = useState(getKey);
  const [tab, setTab] = useState<Tab>('overview');
  const [menu, setMenu] = useState(false);
  const pick = (id: Tab) => { setTab(id); setMenu(false); window.scrollTo({ top: 0 }); };
  const logout = useCallback(() => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } setKey(''); }, []);

  if (!key) return <Login onDone={setKey} />;

  const tabs = Object.keys(TAB_LABEL) as Tab[];
  return (
    <ToastHost><div className="min-h-[100svh] overflow-x-clip lg:grid lg:grid-cols-[16.5rem_1fr]" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <aside className="hidden flex-col border-e p-5 lg:flex" style={{ borderColor: 'var(--glass-b)', background: 'var(--glass)' }}>
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
          <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={gradBtn}><span aria-hidden="true" className="inline-block h-4 w-6 bg-current" style={ninja} /></span>
          <div className="leading-tight"><div className="text-[1.05rem] font-extrabold">Elite</div><div className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{x('لوحة التحكم')}</div></div>
        </div>
        <nav className="flex flex-col gap-1">
          {tabs.map((id) => {
            const I = TAB_ICON[id]; const on = tab === id;
            return (
              <button key={id} type="button" aria-current={on ? 'page' : undefined} onClick={() => setTab(id)} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-start text-[.95rem] font-semibold transition"
                style={on ? { color: '#fff', ...gradBtn } : { color: 'var(--muted)' }}>
                <I className="h-[18px] w-[18px]" />{x(TAB_LABEL[id])}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <a href="#/" className={btnG} style={bd}><ArrowIcon className="h-4 w-4 -scale-x-100 rtl:scale-x-100" />{x('العودة للموقع')}</a>
          <button type="button" onClick={logout} className={btnG} style={bd}><OutI className="h-4 w-4" />{x('تسجيل خروج')}</button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-8" style={{ background: 'var(--nav-solid)', borderColor: 'var(--glass-b)', backdropFilter: 'blur(14px)' }}>
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label={x('القائمة')} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" style={bd}>
              {menu ? <XI className="h-5 w-5" /> : <svg {...ic} strokeWidth={2.2} className="h-5 w-5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
            </button>
            <span className="truncate text-[1rem] font-extrabold">{x(TAB_LABEL[tab])}</span>
          </div>
          <div className="hidden text-[.9rem] font-semibold lg:block" style={{ color: 'var(--muted)' }}>{x(TAB_LABEL[tab])}</div>
          <div className="flex shrink-0 items-center gap-2"><LanguageSwitcher /><button type="button" onClick={logout} className="pill lg:hidden" aria-label={x('تسجيل خروج')}><OutI className="h-4 w-4" /></button></div>
        </header>
        {menu && (
          <div className="lg:hidden">
            <div className="fixed inset-0 top-[4.1rem] z-20 bg-black/55 backdrop-fade" onClick={() => setMenu(false)} aria-hidden="true" />
            <nav className="menu-pop fixed inset-x-3 top-[4.6rem] z-30 flex flex-col gap-1 rounded-2xl border p-2.5 shadow-2xl" style={{ background: 'var(--dialog)', borderColor: 'var(--glass-b)' }}>
              {tabs.map((id) => {
                const I = TAB_ICON[id]; const on = tab === id;
                return (
                  <button key={id} type="button" aria-current={on ? 'page' : undefined} onClick={() => pick(id)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-start text-[1rem] font-semibold transition"
                    style={on ? { color: '#fff', ...gradBtn } : { color: 'var(--text)' }}>
                    <I className="h-5 w-5" />{x(TAB_LABEL[id])}
                  </button>
                );
              })}
              <div className="my-1 border-t" style={{ borderColor: 'var(--glass-b)' }} />
              <a href="#/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-[1rem] font-semibold" style={{ color: 'var(--muted)' }}><ArrowIcon className="h-5 w-5 -scale-x-100 rtl:scale-x-100" />{x('العودة للموقع')}</a>
            </nav>
          </div>
        )}
        <main className="mx-auto max-w-[68rem] px-4 py-6 sm:px-8 sm:py-8">
          <div key={tab} className="admin-page">
          {tab === 'overview' && <OverviewTab k={key} go={pick} />}
          {tab === 'news' && <NewsTab k={key} onAuthFail={logout} />}
          {tab === 'tournaments' && <TournamentsTab k={key} onAuthFail={logout} />}
          {tab === 'games' && <GamesTab k={key} onAuthFail={logout} />}
          {tab === 'regs' && <RegsTab k={key} onAuthFail={logout} />}
          </div>
        </main>
      </div>
    </div></ToastHost>
  );
}
