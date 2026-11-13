import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type SVGProps } from 'react';
import { GENRE_KEYS, emptyDetails, fullDetails, genreLabel, isVideoFile, mergeGames, youtubeId, type AdminGame, type GameDetails, type GameRow } from '../data/games';
import { useGames } from '../hooks/useGames';
import type { NewsItem, NewsTag } from '../data/news';
import { statusOf, type Tournament } from '../data/tournaments';
import { MAX_PLAYERS, MAX_RR, isLeague, champion, generate, isCurrent, toggleCurrent, setScore, setWinner, shuffled, resolve, type BFormat, type BMatch, type Bracket } from '../data/bracket';
import BracketView from './BracketView';
import FormatOpts, { fmtInit, hasOpts, toOpts } from './FormatOpts';
import BracketActions from './BracketActions';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../services/api';
import { ArrowIcon, TrophyIcon } from './icons';
import LanguageSwitcher from './LanguageSwitcher';

/** Dashboard (#/admin): its own full-screen app (no site header/footer). Follows the site language (AR/EN) and theme. */
type Adm<T> = T & { published?: boolean };
type Reg = { id: number; tournament_id: string; tournament_name: string; mode: string; plato_id: string; team_name: string; members: string; lang: string; created_at: string };
type Tab = 'overview' | 'news' | 'tournaments' | 'games' | 'regs' | 'admins' | 'log';
type Perms = Partial<Record<'news' | 'tournaments' | 'games' | 'regs', string[]>>;
type Me = { username: string; role: 'owner' | 'admin'; perms: Perms; mustChange: boolean; recovery?: boolean };

const KEY = 'elite-admin-key';
const ME = 'elite-admin-me';
const BASE = import.meta.env.BASE_URL;
const TAG_AR: Record<NewsTag, string> = { update: 'تحديث', tournament: 'بطولة', community: 'مجتمع', event: 'فعالية' };

const EN: Record<string, string> = {
  'الوضع الداكن': 'Dark mode', 'الوضع الفاتح': 'Light mode',
 'لمحة عن اللعبة': 'About the game', 'فقرة': 'Paragraph', 'عنوان الفقرة (اختياري)': 'Paragraph title (optional)', 'عنوان للفقرة (اختياري)': 'Add a title (optional)', 'اكتب نص الفقرة هنا…': 'Write the paragraph here…', 'إضافة فقرة': 'Add paragraph', 'الصور': 'Images', 'رفع صور': 'Upload images', 'من الجهاز': 'From device', 'الفيديوهات': 'Videos', 'رفع فيديو': 'Upload video', 'عنوان (اختياري)': 'Title (optional)', 'إضافة رابط': 'Add link', 'الحد الأقصى للفيديو المرفوع 50 ميجا. للفيديوهات الأطول استخدم رابط يوتيوب.': 'Uploaded videos are limited to 50 MB. For longer videos use a YouTube link.', 'الفيديو أكبر من 50 ميجا. استخدم رابط يوتيوب.': 'The video is larger than 50 MB. Use a YouTube link.', 'الصيغ المدعومة: MP4 و WebM': 'Supported formats: MP4 and WebM', 'فشل رفع الفيديو': 'Video upload failed', 'تم رفع الفيديو بنجاح': 'Video uploaded', 'رابط يوتيوب غير صحيح': 'Invalid YouTube link', 'عربي': 'Arabic',

  'تحديث': 'Update', 'بطولة': 'Tournament', 'مجتمع': 'Community', 'فعالية': 'Event',
  'لوحة التحكم': 'Dashboard', 'مرحبًا بك': 'Welcome back', 'أدخل كلمة السر للمتابعة': 'Enter the password to continue',
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
  'البراكت': 'Bracket', 'حذف هذه اللعبة من الموقع؟ تقدر تستعيدها من زر الاستعادة': 'Delete this game from the site? You can restore it with the restore button', 'تمت الاستعادة': 'Restored', 'تعذّر حفظ الترتيب': 'Could not save the order', 'ألعاب محذوفة': 'Deleted games', 'استعادة الألعاب المحذوفة': 'Restore deleted games', 'لتغيير الترتيب امسح البحث واختر كل الأنواع': 'To reorder, clear the search and choose all genres', 'اسحب لتغيير الترتيب': 'Drag to reorder', 'تحريك للأعلى': 'Move up', 'تحريك للأسفل': 'Move down', 'انتهت مهلة الرفع، الاتصال بطيء. حاول مرة ثانية': 'Upload timed out, the connection is slow. Try again', 'تحديد كالمباراة الحالية': 'Mark as current match', 'إلغاء "المباراة الحالية"': 'Unmark current match', 'تعديل أسماء اللاعبين': 'Edit player names', 'إعادة البناء تمسح النتائج الحالية. متأكد؟': 'Rebuilding clears the current results. Sure?', 'تغيير الاسم يحافظ على النتائج. لإضافة لاعب أو حذفه أو تغيير النظام:': 'Renaming keeps the results. To add/remove a player or change the format:', 'تعديل القائمة وإعادة البناء': 'Edit list & rebuild', 'براكت محفوظ': 'Bracket saved', 'إدارة البراكت والبث': 'Bracket & stream', 'نظام البراكت': 'Bracket format', 'دوري (كل لاعب ضد الكل)': 'Round robin', 'سويسري': 'Swiss', 'مجموعات ثم إقصائيات': 'Groups then knockout', 'لوحة صدارة (الكل ضد الكل)': 'Leaderboard (free-for-all)', 'اكتب الأرقام في كل جولة والترتيب يتحدث تلقائياً': 'Type the numbers of each round, the ranking updates automatically', 'نقاط الفوز': 'Win points', 'نقاط التعادل': 'Draw points', 'نقاط الخسارة': 'Loss points', 'عدد الجولات (فارغ = تلقائي)': 'Rounds (empty = auto)', 'دوري مزدوج (ذهاب وإياب)': 'Double round robin (home & away)', 'اكتب النتيجة في كل مباراة والترتيب يتحدث تلقائياً': 'Type the score of each match, standings update automatically', 'خروج المغلوب (فردي)': 'Single elimination', 'خروج مزدوج': 'Double elimination',
  'اللاعبون (اسم في كل سطر، الأعلى = الأقوى)': 'Players (one per line, top = strongest seed)', 'خلط اللاعبين عشوائياً': 'Shuffle players randomly', 'إنشاء البراكت': 'Create bracket',
  'أدخل لاعبَين على الأقل': 'Enter at least 2 players', 'اضغط على اسم الفائز في كل مباراة': 'Click the winner of each match', 'نتيجة المباراة (اختياري)': 'Match score (optional)',
  'تراجع (إلغاء الفائز)': 'Undo winner', 'حفظ البراكت': 'Save bracket', 'تم حفظ البراكت': 'Bracket saved', 'حذف البراكت': 'Delete bracket', 'حذف البراكت وإعادة البدء؟': 'Delete the bracket and start over?',
  'لم تُحفظ التعديلات بعد': 'Unsaved changes', 'البث المباشر': 'Live stream', 'رابط البث (Twitch / YouTube / Kick)': 'Stream link (Twitch / YouTube / Kick)', 'تشغيل البث للزوار': 'Show the stream to visitors',
  'إيقافه = لا شيء يظهر للزوار': 'Off = nothing is shown to visitors', 'الفائز بالبطولة': 'Tournament champion', 'أقصى عدد لاعبين': 'Max players', 'اللاعبون': 'Players',
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
  'الألعاب': 'Games', 'أضف وعدّل صور وأسماء الألعاب': 'Add games and edit their names and images', '+ لعبة جديدة': '+ New game', 'كرت البطولة': 'Tournament card', 'الكرت الكبير': 'Featured card', 'اسحب الصورة لاختيار الجزء الظاهر في البطاقة': 'Drag the picture to choose which part shows on the card', 'إعادة للوسط': 'Reset to center', 'لمحة عن اللعبة (حتى نصّين)': 'About the game (up to 2 texts)', 'مقاطع وفيديوهات (حتى 4 من يوتيوب)': 'Clips & videos (up to 4 from YouTube)', 'صور من اللعبة (حتى 4)': 'Game images (up to 4)', 'العنوان': 'Title', 'النص': 'Text', 'رابط المقطع': 'Video link', 'صورة': 'Image', 'للبطولات فقط': 'Tournaments only', 'تظهر في': 'Shown in', 'الموقع والبطولات': 'Site & tournaments', 'البطولات فقط': 'Tournaments only', 'لعبة جديدة': 'New game', 'تعديل اللعبة': 'Edit game',
  'اسم اللعبة': 'Game name', 'الوصف القصير': 'Short description', 'التصنيف (نوع اللعبة)': 'Genre', 'صورة اللعبة': 'Game image', 'أركيد': 'Arcade', 'ألعاب لوحية': 'Board', 'ألعاب ورق': 'Card', 'اجتماعية': 'Social', 'رياضة': 'Sports', 'كلمات': 'Word',
  'مخفية': 'Hidden', 'مضافة': 'Custom', 'مخصّصة': 'Edited', 'إخفاء من الموقع': 'Hide from the site', 'إظهار في الموقع': 'Show on the site', 'تعذّر تحميل الألعاب': 'Could not load games', 'حذف هذه اللعبة؟': 'Delete this game?',
  'اترك أي حقل فارغاً ليرجع للافتراضي': 'Leave any field empty to restore its default', 'تحقق من اسم اللعبة': 'Check the game name', 'الفئة': 'Tier', 'عادية': 'Regular', 'بطولة كبرى (Major) — تظهر عليها شارة': 'Major tournament — shows a badge',
};

Object.assign(EN, {"ما عندك صلاحية لهذا الإجراء": "You do not have permission for this action", "اسم المستخدم": "Username", "كلمة المرور": "Password", "الحساب مقفل. تواصل مع الأدمن الرئيسي لفتحه": "This account is locked. Contact the main admin to unlock it", "الحساب موقوف. تواصل مع الأدمن الرئيسي": "This account is disabled. Contact the main admin", "انتهت صلاحية كلمة المرور المؤقتة. اطلب من الأدمن الرئيسي كلمة جديدة": "The temporary password expired. Ask the main admin for a new one", "اسم المستخدم أو كلمة المرور غير صحيحة": "Wrong username or password", "محاولات متبقية": "attempts left", "كلمة المرور لازم تكون 10 أحرف على الأقل": "The password must be at least 10 characters", "كلمتا المرور غير متطابقتين": "The passwords do not match", "كلمة المرور الحالية غير صحيحة": "The current password is wrong", "اختر كلمة مختلفة عن الحالية وعن اسم المستخدم": "Choose a password different from the current one and from the username", "كلمة المرور الحالية": "Current password", "كلمة المرور الجديدة (10 أحرف على الأقل)": "New password (at least 10 characters)", "أعد كتابة كلمة المرور الجديدة": "Repeat the new password", "اختر كلمة مرور جديدة": "Choose a new password", "الحساب": "Account", "كلمة المرور الحالية مؤقتة. لازم تغيّرها قبل المتابعة": "The current password is temporary. You must change it before continuing", "جارٍ الحفظ…": "Saving…", "حفظ ومتابعة": "Save and continue", "تسجيل خروج": "Sign out", "تم تغيير كلمة المرور": "Password changed", "تغيير كلمة المرور": "Change password", "الإداريين": "Admins", "أنشئ حسابات وحدد صلاحيات كل أدمن": "Create accounts and set each admin's permissions", "+ أدمن جديد": "+ New admin", "الأدمن الرئيسي": "Main admin", "أدمن": "Admin", "موقوف": "Disabled", "مقفل": "Locked", "كلمة مؤقتة": "Temp password", "كل الصلاحيات": "All permissions", "آخر دخول": "Last login", "فتح الحساب": "Unlock", "الصلاحيات": "Permissions", "كلمة مرور جديدة": "New password", "إنشاء كلمة مرور مؤقتة جديدة؟ بتنتهي جلساته الحالية": "Create a new temporary password? His current sessions will end", "تفعيل": "Enable", "إيقاف": "Disable", "تم فتح الحساب": "Account unlocked", "تم تفعيل الحساب": "Account enabled", "تم إيقاف الحساب": "Account disabled", "تم حفظ الصلاحيات": "Permissions saved", "جارٍ التحميل…": "Loading…", "أدمن جديد": "New admin", "اسم المستخدم (إنجليزي، ما يتغير بعد الإنشاء)": "Username (English, cannot be changed later)", "بيتولّد له كلمة مرور مؤقتة تظهر لك مرة وحدة، ويغيّرها عند أول دخول": "A temporary password is generated, shown to you once, and he changes it at first sign-in", "جارٍ الإنشاء…": "Creating…", "إنشاء الحساب": "Create account", "تعذّر تحميل الحسابات": "Could not load accounts", "اسم المستخدم مستخدم من قبل": "That username is taken", "تعذّر إنشاء الحساب": "Could not create the account", "تعذّر تنفيذ العملية": "Could not complete the action", "اسم المستخدم: 3 إلى 24 حرف إنجليزي صغير أو رقم أو _": "Username: 3 to 24 lowercase English letters, digits or _", "اختر صلاحية واحدة على الأقل": "Choose at least one permission", "محرر أخبار": "News editor", "منظم بطولات": "Tournament organizer", "مدير ألعاب": "Games manager", "كامل": "Full", "إضافة": "Add", "عرض": "View", "بدون صلاحيات": "No permissions", "كلمة المرور المؤقتة": "Temporary password", "سلّمها للأدمن بنفسك. تظهر مرة وحدة فقط، وصلاحيتها 7 أيام، وبيُطلب منه يغيّرها عند أول دخول": "Hand it to the admin yourself. It is shown once only, valid for 7 days, and he must change it at first sign-in", "نسخ": "Copy", "تم النسخ": "Copied", "تم": "Done"});

type AdTheme = 'dark' | 'light';
/** Dashboard theme: stored on <html data-ad> while the dashboard is open so dialogs follow it too. */
function useAdTheme(): [AdTheme, () => void] {
  const [t, setT] = useState<AdTheme>(() => { try { return localStorage.getItem('elite-ad-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } });
  useEffect(() => {
    document.documentElement.dataset.ad = t;
    try { localStorage.setItem('elite-ad-theme', t); } catch { /* private mode */ }
    return () => { delete document.documentElement.dataset.ad; };
  }, [t]);
  return [t, () => setT((v) => (v === 'light' ? 'dark' : 'light'))];
}
const AdCtx = createContext<{ theme: AdTheme; toggle: () => void }>({ theme: 'dark', toggle: () => undefined });
function AdThemeBtn() {
  const { theme, toggle } = useContext(AdCtx);
  const { x } = useX();
  const light = theme === 'light', label = light ? x('الوضع الداكن') : x('الوضع الفاتح');
  return (
    <button type="button" className="st-theme" aria-label={label} title={label} onClick={toggle}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {light ? <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>}
      </svg>
    </button>
  );
}

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
const why = (err: unknown, base: string) => { if ((err as Error).message === '403') return 'ما عندك صلاحية لهذا الإجراء'; const d = (err as { detail?: string }).detail; return d ? `${base} (${d})` : base; };

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
const getMe = (): Me | null => { try { const v = sessionStorage.getItem(ME); return v ? (JSON.parse(v) as Me) : null; } catch { return null; } };
const saveMe = (m: Me) => { try { sessionStorage.setItem(ME, JSON.stringify(m)); } catch { /* ignore */ } };
const PermCtx = createContext<(sec: string, act: string) => boolean>(() => false);
const useCan = () => useContext(PermCtx);

/* ---------- Tiny inline icons ---------- */
type IP = SVGProps<SVGSVGElement>;
const ic = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
const LockI = (p: IP) => <svg {...ic} {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="3" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
const EyeI = (p: IP) => <svg {...ic} {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffI = (p: IP) => <svg {...ic} {...p}><path d="M4 4l16 16M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.2 7.6A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 3.6-.7" /></svg>;
const TrashI = (p: IP) => <svg {...ic} {...p}><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v6M14 11v6" /></svg>;
const PenI = (p: IP) => <svg {...ic} {...p}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16v4Z" /><path d="M13.5 6.5l4 4" /></svg>
const GridI = (p: IP) => <svg {...ic} {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>;
const NewsI = (p: IP) => <svg {...ic} {...p}><path d="M5 4.5h11a2 2 0 0 1 2 2V19a1.5 1.5 0 0 0 1.5 1.5H7A2.5 2.5 0 0 1 4.5 18V5A.5.5 0 0 1 5 4.5Z" /><path d="M8 9h7M8 12.5h7M8 16h4" /></svg>;
const CupI = (p: IP) => <svg {...ic} {...p}><path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5Z" /><path d="M8 6.5H5a3 3 0 0 0 3 4M16 6.5h3a3 3 0 0 1-3 4M12 13.5v3.5M8.5 20h7M10 17h4" /></svg>;
const UsersI = (p: IP) => <svg {...ic} {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5a6 6 0 0 1 12 0M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.2a6 6 0 0 1 3.5 5.3" /></svg>;
const OutI = (p: IP) => <svg {...ic} {...p}><path d="M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4M6 12h10" /></svg>;
const SearchI = (p: IP) => <svg {...ic} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
const XI = (p: IP) => <svg {...ic} strokeWidth={2.2} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;

const ShieldI = (p: IP) => <svg {...ic} {...p}><path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-2.5Z" /><path d="M9 12l2.2 2.2L15 10.5" /></svg>;
const PadI = (p: IP) => <svg {...ic} {...p}><rect x="3" y="7" width="18" height="11" rx="4" /><path d="M8 10.5v4M6 12.5h4M15.5 11.5h.01M17.5 13.5h.01" /></svg>;
const TAB_ICON: Record<Tab, (p: IP) => JSX.Element> = { overview: GridI, news: NewsI, tournaments: CupI, games: PadI, regs: UsersI, admins: ShieldI, log: GridI };
const TAB_LABEL: Record<Tab, string> = { overview: 'نظرة عامة', news: 'الأخبار', tournaments: 'البطولات', games: 'الألعاب', regs: 'التسجيلات', admins: 'الإداريين', log: 'سجل النشاط' };

/* ---------- Shared UI ---------- */
const inp = 'w-full rounded-xl border bg-[var(--chip-bg)] px-3.5 py-2.5 text-[.92rem] outline-none transition-colors focus:border-[var(--link-on)]';
const sel = `${inp} sel`;
const selCls = sel;
const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
const btnP = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[.9rem] font-bold text-white transition hover:-translate-y-px disabled:opacity-60';
const gradBtn = { background: 'linear-gradient(135deg,#3d7bff,#5b5ff0)', boxShadow: '0 8px 22px -8px rgba(61,123,255,.7)' };
const btnG = 'inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-[.85rem] font-semibold transition hover:bg-[var(--glass)]';
const ninja = { WebkitMask: `url(${BASE}brand/dice-v2.png) center / contain no-repeat`, mask: `url(${BASE}brand/dice-v2.png) center / contain no-repeat` };

/** Downscale big photos in the browser (max 1800px, WebP) before upload. GIFs and failures are sent as-is. */
async function shrink(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || !file.type.startsWith('image/')) return file;
  // If resizing stalls on a phone, give up after 10 s and upload the original instead of hanging.
  return Promise.race([shrinkNow(file), new Promise<Blob>((res) => window.setTimeout(() => res(file), 10000))]);
}
async function shrinkNow(file: File): Promise<Blob> {
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

/** Position picker: drag the picture inside a card-shaped frame to choose which part the cards show (same in Arabic and English). */
function FocusPicker({ src, pos, onChange }: { src: string; pos: string; onChange: (p: string) => void }) {
  const { x } = useX();
  const [ratio, setRatio] = useState(16 / 9);
  const [px, py] = (pos || '50% 50%').split(' ').map((n) => parseFloat(n));
  const drag = useRef<{ x: number; y: number; px: number; py: number; w: number; h: number } | null>(null);
  const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));
  const frames = [
    { key: 'card', label: x('كرت البطولة'), w: 15, h: 16 },
    { key: 'wide', label: x('الكرت الكبير'), w: 28, h: 8.5 },
  ];
  function down(e: React.PointerEvent<HTMLDivElement>, w: number, h: number) {
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, px: px || 50, py: py || 50, w: r.width, h: r.height };
    e.currentTarget.setPointerCapture(e.pointerId);
    void w; void h;
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    // object-fit: cover → the image overflows the frame on one axis only; dragging by that overflow moves the position 0→100%.
    const scale = Math.max(d.w / (ratio * 1000), d.h / 1000);
    const ow = ratio * 1000 * scale - d.w, oh = 1000 * scale - d.h;
    const nx = ow > 1 ? d.px - ((e.clientX - d.x) / ow) * 100 : d.px;
    const ny = oh > 1 ? d.py - ((e.clientY - d.y) / oh) * 100 : d.py;
    onChange(`${clamp(nx)}% ${clamp(ny)}%`);
  }
  return (
    <div className="flex flex-col gap-2 text-[.82rem] font-semibold" style={{ color: 'var(--muted)' }}>
      <span>{x('اسحب الصورة لاختيار الجزء الظاهر في البطاقة')}</span>
      <div className="flex flex-wrap items-end gap-4">
        {frames.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <div
              dir="ltr" onPointerDown={(e) => down(e, f.w, f.h)} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
              className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl border active:cursor-grabbing" style={{ width: `${f.w}rem`, maxWidth: '100%', aspectRatio: `${f.w} / ${f.h}`, borderColor: 'var(--glass-b)' }}
            >
              <img src={src} alt="" draggable={false} onLoad={(e) => setRatio(e.currentTarget.naturalWidth / Math.max(1, e.currentTarget.naturalHeight))} className="pointer-events-none h-full w-full object-cover" style={{ objectPosition: `${px}% ${py}%` }} />
              <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,12,44,.95) 0%, rgba(8,12,44,.55) 50%, rgba(8,12,44,.1) 100%)' }} />
            </div>
            <span className="text-[.74rem] font-medium">{f.label}</span>
          </div>
        ))}
      </div>
      {pos && pos !== '50% 50%' && <button type="button" className="self-start text-[.8rem] font-semibold" style={{ color: '#ff6b7a' }} onClick={() => onChange('')}>{x('إعادة للوسط')}</button>}
    </div>
  );
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
      const ac = new AbortController();
      const timer = window.setTimeout(() => ac.abort(), 60000);
      const res = await fetch('/api/upload', { method: 'POST', headers: { authorization: `Bearer ${k}` }, body: fd, signal: ac.signal }).finally(() => window.clearTimeout(timer));
      if (!res.ok) throw new Error(String(res.status));
      onChange(((await res.json()) as { url: string }).url);
      toast.ok(x('تم رفع الصورة بنجاح'));
    } catch (e) { const m = (e as Error).name === 'AbortError' ? 'timeout' : (e as Error).message; setErr(m === '500' ? x('التخزين غير مفعّل بعد (R2)') : m === 'timeout' ? x('انتهت مهلة الرفع، الاتصال بطيء. حاول مرة ثانية') : x('فشل رفع الصورة')); }
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
const Card = ({ children, className = '', ...rest }: { children: ReactNode; className?: string; 'data-gid'?: string }) => (
  <div {...rest} className={`rounded-2xl border ${className}`} style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)', backdropFilter: 'blur(10px)' }}>{children}</div>
);
function Badge({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'gray' | 'blue'; children: ReactNode }) {
  const c = { green: '#27c27a', amber: '#ffb02e', red: '#ff4d5e', gray: '#8d93ad', blue: '#8fb2ff' }[tone];
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
function Drawer({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="backdrop-fade fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={title} className={`modal-in flex h-full w-full flex-col sm:h-auto sm:max-h-[90vh] ${wide ? 'sm:max-w-[74rem]' : 'sm:max-w-[42rem]'} sm:rounded-2xl sm:border sm:shadow-2xl`} style={{ background: 'var(--dialog)', borderColor: 'var(--glass-b)' }}>
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
  const can = useCan();
  const { x } = useX();
  const [news, setNews] = useState<Adm<NewsItem>[]>([]);
  const [tours, setTours] = useState<Adm<Tournament>[]>([]);
  const [regs, setRegs] = useState<Reg[]>([]);
  useEffect(() => {
    api<Adm<NewsItem>[]>('/news', { key: k }).then(setNews).catch(() => undefined);
    api<Adm<Tournament>[]>('/tournaments', { key: k }).then(setTours).catch(() => undefined);
    if (can('regs', 'view')) api<Reg[]>('/registrations', { key: k }).then(setRegs).catch(() => undefined);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  const now = Date.now();
  const upcoming = tours.filter((t) => t.published !== false && statusOf(t, now) === 'upcoming').length;
  const live = tours.filter((t) => t.published !== false && statusOf(t, now) === 'live').length;
  const day = regs.filter((r) => now - Date.parse(`${r.created_at.replace(' ', 'T')}Z`) < 864e5).length;
  const stats = [
    { icon: NewsI, label: x('أخبار منشورة'), value: news.filter((n) => n.published !== false).length, note: `${x('من أصل')} ${news.length}`, tab: 'news' as Tab },
    { icon: CupI, label: x('بطولات قادمة'), value: upcoming, note: `${live} ${x('مباشرة الآن')}`, tab: 'tournaments' as Tab },
    ...(can('regs', 'view') ? [{ icon: UsersI, label: x('إجمالي التسجيلات'), value: regs.length, note: `${day} · ${x('آخر 24 ساعة')}`, tab: 'regs' as Tab }] : []),
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
              <div aria-hidden="true" className="pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl" style={{ background: '#3d7bff' }} />
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
  const can = useCan();
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
      <PageHead title={`${x('الأخبار')} (${rows.length})`} sub={x('أضف وعدّل أخبار الموقع')} action={can('news', 'add') ? <button className={btnP} style={gradBtn} onClick={() => { setF(emptyNews()); }}>{x('+ خبر جديد')}</button> : undefined} />
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
              {can('news', 'edit') && (<button className={btnG} style={bd} title={x('تعديل')} aria-label={x('تعديل')} onClick={() => { setF({ ...r, image: r.image ?? '', href: r.href ?? '' }); }}><PenI className="h-4 w-4" /></button>)}
              {can('news', 'delete') && (<button className={btnG} style={{ ...bd, color: '#ff6b7a' }} title={x('حذف')} aria-label={x('حذف')} onClick={() => del(r.id)}><TrashI className="h-4 w-4" /></button>)}
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
            <Field label={x('الملخص (عربي)')}><textarea rows={5} placeholder={x('اكتب كل نقطة في سطر يبدأ بـ -')} className={inp} style={bd} value={f.summary.ar} onChange={(e) => setF({ ...f, summary: { ...f.summary, ar: e.target.value } })} /></Field>
            <Field label="Summary (English)"><textarea dir="ltr" rows={5} placeholder="Write each point on its own line starting with -" className={inp} style={bd} value={f.summary.en} onChange={(e) => setF({ ...f, summary: { ...f.summary, en: e.target.value } })} /></Field>
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

/* ---------- Bracket + live stream (per tournament) ---------- */
function BracketAdmin({ t0, k, onClose, onAuthFail, onSaved }: { t0: Adm<Tournament>; k: string; onClose: () => void; onAuthFail: () => void; onSaved: () => void }) {
  const { lang, x } = useX();
  const toast = useToast();
  const [br, setBr] = useState<Bracket | null>(t0.bracket ?? null);
  const [dirty, setDirty] = useState(false);
  const [fmt, setFmt] = useState<BFormat>('single');
  const [names, setNames] = useState('');
  const [shuf, setShuf] = useState(false);
  const [lo, setLo] = useState(fmtInit());
  const [sel, setSel] = useState<string | null>(null);
  const [editP, setEditP] = useState(false);
  const [url, setUrl] = useState(t0.streamUrl ?? '');
  const [live, setLive] = useState(!!t0.streamLive);
  const upd = (b: Bracket | null) => { setBr(b); setDirty(true); };

  function create() {
    const list = names.split('\n').map((n) => n.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
    if (list.length < 2) { toast.err(x('أدخل لاعبَين على الأقل')); return; }
    if (fmt === 'rr' && list.length > MAX_RR) { toast.err(`${x('أقصى عدد لاعبين')} ${MAX_RR}`); return; }
    upd(generate(fmt, shuf ? shuffled(list) : list, hasOpts(fmt) ? toOpts(fmt, lo, list.length) : undefined)); setSel(null);
  }
  function pick(m: BMatch, side: 'a' | 'b') {
    if (!br) return;
    setSel(m.id);
    upd(setWinner(br, m.id, m.win === side ? undefined : side));
  }
  const rename = (i: number, v: string) => br && upd({ ...br, players: br.players.map((p, j) => (j === i ? v.slice(0, 40) : p)) });
  function rebuild() {
    if (!br || !window.confirm(x('إعادة البناء تمسح النتائج الحالية. متأكد؟'))) return;
    setNames(br.players.join('\n')); setFmt(br.format); upd(null); setSel(null); setEditP(false);
  }
  const m = br && sel ? br.matches.find((i) => i.id === sel) : undefined;
  const R = br ? resolve(br) : null;

  async function save() {
    try {
      await api(`/tournaments/${t0.id}/bracket`, { method: 'PUT', body: JSON.stringify({ bracket: br, streamUrl: url, streamLive: live }), key: k });
      setDirty(false); toast.ok(x('تم حفظ البراكت')); onSaved();
    } catch (err) { if ((err as Error).message === '401') onAuthFail(); else toast.err(why(err, x('تعذّر تنفيذ العملية'))); }
  }
  const champ = br ? champion(br) : null;

  return (
    <Drawer wide title={`${x('إدارة البراكت والبث')} — ${t0.name[lang] || t0.name.ar || t0.name.en}`} onClose={onClose}>
      <div className="grid min-w-0 grid-cols-1 gap-6 [&>*]:min-w-0">
        <div className="rounded-xl border p-4" style={bd}>
          <b className="mb-3 block">{x('البث المباشر')}</b>
          <div className="grid gap-3">
            <Field label={x('رابط البث (Twitch / YouTube / Kick)')}><input dir="ltr" className={inp} style={bd} value={url} placeholder="https://twitch.tv/…" onChange={(e) => { setUrl(e.target.value); setDirty(true); }} /></Field>
            <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={live} onChange={(e) => { setLive(e.target.checked); setDirty(true); }} />{x('تشغيل البث للزوار')} <span style={{ color: 'var(--muted)' }}>· {x('إيقافه = لا شيء يظهر للزوار')}</span></label>
          </div>
        </div>

        {!br ? (
          <div className="grid gap-4 rounded-xl border p-4" style={bd}>
            <b>{x('البراكت')}</b>
            <Field label={x('نظام البراكت')}><select className={selCls} style={bd} value={fmt} onChange={(e) => setFmt(e.target.value as BFormat)}><option value="single">{x('خروج المغلوب (فردي)')}</option><option value="double">{x('خروج مزدوج')}</option><option value="rr">{x('دوري (كل لاعب ضد الكل)')}</option><option value="swiss">{x('سويسري')}</option><option value="groups">{x('مجموعات ثم إقصائيات')}</option><option value="ffa">{x('لوحة صدارة (الكل ضد الكل)')}</option></select></Field>
            <FormatOpts fmt={fmt} value={lo} onChange={setLo} lang={lang} inpCls={inp} style={bd} border={bd} players={names.split('\n').filter((q) => q.trim()).length} />
            <Field label={`${x('اللاعبون (اسم في كل سطر، الأعلى = الأقوى)')}${fmt === 'rr' ? ` · ${x('أقصى عدد لاعبين')} ${MAX_RR}` : ''}`}><textarea rows={8} dir="auto" className={inp} style={bd} value={names} onChange={(e) => setNames(e.target.value)} /></Field>
            <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={shuf} onChange={(e) => setShuf(e.target.checked)} />{x('خلط اللاعبين عشوائياً')}</label>
            <div><button type="button" className={btnP} style={gradBtn} onClick={create}>{x('إنشاء البراكت')}</button></div>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 [&>*]:min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3"><b>{isLeague(br) || br.format === 'groups' ? x('اكتب النتيجة في كل مباراة والترتيب يتحدث تلقائياً') : br.format === 'ffa' ? x('اكتب الأرقام في كل جولة والترتيب يتحدث تلقائياً') : x('اضغط على اسم الفائز في كل مباراة')}</b>{champ !== null && <Badge tone="green"><TrophyIcon className="me-1 inline h-3.5 w-3.5 align-[-2px]" />{br.players[champ]}</Badge>}</div>
            <BracketActions bracket={br} title={t0.name[lang] || t0.name.ar || t0.name.en} url={`${window.location.origin}${window.location.pathname}#/tournaments/${t0.id}`} />
            <div className="rounded-xl border p-3" style={bd}><BracketView bracket={br} onPick={pick} selected={sel} onChange={upd} live /></div>
            <div className="rounded-xl border p-3" style={bd}>
              <button type="button" className={btnG} style={bd} onClick={() => setEditP((v) => !v)}>{x('تعديل أسماء اللاعبين')} {editP ? '▲' : '▼'}</button>
              {editP && (
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {br.players.map((p, i) => <label key={i} className="flex items-center gap-2 text-[.8rem]"><span className="w-6 text-center" style={{ color: 'var(--muted)' }}>{i + 1}</span><input dir="auto" className={inp} style={bd} value={p} onChange={(e) => rename(i, e.target.value)} /></label>)}
                  </div>
                  <p className="text-[.8rem]" style={{ color: 'var(--muted)' }}>{x('تغيير الاسم يحافظ على النتائج. لإضافة لاعب أو حذفه أو تغيير النظام:')}</p>
                  <div><button type="button" className={btnG} style={{ ...bd, color: '#ffb02e' }} onClick={rebuild}>{x('تعديل القائمة وإعادة البناء')}</button></div>
                </div>
              )}
            </div>
            {m && R && (
              <div className="sticky bottom-0 z-10 flex flex-wrap items-end gap-3 rounded-xl border p-3 shadow-2xl" style={{ ...bd, background: 'var(--dialog)' }}>
                <b className="self-center">{m.id}</b>
                <Field label={x('نتيجة المباراة (اختياري)')}>
                  <div className="flex items-center gap-2" dir="ltr">
                    <input className={`${inp} !w-16 text-center`} style={bd} maxLength={4} value={m.sa ?? ''} onChange={(e) => upd(setScore(br, m.id, e.target.value, m.sb ?? ''))} />
                    <span>–</span>
                    <input className={`${inp} !w-16 text-center`} style={bd} maxLength={4} value={m.sb ?? ''} onChange={(e) => upd(setScore(br, m.id, m.sa ?? '', e.target.value))} />
                  </div>
                </Field>
                {!m.win && typeof R.get(m.id)?.a === 'number' && typeof R.get(m.id)?.b === 'number' && <button type="button" className={btnP} style={gradBtn} onClick={() => upd(toggleCurrent(br, m.id))}>{isCurrent(br, m.id) ? x('إلغاء "المباراة الحالية"') : x('تحديد كالمباراة الحالية')}</button>}
                {m.win && <button type="button" className={btnG} style={bd} onClick={() => upd(setWinner(br, m.id, undefined))}>{x('تراجع (إلغاء الفائز)')}</button>}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t pt-4" style={bd}>
          <button type="button" className={btnP} style={gradBtn} onClick={save}>{x('حفظ البراكت')}</button>
          {br && <button type="button" className={btnG} style={{ ...bd, color: '#ff6b7a' }} onClick={() => { if (window.confirm(x('حذف البراكت وإعادة البدء؟'))) { upd(null); setSel(null); } }}>{x('حذف البراكت')}</button>}
          <button type="button" className={btnG} style={bd} onClick={onClose}>{x('إلغاء')}</button>
          {dirty && <span className="text-[.82rem]" style={{ color: '#ffb02e' }}>{x('لم تُحفظ التعديلات بعد')}</span>}
        </div>
      </div>
    </Drawer>
  );
}

function TournamentsTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const can = useCan();
  const { lang, x } = useX();
  const GAMES = useGames();
  const [rows, setRows] = useState<Adm<Tournament>[]>([]);
  const [f, setF] = useState<Adm<Tournament> | null>(null);
  const [brT, setBrT] = useState<Adm<Tournament> | null>(null);
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
      <PageHead title={`${x('البطولات')} (${rows.length})`} sub={x('أضف وعدّل البطولات وعدد المقاعد')} action={can('tournaments', 'add') ? <button className={btnP} style={gradBtn} onClick={() => { setF(emptyT()); }}>{x('+ بطولة جديدة')}</button> : undefined} />
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const st = statusOf(r, now);
          const pct = Math.min(100, (r.slots.filled / Math.max(1, r.slots.total)) * 100);
          return (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b className="truncate">{r.name[lang] || r.name.ar || r.name.en}</b><Badge tone={ST_TONE[st]}>{x(ST_AR[st])}</Badge>{r.tier === 'major' && <Badge tone="blue">Major</Badge>}{r.bracket && st === 'completed' && <Badge tone="gray">{x('براكت محفوظ')}</Badge>}{r.published === false && <Badge tone="gray">{x('مسودة')}</Badge>}</div>
                <div className="mt-1 text-[.8rem]" dir="ltr" style={{ color: 'var(--muted)', textAlign: lang === 'ar' ? 'right' : 'left' }}>{when(r.startsAt)}</div>
              </div>
              <div className="w-36">
                <div className="mb-1 flex justify-between text-[.76rem]" style={{ color: 'var(--muted)' }}><span>{x('المقاعد')}</span><span dir="ltr">{r.slots.filled}/{r.slots.total}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--track)' }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#3d7bff,#5b5ff0)' }} /></div>
              </div>
              <div className="flex gap-2">
                <button className={btnG} style={bd} onClick={() => setBrT(r)}>{x('البراكت')}{r.bracket ? ' ✓' : ''}</button>
                {can('tournaments', 'edit') && (<button className={btnG} style={bd} title={x('تعديل')} aria-label={x('تعديل')} onClick={() => { setF({ ...r, winner: r.winner ?? { ar: '', en: '' }, registerUrl: r.registerUrl ?? '', image: r.image ?? '', winnerMembers: r.winnerMembers ?? [] }); }}><PenI className="h-4 w-4" /></button>)}
                {can('tournaments', 'delete') && (<button className={btnG} style={{ ...bd, color: '#ff6b7a' }} title={x('حذف')} aria-label={x('حذف')} onClick={() => del(r.id)}><TrashI className="h-4 w-4" /></button>)}
              </div>
            </Card>
          );
        })}
        {!rows.length && <Card className="p-8 text-center"><span style={{ color: 'var(--muted)' }}>{x('ما فيه بطولات بعد.')}</span></Card>}
      </div>

      {brT && <BracketAdmin key={brT.id} t0={brT} k={k} onClose={() => setBrT(null)} onAuthFail={onAuthFail} onSaved={load} />}
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
            {f.image && <FocusPicker src={f.image} pos={f.imagePos ?? ''} onChange={(p) => setF({ ...f, imagePos: p })} />}
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

/* ---------- Game page content: paragraphs, images, videos (grow with a + button) ---------- */
const MAX_TEXTS = 12, MAX_IMAGES = 24, MAX_VIDEOS = 8, MAX_VIDEO_MB = 50;
const mv = <T,>(a: T[], i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= a.length) return a; const n = [...a]; [n[i], n[j]] = [n[j], n[i]]; return n; };

function ParaCard({ i, n, t, onChange, onMove, onDel }: { i: number; n: number; t: GameDetails['texts'][number]; onChange: (t: GameDetails['texts'][number]) => void; onMove: (d: -1 | 1) => void; onDel: () => void }) {
  const { x } = useX();
  const [titleOn, setTitleOn] = useState(!!(t.title.ar || t.title.en));
  const langs: ['ar' | 'en', string][] = [['ar', x('عربي')], ['en', 'English']];
  return (
    <div className="grid gap-2 rounded-xl border p-3" style={bd}>
      <div className="flex items-center gap-3 text-[.8rem] font-bold" style={{ color: 'var(--muted)' }}>
        <span>{x('فقرة')} {i + 1}</span><span className="flex-1" />
        <button type="button" disabled={i === 0} aria-label="up" onClick={() => onMove(-1)} className="px-1 disabled:opacity-30">↑</button>
        <button type="button" disabled={i === n - 1} aria-label="down" onClick={() => onMove(1)} className="px-1 disabled:opacity-30">↓</button>
        <button type="button" onClick={onDel} style={{ color: '#ff6b7a' }}>{x('حذف')}</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {langs.map(([l, label]) => (
          <div key={l} className="grid content-start gap-2">
            <span className="text-[.78rem] font-bold" style={{ color: 'var(--muted)' }}>{label}</span>
            {titleOn && <input dir={l === 'en' ? 'ltr' : 'rtl'} className={inp} style={bd} placeholder={x('عنوان الفقرة (اختياري)')} value={t.title[l]} onChange={(e) => onChange({ ...t, title: { ...t.title, [l]: e.target.value } })} />}
            <textarea dir={l === 'en' ? 'ltr' : 'rtl'} rows={4} className={inp} style={bd} placeholder={x('اكتب نص الفقرة هنا…')} value={t.body[l]} onChange={(e) => onChange({ ...t, body: { ...t.body, [l]: e.target.value } })} />
          </div>
        ))}
      </div>
      {!titleOn && <button type="button" className="self-start text-[.8rem] font-semibold" style={{ color: 'var(--muted)' }} onClick={() => setTitleOn(true)}>+ {x('عنوان للفقرة (اختياري)')}</button>}
    </div>
  );
}

function DetailsEditor({ k, value, onChange }: { k: string; value: GameDetails; onChange: (d: GameDetails) => void }) {
  const { x } = useX();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const [pct, setPct] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const set = (p: Partial<GameDetails>) => onChange({ ...value, ...p });

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    let list = [...value.images];
    setBusy('img');
    try {
      for (const file of [...files].slice(0, MAX_IMAGES - list.length)) {
        const fd = new FormData(); fd.append('file', await shrink(file), 'image');
        const res = await fetch('/api/upload', { method: 'POST', headers: { authorization: `Bearer ${k}` }, body: fd });
        if (!res.ok) throw new Error(String(res.status));
        list = [...list, ((await res.json()) as { url: string }).url];
        onChange({ ...value, images: list });
      }
      toast.ok(x('تم رفع الصورة بنجاح'));
    } catch (e) { toast.err((e as Error).message === '500' ? x('التخزين غير مفعّل بعد (R2)') : x('فشل رفع الصورة')); }
    setBusy('');
  }

  function addVideoFile(file?: File) {
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { toast.err(x('الفيديو أكبر من 50 ميجا. استخدم رابط يوتيوب.')); return; }
    const type = file.type === 'video/webm' ? 'video/webm' : file.type === 'video/mp4' ? 'video/mp4' : '';
    if (!type) { toast.err(x('الصيغ المدعومة: MP4 و WebM')); return; }
    setBusy('vid'); setPct(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('authorization', `Bearer ${k}`);
    xhr.setRequestHeader('content-type', type);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = () => { setBusy(''); setPct(null); toast.err(x('فشل رفع الفيديو')); };
    xhr.onload = () => {
      setBusy(''); setPct(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        try { const url = (JSON.parse(xhr.responseText) as { url: string }).url; onChange({ ...value, videos: [...value.videos, { title: { ar: '', en: '' }, url }] }); toast.ok(x('تم رفع الفيديو بنجاح')); } catch { toast.err(x('فشل رفع الفيديو')); }
      } else toast.err(xhr.status === 500 ? x('التخزين غير مفعّل بعد (R2)') : x('فشل رفع الفيديو'));
    };
    xhr.send(file);
  }
  function addLink() {
    const u = link.trim();
    if (!youtubeId(u)) { toast.err(x('رابط يوتيوب غير صحيح')); return; }
    set({ videos: [...value.videos, { title: { ar: '', en: '' }, url: u }] }); setLink('');
  }

  const tile = 'relative aspect-video w-[8.5rem] overflow-hidden rounded-xl border';
  const addTile = 'grid aspect-video w-[8.5rem] cursor-pointer place-items-center rounded-xl border-2 border-dashed p-2 text-center text-[.8rem] font-bold transition-colors hover:bg-[var(--glass)]';
  const xBtn = 'absolute start-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[.7rem] leading-none text-[#ff6b7a]';
  return (
    <div className="grid gap-3">
      <div className="mt-3 flex items-center gap-3">
        <h4 className="flex-1 font-bold">{x('لمحة عن اللعبة')}</h4>
      </div>
      {value.texts.map((t, i) => (
        <ParaCard key={i} i={i} n={value.texts.length} t={t}
          onChange={(nt) => set({ texts: value.texts.map((o, j) => (j === i ? nt : o)) })}
          onMove={(d) => set({ texts: mv(value.texts, i, d) })}
          onDel={() => set({ texts: value.texts.filter((_, j) => j !== i) })} />
      ))}
      {value.texts.length < MAX_TEXTS && <button type="button" className={`${btnG} self-start border-dashed`} style={{ borderColor: '#3b3f8f', color: '#a99bff' }} onClick={() => set({ texts: [...value.texts, { title: { ar: '', en: '' }, body: { ar: '', en: '' } }] })}>＋ {x('إضافة فقرة')}</button>}

      <h4 className="mt-3 font-bold">{x('الصور')}</h4>
      <div className="flex flex-wrap gap-3 rounded-xl border p-3" style={bd}>
        {value.images.map((src, i) => (
          <div key={src + i} className={tile} style={bd}>
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" aria-label="remove" className={xBtn} onClick={() => set({ images: value.images.filter((_, j) => j !== i) })}>×</button>
            <span className="absolute bottom-1 end-1 flex gap-1 text-[.8rem]">
              <button type="button" aria-label="earlier" disabled={i === 0} className="rounded bg-black/70 px-1.5 disabled:opacity-30" onClick={() => set({ images: mv(value.images, i, -1) })}>‹</button>
              <button type="button" aria-label="later" disabled={i === value.images.length - 1} className="rounded bg-black/70 px-1.5 disabled:opacity-30" onClick={() => set({ images: mv(value.images, i, 1) })}>›</button>
            </span>
          </div>
        ))}
        {value.images.length < MAX_IMAGES && (
          <label className={addTile} style={{ borderColor: '#3b3f8f', color: '#a99bff' }}>
            <span>{busy === 'img' ? x('جارٍ الرفع…') : <>＋ {x('رفع صور')}<br /><span className="font-normal" style={{ color: 'var(--muted)' }}>{x('من الجهاز')}</span></>}</span>
            <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={!!busy} onChange={(e) => { void addImages(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>

      <h4 className="mt-3 font-bold">{x('الفيديوهات')}</h4>
      <div className="grid gap-3 rounded-xl border p-3" style={bd}>
        <div className="flex flex-wrap gap-3">
          {value.videos.map((v, i) => {
            const yt = youtubeId(v.url);
            return (
              <div key={v.url + i} className="grid w-[8.5rem] gap-1.5">
                <div className={tile} style={bd}>
                  {isVideoFile(v.url) ? <video src={v.url} muted preload="metadata" className="h-full w-full object-cover" /> : yt ? <img src={`https://i.ytimg.com/vi/${yt}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" /> : null}
                  <span className="pointer-events-none absolute inset-0 grid place-items-center"><i className="grid h-8 w-8 place-items-center rounded-full bg-[#3d7bff] text-[.8rem] not-italic text-white">▶</i></span>
                  <button type="button" aria-label="remove" className={xBtn} onClick={() => set({ videos: value.videos.filter((_, j) => j !== i) })}>×</button>
                </div>
                {(['ar', 'en'] as const).map((l) => (
                  <input key={l} dir={l === 'en' ? 'ltr' : 'rtl'} className={`${inp} !py-1.5 !text-[.8rem]`} style={bd} placeholder={`${x('عنوان (اختياري)')} · ${l === 'ar' ? x('عربي') : 'EN'}`} value={v.title[l]} onChange={(e) => set({ videos: value.videos.map((o, j) => (j === i ? { ...o, title: { ...o.title, [l]: e.target.value } } : o)) })} />
                ))}
              </div>
            );
          })}
          {value.videos.length < MAX_VIDEOS && (
            <label className={addTile} style={{ borderColor: '#3b3f8f', color: '#a99bff' }}>
              <span>{busy === 'vid' ? `${pct ?? 0}%` : <>＋ {x('رفع فيديو')}<br /><span className="font-normal" style={{ color: 'var(--muted)' }}>MP4 / WebM</span></>}</span>
              <input type="file" accept="video/mp4,video/webm" className="sr-only" disabled={!!busy} onChange={(e) => { addVideoFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          )}
        </div>
        {busy === 'vid' && <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--glass-b)' }}><div className="h-full transition-[width]" style={{ width: `${pct ?? 0}%`, background: '#3d7bff' }} /></div>}
        {value.videos.length < MAX_VIDEOS && (
          <div className="flex gap-2">
            <input dir="ltr" className={inp} style={bd} placeholder="https://youtube.com/watch?v=…" value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
            <button type="button" className={`${btnG} shrink-0 whitespace-nowrap`} style={bd} onClick={addLink}>{x('إضافة رابط')}</button>
          </div>
        )}
        <p className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{x('الحد الأقصى للفيديو المرفوع 50 ميجا. للفيديوهات الأطول استخدم رابط يوتيوب.')}</p>
      </div>
    </div>
  );
}

/* ---------- Games ---------- */
type GForm = { id: string; custom: boolean; hidden: boolean; name: { ar: string; en: string }; tagline: { ar: string; en: string }; genre: string; image: string; tournamentOnly: boolean; details: GameDetails };

function GamesTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const can = useCan();
  const { lang, x } = useX();
  const [rows, setRows] = useState<AdminGame[]>([]);
  const [f, setF] = useState<GForm | null>(null);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('all');
  const [gone, setGone] = useState<string[]>([]);
  const toast = useToast();
  const load = useCallback(() => { api<GameRow[]>('/games', { key: k }).then((r) => { setRows(mergeGames(r)); setGone(r.find((i) => i.id === '__meta')?.deleted ?? []); }).catch(() => toast.err(x('تعذّر تحميل الألعاب'))); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  const toForm = (g: AdminGame): GForm => ({ id: g.id, custom: g.custom, hidden: g.hidden, name: { ar: g.name.ar, en: g.name.en }, tagline: { ar: g.tagline.ar, en: g.tagline.en }, genre: g.genreKey, image: g.image ?? '', tournamentOnly: !!g.tournamentOnly, details: fullDetails(g.details) });
  const fail = (err: unknown, m: string) => { if ((err as Error).message === '401') onAuthFail(); else toast.err((err as Error).message === '403' ? x('ما عندك صلاحية لهذا الإجراء') : m); };
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
    if (!window.confirm(x(g.custom ? 'حذف هذه اللعبة؟' : 'حذف هذه اللعبة من الموقع؟ تقدر تستعيدها من زر الاستعادة'))) return;
    try {
      await api(`/games/${g.id}`, { method: 'DELETE', key: k });
      if (!g.custom) await api('/games/meta', { method: 'PUT', body: JSON.stringify({ deleted: [...gone, g.id] }), key: k });
      toast.ok(x('تم الحذف بنجاح'));
    } catch (err) { fail(err, why(err, x('تعذّر تنفيذ العملية'))); }
    load();
  }
  async function restore() {
    try { await api('/games/meta', { method: 'PUT', body: JSON.stringify({ deleted: [] }), key: k }); toast.ok(x('تمت الاستعادة')); load(); } catch (err) { fail(err, why(err, x('تعذّر تنفيذ العملية'))); }
  }
  /** Moves a game one place up/down in the full list and saves the new order. */
  async function move(g: AdminGame, d: -1 | 1) {
    const i = rows.findIndex((r) => r.id === g.id), j = i + d;
    if (i < 0 || j < 0 || j >= rows.length) return;
    const next = [...rows]; [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    try { await api('/games/meta', { method: 'PUT', body: JSON.stringify({ order: next.map((r) => r.id) }), key: k }); }
    catch (err) { fail(err, why(err, x('تعذّر حفظ الترتيب'))); load(); }
  }
  const sorting = !term && genre === 'all';

  // Drag & drop reorder (mouse and touch): grab the lines handle, drop where the red line shows.
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null);
  const dragRef = useRef<{ id: string; over: number; y: number } | null>(null);
  const overAt = (y: number) => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-gid]')];
    let over = els.length;
    for (let i = 0; i < els.length; i++) { const r = els[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { over = i; break; } }
    return over;
  };
  const syncOver = () => { const d = dragRef.current; if (!d) return; const o = overAt(d.y); if (o !== d.over) { d.over = o; setDrag({ id: d.id, over: o }); } };
  useEffect(() => {
    if (!drag) return;
    // keep scrolling while the finger/mouse is held near the top or bottom edge
    const t = window.setInterval(() => {
      const d = dragRef.current; if (!d) return;
      const h = window.innerHeight;
      const dy = d.y < 90 ? -16 : d.y > h - 90 ? 16 : 0;
      if (dy) { let el: HTMLElement | null = document.querySelector<HTMLElement>(`[data-gid="${d.id}"]`)?.parentElement ?? null; while (el && !(el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY))) el = el.parentElement; if (el) el.scrollBy(0, dy); else window.scrollBy(0, dy); syncOver(); }
    }, 16);
    return () => window.clearInterval(t);
  }, [!!drag]); // eslint-disable-line react-hooks/exhaustive-deps
  function dragStart(e: React.PointerEvent<HTMLButtonElement>, g: AdminGame) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const i = rows.findIndex((r) => r.id === g.id);
    dragRef.current = { id: g.id, over: i, y: e.clientY };
    setDrag({ id: g.id, over: i });
  }
  function dragMove(e: React.PointerEvent<HTMLButtonElement>) { if (dragRef.current) { dragRef.current.y = e.clientY; syncOver(); } }
  async function dragEnd() {
    const d = dragRef.current; dragRef.current = null; setDrag(null);
    if (!d) return;
    const from = rows.findIndex((r) => r.id === d.id), to = d.over > from ? d.over - 1 : d.over;
    if (from < 0 || to === from) return;
    const next = [...rows]; const [item] = next.splice(from, 1); next.splice(to, 0, item);
    setRows(next);
    try { await api('/games/meta', { method: 'PUT', body: JSON.stringify({ order: next.map((r) => r.id) }), key: k }); }
    catch (err) { fail(err, why(err, x('تعذّر حفظ الترتيب'))); load(); }
  }
  const pairF = (name: 'name' | 'tagline', label: string, en: string, area = false) => f && (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={lang === 'en' ? `${en} (Arabic)` : `${label} (عربي)`}>{area ? <textarea rows={2} className={inp} style={bd} value={f[name].ar} onChange={(e) => setF({ ...f, [name]: { ...f[name], ar: e.target.value } })} /> : <input className={inp} style={bd} value={f[name].ar} onChange={(e) => setF({ ...f, [name]: { ...f[name], ar: e.target.value } })} />}</Field>
      <Field label={`${en} (English)`}>{area ? <textarea dir="ltr" rows={2} className={inp} style={bd} value={f[name].en} onChange={(e) => setF({ ...f, [name]: { ...f[name], en: e.target.value } })} /> : <input dir="ltr" className={inp} style={bd} value={f[name].en} onChange={(e) => setF({ ...f, [name]: { ...f[name], en: e.target.value } })} />}</Field>
    </div>
  );

  return (
    <div>
      <PageHead title={`${x('الألعاب')} (${shown.length})`} sub={x('أضف وعدّل صور وأسماء الألعاب')} action={can('games', 'add') ? <button className={btnP} style={gradBtn} onClick={() => { setF({ id: '', custom: true, hidden: false, name: { ar: '', en: '' }, tagline: { ar: '', en: '' }, genre: 'Arcade', image: '', tournamentOnly: false, details: emptyDetails() }); }}>{x('+ لعبة جديدة')}</button> : undefined} />
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
      {gone.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-3 text-[.85rem]" style={{ color: 'var(--muted)' }}><span>{x('ألعاب محذوفة')}: {gone.length}</span><button type="button" className={btnG} style={bd} onClick={restore}>{x('استعادة الألعاب المحذوفة')}</button></div>}
      {!sorting && <p className="mb-3 text-[.8rem]" style={{ color: 'var(--muted)' }}>{x('لتغيير الترتيب امسح البحث واختر كل الأنواع')}</p>}
      {!shown.length && <p className="py-10 text-center" style={{ color: 'var(--muted)' }}>{x('لا توجد ألعاب مطابقة')}</p>}
      <div className="flex flex-col gap-2.5">
        {shown.map((g, gi) => (
          <Fragment key={g.id}>
            {drag && sorting && drag.over === gi && drag.over !== rows.findIndex((r) => r.id === drag.id) && drag.over !== rows.findIndex((r) => r.id === drag.id) + 1 && <div className="h-1 rounded-full" style={{ background: '#3d7bff' }} />}
          <Card data-gid={g.id} className={`flex flex-wrap items-center gap-4 p-3.5 max-sm:flex-nowrap max-sm:gap-2.5 ${g.hidden || drag?.id === g.id ? 'opacity-60' : ''} ${drag?.id === g.id ? 'scale-[.98]' : ''}`}>
            {sorting && (
              <button type="button" className="grid h-10 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg border active:cursor-grabbing" style={bd} aria-label={x('اسحب لتغيير الترتيب')} title={x('اسحب لتغيير الترتيب')}
                onPointerDown={(e) => dragStart(e, g)} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}
                onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); void move(g, -1); } else if (e.key === 'ArrowDown') { e.preventDefault(); void move(g, 1); } }}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M5 7h14M5 12h14M5 17h14" /></svg>
              </button>
            )}
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl max-sm:h-12 max-sm:w-12" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}>
              {g.image && <img src={g.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold max-sm:whitespace-normal max-sm:break-words max-sm:leading-snug">{g.name[lang] || g.name.ar || g.name.en}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[.8rem]" style={{ color: 'var(--muted)' }}>
                <span>{genreLabel(g.genreKey)[lang]}</span>
                {g.custom && <Badge tone="blue">{x('مضافة')}</Badge>}
                {g.hidden && <Badge tone="gray">{x('مخفية')}</Badge>}
                {g.tournamentOnly && <Badge tone="amber">{x('للبطولات فقط')}</Badge>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2 max-sm:gap-1.5">
              {can('games', 'edit') && (<button className={`${btnG} max-sm:!h-9 max-sm:!w-9 max-sm:!px-0`} style={bd} title={x('تعديل')} aria-label={x('تعديل')} onClick={() => { setF(toForm(g)); }}><PenI className="h-4 w-4" /></button>)}
              <button type="button" className={`${btnG} !px-3 max-sm:!h-9 max-sm:!w-9 max-sm:!px-0`} style={bd} onClick={() => toggle(g)} aria-label={g.hidden ? x('إظهار في الموقع') : x('إخفاء من الموقع')} title={g.hidden ? x('إظهار في الموقع') : x('إخفاء من الموقع')}>
                <svg viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {g.hidden ? <><path d="M17.9 17.9A10.4 10.4 0 0 1 12 19.5C6.5 19.5 3 12 3 12a17.6 17.6 0 0 1 4.1-5.1M9.9 4.6A9.7 9.7 0 0 1 12 4.5c5.5 0 9 7.5 9 7.5a17.5 17.5 0 0 1-2.2 3.3M14.1 14.1a3 3 0 0 1-4.2-4.2" /><path d="m3 3 18 18" /></> : <><path d="M3 12s3.5-7.5 9-7.5S21 12 21 12s-3.5 7.5-9 7.5S3 12 3 12Z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
              </button>
              {can('games', 'delete') && (<button className={`${btnG} max-sm:!h-9 max-sm:!w-9 max-sm:!px-0`} style={{ ...bd, color: '#ff6b7a' }} title={x('حذف')} aria-label={x('حذف')} onClick={() => del(g)}><TrashI className="h-4 w-4" /></button>)}
            </div>
          </Card>
          </Fragment>
        ))}
        {drag && sorting && drag.over === rows.length && rows.findIndex((r) => r.id === drag.id) !== rows.length - 1 && <div className="h-1 rounded-full" style={{ background: '#3d7bff' }} />}
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
            <DetailsEditor k={k} value={f.details} onChange={(d) => setF({ ...f, details: d })} />
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
  const can = useCan();
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
          <thead><tr style={{ color: 'var(--muted)' }}>{[x('البطولة'), 'Plato ID', x('الفريق'), x('الأعضاء'), x('التاريخ'), ''].map((h, i) => <th key={i} className="px-4 py-3 text-center text-[.78rem] font-bold uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t align-top" style={{ borderColor: 'var(--glass-b)' }}>
                <td className="px-4 py-3 text-center">{r.tournament_name}</td>
                <td className="px-4 py-3 font-semibold" dir="ltr" style={{ textAlign: 'center' }}>{r.plato_id}</td>
                <td className="px-4 py-3 text-center">{r.team_name || '—'}</td>
                <td className="whitespace-pre-line px-4 py-3 text-center" dir="ltr" style={{ textAlign: 'center' }}>{r.members || '—'}</td>
                <td className="px-4 py-3" dir="ltr" style={{ textAlign: 'center', color: 'var(--muted)' }}>{r.created_at}</td>
                <td className="px-4 py-3">{can('regs', 'delete') && <button className="p-1" style={{ color: '#ff6b7a' }} title={x('حذف')} aria-label={x('حذف')} onClick={() => del(r.id)}><TrashI className="h-[18px] w-[18px]" /></button>}</td>
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
function PwInput({ value, onChange, label, auto, focus }: { value: string; onChange: (v: string) => void; label: string; auto: string; focus?: boolean }) {
  const { x } = useX();
  const [show, setShow] = useState(false);
  return (
    <label className="mt-4 flex flex-col gap-2 text-[.85rem] font-semibold" style={{ color: 'var(--muted)' }}>{label}
      <span className="relative block">
        <LockI className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 opacity-60" />
        <input type={show ? 'text' : 'password'} autoFocus={focus} autoComplete={auto} dir="ltr" className={`${inp} !py-3 !ps-10 !pe-11`} style={{ ...bd, textAlign: 'start' }} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? x('إخفاء') : x('إظهار')} className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg opacity-70 hover:opacity-100">
          {show ? <EyeOffI className="h-[18px] w-[18px]" /> : <EyeI className="h-[18px] w-[18px]" />}
        </button>
      </span>
    </label>
  );
}

function AuthShell({ children, onSubmit, title, sub }: { children: ReactNode; onSubmit: (e: FormEvent) => void; title: string; sub: string }) {
  const { x } = useX();
  return (
    <section className="admin-bg relative grid min-h-[100svh] place-items-center overflow-hidden px-5 py-10">
      <div className="absolute end-4 top-4 z-10 flex gap-2"><AdThemeBtn /><LanguageSwitcher /></div>
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle,#3d7bff,transparent 70%)' }} />
      <form onSubmit={onSubmit} className="relative w-full max-w-[26rem] rounded-[1.75rem] border p-8 shadow-2xl" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)' }}>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white" style={gradBtn}>
          <span aria-hidden="true" className="inline-block h-9 w-9 bg-current" style={ninja} />
        </div>
        <h1 className="mt-5 text-center text-[1.55rem] font-extrabold">{title}</h1>
        <p className="mt-1 text-center text-[.92rem]" style={{ color: 'var(--muted)' }}>{sub}</p>
        {children}
        <a href="#/" className="mt-5 flex items-center justify-center gap-2 text-[.85rem]" style={{ color: 'var(--muted)' }}><ArrowIcon className="h-4 w-4 -scale-x-100 rtl:scale-x-100" />{x('العودة للموقع')}</a>
      </form>
    </section>
  );
}
const ErrBox = ({ text }: { text: string }) => (text ? <p role="alert" className="mt-3 rounded-lg px-3 py-2 text-[.88rem] font-semibold" style={{ color: '#ff6b7a', background: 'rgba(255,77,94,.12)' }}>{text}</p> : null);

function Login({ onDone }: { onDone: (key: string, me: Me) => void }) {
  const { x } = useX();
  const [user, setUser] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !pw || !user.trim()) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: user.trim(), password: pw }) });
      const j = (await res.json().catch(() => ({}))) as { token?: string; username?: string; role?: 'owner' | 'admin'; perms?: Perms; mustChange?: boolean; recovery?: boolean; error?: string; left?: number };
      if (res.ok && j.token) { onDone(j.token, { username: j.username ?? user, role: j.role ?? 'admin', perms: j.perms ?? {}, mustChange: !!j.mustChange, recovery: !!j.recovery }); setBusy(false); return; }
      if (j.error === 'locked') setErr(x('الحساب مقفل. تواصل مع الأدمن الرئيسي لفتحه'));
      else if (j.error === 'disabled') setErr(x('الحساب موقوف. تواصل مع الأدمن الرئيسي'));
      else if (j.error === 'expired') setErr(x('انتهت صلاحية كلمة المرور المؤقتة. اطلب من الأدمن الرئيسي كلمة جديدة'));
      else if (res.status === 401) setErr(j.left ? `${x('اسم المستخدم أو كلمة المرور غير صحيحة')} (${x('محاولات متبقية')}: ${j.left})` : x('اسم المستخدم أو كلمة المرور غير صحيحة'));
      else setErr(x('تعذّر الاتصال بالخادم'));
    } catch { setErr(x('تعذّر الاتصال بالخادم')); }
    setBusy(false);
  }

  return (
    <AuthShell onSubmit={submit} title={x('مرحبًا بك')} sub={`Plato AR · ${x('لوحة التحكم')}`}>
      <label className="mt-7 flex flex-col gap-2 text-[.85rem] font-semibold" style={{ color: 'var(--muted)' }}>{x('اسم المستخدم')}
        <input autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" className={`${inp} !py-3`} style={{ ...bd, textAlign: 'start' }} value={user} onChange={(e) => setUser(e.target.value)} />
      </label>
      <PwInput value={pw} onChange={setPw} label={x('كلمة المرور')} auto="current-password" />
      <ErrBox text={err} />
      <button type="submit" disabled={busy || !pw || !user.trim()} className={`${btnP} mt-6 w-full !py-3 text-[1rem]`} style={gradBtn}>{busy ? x('جارٍ الدخول…') : x('دخول')}</button>
    </AuthShell>
  );
}

/** Change-password form. Forced at the first login (temporary password) and also used voluntarily from the sidebar. */
function usePwForm(k: string, me: Me, onOk: () => void) {
  const { x } = useX();
  const [cur, setCur] = useState(''); const [n1, setN1] = useState(''); const [n2, setN2] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const needCur = !me.recovery;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (n1.length < 10) { setErr(x('كلمة المرور لازم تكون 10 أحرف على الأقل')); return; }
    if (n1 !== n2) { setErr(x('كلمتا المرور غير متطابقتين')); return; }
    setBusy(true); setErr('');
    try { await api('/admin/password', { method: 'POST', key: k, body: JSON.stringify({ current: cur, next: n1 }) }); onOk(); }
    catch (ex) {
      const m = (ex as Error).message;
      setErr(m === '401' ? x('كلمة المرور الحالية غير صحيحة') : m === '400' ? x('اختر كلمة مختلفة عن الحالية وعن اسم المستخدم') : x('تعذّر الاتصال بالخادم'));
    }
    setBusy(false);
  }
  const fields = (
    <>
      {needCur && <PwInput value={cur} onChange={setCur} label={x('كلمة المرور الحالية')} auto="current-password" focus />}
      <PwInput value={n1} onChange={setN1} label={x('كلمة المرور الجديدة (10 أحرف على الأقل)')} auto="new-password" focus={!needCur} />
      <PwInput value={n2} onChange={setN2} label={x('أعد كتابة كلمة المرور الجديدة')} auto="new-password" />
      <ErrBox text={err} />
    </>
  );
  return { submit, fields, busy, ready: !!n1 && !!n2 && (!needCur || !!cur) };
}

function ForceChange({ k, me, onDone, onLogout }: { k: string; me: Me; onDone: () => void; onLogout: () => void }) {
  const { x } = useX();
  const f = usePwForm(k, me, onDone);
  return (
    <AuthShell onSubmit={f.submit} title={x('اختر كلمة مرور جديدة')} sub={`${x('الحساب')}: ${me.username}`}>
      <p className="mt-4 text-center text-[.88rem]" style={{ color: 'var(--muted)' }}>{x('كلمة المرور الحالية مؤقتة. لازم تغيّرها قبل المتابعة')}</p>
      {f.fields}
      <button type="submit" disabled={f.busy || !f.ready} className={`${btnP} mt-6 w-full !py-3 text-[1rem]`} style={gradBtn}>{f.busy ? x('جارٍ الحفظ…') : x('حفظ ومتابعة')}</button>
      <button type="button" onClick={onLogout} className="mt-3 w-full text-center text-[.85rem]" style={{ color: 'var(--muted)' }}>{x('تسجيل خروج')}</button>
    </AuthShell>
  );
}

function PwDrawer({ k, me, onClose }: { k: string; me: Me; onClose: () => void }) {
  const { x } = useX();
  const toast = useToast();
  const f = usePwForm(k, me, () => { toast.ok(x('تم تغيير كلمة المرور')); onClose(); });
  return (
    <Drawer title={x('تغيير كلمة المرور')} onClose={onClose}>
      <form onSubmit={f.submit}>
        {f.fields}
        <button type="submit" disabled={f.busy || !f.ready} className={`${btnP} mt-6 w-full`} style={gradBtn}>{f.busy ? x('جارٍ الحفظ…') : x('حفظ')}</button>
      </form>
    </Drawer>
  );
}

/* ---------- Admin accounts (owner only) ---------- */
type AdminRow = { username: string; role: 'owner' | 'admin'; perms: Perms; mustChange: boolean; tempExpires: number; disabled: boolean; locked: boolean; lastLogin: number; createdAt: number; createdBy: string };
const PERM_ROWS: { sec: keyof Perms; label: string; acts: [string, string][] }[] = [
  { sec: 'news', label: 'الأخبار', acts: [['add', 'إضافة'], ['edit', 'تعديل'], ['delete', 'حذف']] },
  { sec: 'tournaments', label: 'البطولات', acts: [['add', 'إضافة'], ['edit', 'تعديل'], ['delete', 'حذف']] },
  { sec: 'games', label: 'الألعاب', acts: [['add', 'إضافة'], ['edit', 'تعديل'], ['delete', 'حذف']] },
  { sec: 'regs', label: 'التسجيلات', acts: [['view', 'عرض'], ['delete', 'حذف']] },
];
const PRESET_LIST: { id: string; label: string; perms: Perms }[] = [
  { id: 'news', label: 'محرر أخبار', perms: { news: ['add', 'edit', 'delete'] } },
  { id: 'tournaments', label: 'منظم بطولات', perms: { tournaments: ['add', 'edit', 'delete'], regs: ['view'] } },
  { id: 'games', label: 'مدير ألعاب', perms: { games: ['add', 'edit', 'delete'] } },
  { id: 'full', label: 'كامل', perms: { news: ['add', 'edit', 'delete'], tournaments: ['add', 'edit', 'delete'], games: ['add', 'edit', 'delete'], regs: ['view', 'delete'] } },
];
const sameP = (a: Perms, b: Perms) => PERM_ROWS.every((r) => [...(a[r.sec] ?? [])].sort().join() === [...(b[r.sec] ?? [])].sort().join());

function PermGrid({ value, onChange }: { value: Perms; onChange: (p: Perms) => void }) {
  const { x } = useX();
  const flip = (sec: keyof Perms, act: string) => {
    let cur = [...(value[sec] ?? [])];
    if (cur.includes(act)) { cur = cur.filter((a) => a !== act); if (sec === 'regs' && act === 'view') cur = []; }
    else { cur.push(act); if (sec === 'regs' && act === 'delete' && !cur.includes('view')) cur.push('view'); }
    const n = { ...value, [sec]: cur }; if (!cur.length) delete n[sec];
    onChange(n);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_LIST.map((pr) => {
          const on = sameP(value, pr.perms);
          return <button key={pr.id} type="button" onClick={() => onChange(pr.perms)} className="rounded-full border px-3 py-1.5 text-[.82rem] font-bold transition" style={on ? { color: '#fff', ...gradBtn, borderColor: 'transparent' } : bd}>{x(pr.label)}</button>;
        })}
      </div>
      <div className="mt-1 flex flex-col gap-1.5">
        {PERM_ROWS.map((r) => (
          <div key={r.sec} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border px-3.5 py-2.5" style={{ borderColor: 'var(--glass-b)' }}>
            <span className="min-w-[5.5rem] text-[.9rem] font-extrabold">{x(r.label)}</span>
            {r.acts.map(([a, l]) => (
              <label key={a} className="inline-flex cursor-pointer items-center gap-1.5 text-[.88rem] font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-[#3d7bff]" checked={!!value[r.sec]?.includes(a)} onChange={() => flip(r.sec, a)} />{x(l)}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const permText = (p: Perms, x: (s: string) => string) => {
  const t = PERM_ROWS.filter((r) => p[r.sec]?.length).map((r) => `${x(r.label)}: ${(p[r.sec] ?? []).map((a) => x(r.acts.find((z) => z[0] === a)?.[1] ?? a)).join(' · ')}`);
  return t.length ? t : [x('بدون صلاحيات')];
};

function TempPw({ r, onClose }: { r: { username: string; password: string }; onClose: () => void }) {
  const { x } = useX();
  const [copied, setCopied] = useState(false);
  const txt = `${x('اسم المستخدم')}: ${r.username}\n${x('كلمة المرور المؤقتة')}: ${r.password}`;
  return (
    <Drawer title={x('كلمة المرور المؤقتة')} onClose={onClose}>
      <p className="text-[.92rem]" style={{ color: 'var(--muted)' }}>{x('سلّمها للأدمن بنفسك. تظهر مرة وحدة فقط، وصلاحيتها 7 أيام، وبيُطلب منه يغيّرها عند أول دخول')}</p>
      <div dir="ltr" className="mt-4 rounded-xl border p-4 text-center" style={{ borderColor: 'var(--glass-b)', background: 'var(--chip-bg)' }}>
        <div className="text-[.82rem]" style={{ color: 'var(--muted)' }}>{r.username}</div>
        <div className="mt-1 select-all text-[1.5rem] font-black tracking-wider">{r.password}</div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="button" className={`${btnP} flex-1`} style={gradBtn} onClick={() => { void navigator.clipboard?.writeText(txt).then(() => setCopied(true)).catch(() => undefined); }}>{copied ? x('تم النسخ') : x('نسخ')}</button>
        <button type="button" className={btnG} style={bd} onClick={onClose}>{x('تم')}</button>
      </div>
    </Drawer>
  );
}

type LogRow = { id: number; at: number; username: string; action: string; target: string; detail: string };
const LOG_ACTION: Record<string, string> = {
  'login.ok': 'تسجيل دخول', 'login.recovery': 'دخول بمفتاح الاسترجاع', 'login.fail': 'محاولة دخول فاشلة', 'login.blocked': 'محاولة على حساب مقفل', 'login.lockout': 'قفل الحساب بعد محاولات فاشلة',
  'password.change': 'تغيير كلمة المرور',
  'admins.create': 'إنشاء حساب أدمن', 'admins.permissions': 'تعديل صلاحيات', 'admins.disable': 'إيقاف حساب', 'admins.enable': 'تفعيل حساب', 'admins.unlock': 'فتح حساب مقفل', 'admins.reset': 'كلمة مرور مؤقتة جديدة',
  'news.add': 'إضافة خبر', 'news.edit': 'تعديل خبر', 'news.delete': 'حذف خبر',
  'tournaments.add': 'إضافة بطولة', 'tournaments.edit': 'تعديل بطولة', 'tournaments.delete': 'حذف بطولة', 'tournaments.bracket': 'تعديل شجرة/بث',
  'games.add': 'إضافة لعبة', 'games.edit': 'تعديل لعبة', 'games.delete': 'حذف لعبة', 'games.order': 'ترتيب/حذف ألعاب',
  'regs.delete': 'حذف تسجيل',
};
Object.assign(EN, {"سجل النشاط": "Activity log", "سجل دائم لا يمكن تعديله أو حذفه. يعرض من فعل ماذا ومتى": "A permanent log that cannot be edited or deleted. Shows who did what and when", "كل الإداريين": "All admins", "كل الأحداث": "All events", "من": "From", "إلى": "To", "تحميل المزيد": "Load more", "ما فيه سجلات": "No entries", "جدول السجل غير موجود في قاعدة البيانات. شغّل أمر الإنشاء من ADMIN-SETUP.md": "The log table is missing from the database. Run the create statement from ADMIN-SETUP.md", "تعذّر تحميل السجل": "Could not load the log", "الأدمن": "Admin", "الوقت": "Time", "الحدث": "Event", "الهدف": "Target", "التفاصيل": "Details", "تسجيل دخول": "Sign-in", "دخول بمفتاح الاسترجاع": "Recovery-key sign-in", "محاولة دخول فاشلة": "Failed sign-in", "محاولة على حساب مقفل": "Attempt on a locked account", "قفل الحساب بعد محاولات فاشلة": "Account locked after failed attempts", "تغيير كلمة المرور": "Password changed", "إنشاء حساب أدمن": "Admin account created", "تعديل صلاحيات": "Permissions changed", "إيقاف حساب": "Account disabled", "تفعيل حساب": "Account enabled", "فتح حساب مقفل": "Account unlocked", "كلمة مرور مؤقتة جديدة": "New temporary password", "إضافة خبر": "News added", "تعديل خبر": "News edited", "حذف خبر": "News deleted", "إضافة بطولة": "Tournament added", "تعديل بطولة": "Tournament edited", "حذف بطولة": "Tournament deleted", "تعديل شجرة/بث": "Bracket/stream edited", "إضافة لعبة": "Game added", "تعديل لعبة": "Game edited", "حذف لعبة": "Game deleted", "ترتيب/حذف ألعاب": "Games order/removal", "حذف تسجيل": "Registration deleted"});

/** Owner-only, read-only activity log. There is deliberately no edit or delete control anywhere. */
function LogTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const { x, lang } = useX();
  const toast = useToast();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  const [missing, setMissing] = useState(false);
  const [f, setF] = useState({ user: '', action: '', from: '', to: '' });
  const qs = useCallback((before?: number) => {
    const q = new URLSearchParams();
    if (f.user) q.set('user', f.user);
    if (f.action) q.set('action', f.action);
    if (f.from) q.set('from', String(new Date(`${f.from}T00:00:00+03:00`).getTime()));
    if (f.to) q.set('to', String(new Date(`${f.to}T00:00:00+03:00`).getTime() + 86400000));
    if (before) q.set('before', String(before));
    return q.toString();
  }, [f]);
  const load = useCallback((append = false) => {
    const before = append && rows.length ? rows[rows.length - 1].id : undefined;
    api<{ rows: LogRow[]; users: string[]; actions: string[]; more: boolean; missing?: boolean }>(`/admin/log?${qs(before)}`, { key: k })
      .then((r) => { setRows((p) => (append ? [...p, ...r.rows] : r.rows)); setUsers(r.users); setActions(r.actions); setMore(r.more); setMissing(!!r.missing); })
      .catch((e: Error) => { if (e.message === '401') onAuthFail(); else toast.err(x('تعذّر تحميل السجل')); });
  }, [k, qs, rows]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(false); }, [f, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const when = (t: number) => new Date(t).toLocaleString(lang === 'en' ? 'en-GB' : 'ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'medium' });
  const sel = 'h-10 rounded-xl border border-white/15 bg-white/[.06] px-3 text-[.9rem] text-inherit';
  const fmt = (d: string) => {
    if (!d) return null;
    try {
      const o = JSON.parse(d) as Record<string, unknown>;
      return Object.entries(o).filter(([, v]) => v !== undefined).map(([key, v]) => (Array.isArray(v) && v.length === 2 && typeof v[0] === 'string'
        ? <div key={key} dir="ltr" className="text-left"><b>{key}</b>: <span className="opacity-60 line-through">{String(v[0]) || '∅'}</span> → <span>{String(v[1]) || '∅'}</span></div>
        : <div key={key} dir="ltr" className="text-left"><b>{key}</b>: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>));
    } catch { return d; }
  };
  return (
    <div className="space-y-4">
      <p className="text-[.95rem] opacity-70">{x('سجل دائم لا يمكن تعديله أو حذفه. يعرض من فعل ماذا ومتى')}</p>
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} aria-label={x('الأدمن')}>
          <option value="">{x('كل الإداريين')}</option>{users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className={sel} value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} aria-label={x('الحدث')}>
          <option value="">{x('كل الأحداث')}</option>{actions.map((a) => <option key={a} value={a}>{LOG_ACTION[a] ? x(LOG_ACTION[a]) : a}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[.85rem] opacity-80">{x('من')}<input type="date" className={sel} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-[.85rem] opacity-80">{x('إلى')}<input type="date" className={sel} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
      </div>
      {missing && <p className="rounded-xl border border-[#ffc93c]/40 bg-[#ffc93c]/10 p-3 text-[.9rem]">{x('جدول السجل غير موجود في قاعدة البيانات. شغّل أمر الإنشاء من ADMIN-SETUP.md')}</p>}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[40rem] text-start text-[.88rem]">
          <thead className="bg-white/[.06] text-[.8rem] opacity-80"><tr>{['الوقت', 'الأدمن', 'الحدث', 'الهدف', 'التفاصيل'].map((h) => <th key={h} className="px-3 py-2 text-start font-bold">{x(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10 align-top">
                <td className="whitespace-nowrap px-3 py-2 opacity-80">{when(r.at)}</td>
                <td className="px-3 py-2 font-bold" dir="ltr">{r.username}</td>
                <td className="px-3 py-2">{LOG_ACTION[r.action] ? x(LOG_ACTION[r.action]) : r.action}</td>
                <td className="px-3 py-2" dir="auto">{r.target}</td>
                <td className="px-3 py-2 text-[.8rem] opacity-90">{fmt(r.detail)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="px-3 py-8 text-center opacity-60">{x('ما فيه سجلات')}</td></tr>}
          </tbody>
        </table>
      </div>
      {more && <button type="button" onClick={() => load(true)} className="h-10 rounded-xl border border-white/20 px-4 font-bold">{x('تحميل المزيد')}</button>}
    </div>
  );
}

function AdminsTab({ k, onAuthFail }: { k: string; onAuthFail: () => void }) {
  const { x, lang } = useX();
  const toast = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [add, setAdd] = useState<{ username: string; perms: Perms } | null>(null);
  const [edit, setEdit] = useState<{ username: string; perms: Perms } | null>(null);
  const [temp, setTemp] = useState<{ username: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { api<AdminRow[]>('/admin/admins', { key: k }).then(setRows).catch((e: Error) => { if (e.message === '401') onAuthFail(); else toast.err(x('تعذّر تحميل الحسابات')); }); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);
  const fail = (e: unknown, m: string) => { const c = (e as Error).message; if (c === '401') onAuthFail(); else toast.err(c === '409' ? x('اسم المستخدم مستخدم من قبل') : m); };
  const when2 = (t: number) => (t ? new Date(t).toLocaleString(lang === 'en' ? 'en-GB' : 'ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short' }) : '—');

  async function create() {
    if (!add || busy) return;
    if (!/^[a-z0-9_]{3,24}$/.test(add.username)) { toast.err(x('اسم المستخدم: 3 إلى 24 حرف إنجليزي صغير أو رقم أو _')); return; }
    if (!Object.keys(add.perms).length) { toast.err(x('اختر صلاحية واحدة على الأقل')); return; }
    setBusy(true);
    try { const r = await api<{ username: string; password: string }>('/admin/admins', { method: 'POST', key: k, body: JSON.stringify({ username: add.username, perms: add.perms }) }); setAdd(null); setTemp(r); load(); }
    catch (e) { fail(e, x('تعذّر إنشاء الحساب')); }
    setBusy(false);
  }
  async function patch(u: string, b: Record<string, unknown>, ok: string) {
    try { const r = await api<{ password?: string }>(`/admin/admins/${encodeURIComponent(u)}`, { method: 'PATCH', key: k, body: JSON.stringify(b) }); if (r.password) setTemp({ username: u, password: r.password }); else toast.ok(ok); load(); }
    catch (e) { fail(e, x('تعذّر تنفيذ العملية')); }
  }

  return (
    <div>
      <PageHead title={`${x('الإداريين')} (${rows.length})`} sub={x('أنشئ حسابات وحدد صلاحيات كل أدمن')} action={<button className={btnP} style={gradBtn} onClick={() => setAdd({ username: '', perms: {} })}>{x('+ أدمن جديد')}</button>} />
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <Card key={r.username} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="text-[1.02rem] font-extrabold">{r.username}</span>
                  {r.role === 'owner' && <Badge tone="blue">{x('الأدمن الرئيسي')}</Badge>}
                  {r.disabled && <Badge tone="gray">{x('موقوف')}</Badge>}
                  {r.locked && <Badge tone="red">{x('مقفل')}</Badge>}
                  {r.mustChange && r.role !== 'owner' && <Badge tone="amber">{x('كلمة مؤقتة')}</Badge>}
                </div>
                <div className="mt-1.5 flex flex-col gap-0.5 text-[.84rem]" style={{ color: 'var(--muted)' }}>
                  {r.role === 'owner' ? <span>{x('كل الصلاحيات')}</span> : permText(r.perms, x).map((t) => <span key={t}>{t}</span>)}
                  <span>{x('آخر دخول')}: {when2(r.lastLogin)}</span>
                </div>
              </div>
              {r.role !== 'owner' && (
                <div className="flex flex-wrap items-center gap-2">
                  {r.locked && <button className={btnG} style={{ ...bd, color: '#27c27a' }} onClick={() => patch(r.username, { action: 'unlock' }, x('تم فتح الحساب'))}>{x('فتح الحساب')}</button>}
                  <button className={btnG} style={bd} onClick={() => setEdit({ username: r.username, perms: r.perms })}><PenI className="h-4 w-4" />{x('الصلاحيات')}</button>
                  <button className={btnG} style={bd} onClick={() => { if (window.confirm(x('إنشاء كلمة مرور مؤقتة جديدة؟ بتنتهي جلساته الحالية'))) void patch(r.username, { action: 'reset' }, ''); }}>{x('كلمة مرور جديدة')}</button>
                  <button className={btnG} style={{ ...bd, color: r.disabled ? '#27c27a' : '#ff6b7a' }} onClick={() => patch(r.username, { disabled: !r.disabled }, r.disabled ? x('تم تفعيل الحساب') : x('تم إيقاف الحساب'))}>{r.disabled ? x('تفعيل') : x('إيقاف')}</button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {!rows.length && <Card className="p-8 text-center text-[.92rem] opacity-70">{x('جارٍ التحميل…')}</Card>}
      </div>

      {add && (
        <Drawer title={x('أدمن جديد')} onClose={() => setAdd(null)}>
          <label className="flex flex-col gap-2 text-[.85rem] font-semibold" style={{ color: 'var(--muted)' }}>{x('اسم المستخدم (إنجليزي، ما يتغير بعد الإنشاء)')}
            <input dir="ltr" autoFocus autoCapitalize="none" spellCheck={false} className={inp} style={{ ...bd, textAlign: 'start' }} value={add.username} onChange={(e) => setAdd({ ...add, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) })} placeholder="ahmed_news" />
          </label>
          <div className="mt-5 text-[.85rem] font-semibold" style={{ color: 'var(--muted)' }}>{x('الصلاحيات')}</div>
          <div className="mt-2"><PermGrid value={add.perms} onChange={(p) => setAdd({ ...add, perms: p })} /></div>
          <p className="mt-4 text-[.84rem]" style={{ color: 'var(--muted)' }}>{x('بيتولّد له كلمة مرور مؤقتة تظهر لك مرة وحدة، ويغيّرها عند أول دخول')}</p>
          <button type="button" disabled={busy} className={`${btnP} mt-5 w-full`} style={gradBtn} onClick={create}>{busy ? x('جارٍ الإنشاء…') : x('إنشاء الحساب')}</button>
        </Drawer>
      )}
      {edit && (
        <Drawer title={`${x('الصلاحيات')} · ${edit.username}`} onClose={() => setEdit(null)}>
          <PermGrid value={edit.perms} onChange={(p) => setEdit({ ...edit, perms: p })} />
          <button type="button" className={`${btnP} mt-5 w-full`} style={gradBtn} onClick={() => { const e = edit; setEdit(null); void patch(e.username, { perms: e.perms }, x('تم حفظ الصلاحيات')); }}>{x('حفظ')}</button>
        </Drawer>
      )}
      {temp && <TempPw r={temp} onClose={() => setTemp(null)} />}
    </div>
  );
}

/* ---------- Shell ---------- */
function AdminInner() {
  const { x } = useX();
  const [key, setKey] = useState(getKey);
  const [me, setMe] = useState<Me | null>(getMe);
  const [tab, setTab] = useState<Tab>('overview');
  const [menu, setMenu] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const pick = (id: Tab) => { setTab(id); setMenu(false); window.scrollTo({ top: 0 }); };
  const clear = useCallback(() => { try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(ME); } catch { /* ignore */ } setKey(''); setMe(null); }, []);
  const logout = useCallback(() => { if (key) void fetch('/api/admin/logout', { method: 'POST', headers: { authorization: `Bearer ${key}` } }).catch(() => undefined); clear(); }, [key, clear]);
  const onLogin = (token: string, m: Me) => { try { sessionStorage.setItem(KEY, token); } catch { /* ignore */ } saveMe(m); setKey(token); setMe(m); };
  // Re-read the account from the server (permissions may have changed) and drop dead sessions.
  useEffect(() => {
    if (!key) return;
    api<Me>('/admin/me', { key }).then((m) => { setMe((o) => { const n = { ...m, recovery: m.recovery ?? o?.recovery }; saveMe(n); return n; }); }).catch((e: Error) => { if (e.message === '401') clear(); });
  }, [key, clear]);
  const can = useCallback((sec: string, act: string) => !!me && (me.role === 'owner' || !!(me.perms as Record<string, string[] | undefined>)[sec]?.includes(act)), [me]);

  if (!key || !me) return <Login onDone={onLogin} />;
  if (me.mustChange) return <ForceChange k={key} me={me} onLogout={logout} onDone={() => { const n = { ...me, mustChange: false, recovery: false }; saveMe(n); setMe(n); }} />;

  const tabs = (Object.keys(TAB_LABEL) as Tab[]).filter((id) => id === 'overview' || ((id === 'admins' || id === 'log') ? me.role === 'owner' : id === 'regs' ? can('regs', 'view') : !!(me.perms as Record<string, string[] | undefined>)[id]?.length || me.role === 'owner'));
  return (
    <ToastHost><PermCtx.Provider value={can}><div className="min-h-[100svh] overflow-x-clip lg:grid lg:grid-cols-[16.5rem_1fr]" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <aside className="hidden flex-col self-start overflow-y-auto border-e p-5 lg:sticky lg:top-0 lg:flex lg:h-[100svh]" style={{ borderColor: 'var(--glass-b)', background: 'var(--glass)' }}>
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
          <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={gradBtn}><span aria-hidden="true" className="inline-block h-5 w-5 bg-current" style={ninja} /></span>
          <div className="leading-tight"><div className="text-[1.05rem] font-extrabold">Plato AR</div><div className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{x('لوحة التحكم')}</div></div>
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
        <div className="mt-auto pt-6">
          <div className="mb-3 grid gap-2">
            <a href="#/" className="pill !h-10 w-full justify-center" style={{ gap: '.4rem' }}><ArrowIcon className="h-4 w-4 -scale-x-100 rtl:scale-x-100" />{x('العودة للموقع')}</a>
            <button type="button" onClick={logout} className="pill !h-10 w-full justify-center" style={{ gap: '.4rem', color: '#ff6b7a', borderColor: 'rgba(255,107,122,.4)' }}><OutI className="h-4 w-4" />{x('تسجيل خروج')}</button>
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--glass-b)' }}>
            <div dir="ltr" className="truncate text-[.92rem] font-extrabold">{me.username}</div>
            <div className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{me.role === 'owner' ? x('الأدمن الرئيسي') : x('أدمن')}</div>
            <button type="button" onClick={() => setPwOpen(true)} className="mt-2 text-[.82rem] font-semibold underline-offset-2 hover:underline" style={{ color: 'var(--muted)' }}>{x('تغيير كلمة المرور')}</button>
          </div>
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
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={logout} className="pill lg:hidden" style={{ gap: '.4rem' }} aria-label={x('تسجيل خروج')}><OutI className="h-4 w-4" /></button>
            <AdThemeBtn />
            <LanguageSwitcher />
          </div>
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
              <button type="button" onClick={() => { setMenu(false); setPwOpen(true); }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-start text-[1rem] font-semibold" style={{ color: 'var(--muted)' }}><LockI className="h-5 w-5" /><span dir="ltr">{me.username}</span> · {x('تغيير كلمة المرور')}</button>
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
          {tab === 'admins' && me.role === 'owner' && <AdminsTab k={key} onAuthFail={logout} />}
          {tab === 'log' && me.role === 'owner' && <LogTab k={key} onAuthFail={logout} />}
          </div>
        </main>
      </div>
      {pwOpen && <PwDrawer k={key} me={me} onClose={() => setPwOpen(false)} />}
    </div></PermCtx.Provider></ToastHost>
  );
}

export default function AdminPage() {
  const [theme, toggle] = useAdTheme();
  return <AdCtx.Provider value={{ theme, toggle }}><AdminInner /></AdCtx.Provider>;
}
