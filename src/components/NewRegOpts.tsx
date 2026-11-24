/** "New tournament" form: switch for the registration link. When it is on, the link's options appear; they are sent with the first save of the tournament (see BracketToolPage). */
export interface RegOpts { on: boolean; desc: string; done: string; showCount: boolean; auto: boolean; autoClose: boolean; closeAt: number }
export const regInit = (): RegOpts => ({ on: false, desc: '', done: '', showCount: true, auto: true, autoClose: true, closeAt: 0 });

const TWO_HOURS = 2 * 3600_000;
/** Closing time offered by default: the tournament start if it is still ahead, otherwise two hours from now (same rule as the registration link card). */
export const defaultClose = (startsAt?: string) => { const t = Date.parse(startsAt ?? ''); return t > Date.now() + 60_000 ? t : Date.now() + TWO_HOURS; };
const pad2 = (n: number) => String(n).padStart(2, '0');
const toLocal = (ms: number) => { if (!(ms > 0)) return ''; const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fromLocal = (v: string) => { const t = new Date(v).getTime(); return Number.isNaN(t) ? 0 : t; };

const T = {
  ar: { on: 'تفعيل رابط التسجيل', onNote: 'صفحة تسجيل يملؤها اللاعبون بأنفسهم، تنسخ رابطها بعد إنشاء البطولة وتنشره.', desc: 'وصف صفحة التسجيل (اختياري)', descPh: 'مثال: القوانين، الجائزة، طريقة اللعب…', done: 'رسالة بعد التسجيل (اختياري)', doneNote: 'تظهر للاعب مباشرة بعد تسجيله. إن تركتها فارغة تظهر الرسالة الافتراضية «أنت الآن في الحلبة».', count: 'إظهار عدد المسجلين في صفحة التسجيل', auto: 'إضافة المسجلين للشجرة تلقائيًا', autoNote: 'يمكنك إيقافها وإضافة المسجلين يدويًا من القائمة.', close: 'إغلاق تلقائي في وقت محدد', closeNote: 'الوقت الافتراضي هو بداية البطولة.' },
  en: { on: 'Enable the registration link', onNote: 'A sign-up page that players fill in themselves. Copy its link after the tournament is created and share it.', desc: 'Registration page description (optional)', descPh: 'e.g. rules, prize, how it is played…', done: 'Message after registering (optional)', doneNote: 'Shown to the player right after they register. If you leave it empty the default message ("You are in the arena now") is shown.', count: 'Show the number of registrants on the registration page', auto: 'Automatically add registrants to bracket', autoNote: 'Turn off to add registrants manually from the list.', close: 'Close automatically at a set time', closeNote: 'The default is the tournament start.' },
};
const line = 'w-full rounded-xl border bg-transparent px-3 py-2 text-[.9rem] outline-none focus:border-[#3d7bff]';
const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };

export default function NewRegOpts({ lang, v, onChange, startsAt }: { lang: 'ar' | 'en'; v: RegOpts; onChange: (patch: Partial<RegOpts>) => void; startsAt?: string }) {
  const t = T[lang];
  const sw = (on: boolean, label: string, set: (on: boolean) => void) => <button type="button" role="switch" aria-checked={on} aria-label={label} className={`st-sw ${on ? 'on' : ''}`} onClick={() => set(!on)}><i /></button>;
  return (
    <div className="grid gap-3 rounded-xl border p-3.5" style={bd}>
      <div className="st-shh"><div><span>{t.on}</span><small>{t.onNote}</small></div>{sw(v.on, t.on, (on) => onChange({ on }))}</div>
      {v.on && (
        <>
          <label className="grid gap-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.desc}
            <textarea dir="auto" className={`${line} min-h-[5rem] resize-y`} style={bd} maxLength={600} placeholder={t.descPh} value={v.desc} onChange={(e) => onChange({ desc: e.target.value })} /></label>
          <label className="grid gap-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.done}
            <textarea dir="auto" className={`${line} min-h-[4.5rem] resize-y`} style={bd} maxLength={400} value={v.done} onChange={(e) => onChange({ done: e.target.value })} />
            <small>{t.doneNote}</small></label>
          <div className="st-shh"><div><span>{t.count}</span></div>{sw(v.showCount, t.count, (showCount) => onChange({ showCount }))}</div>
          <div className="st-shh"><div><span>{t.auto}</span><small>{t.autoNote}</small></div>{sw(v.auto, t.auto, (auto) => onChange({ auto }))}</div>
          <div className="grid gap-1.5">
            <div className="st-shh"><div><span>{t.close}</span><small>{t.closeNote}</small></div>{sw(v.autoClose, t.close, (autoClose) => onChange({ autoClose }))}</div>
            {v.autoClose && <input type="datetime-local" className={line} style={bd} dir="ltr" value={toLocal(v.closeAt || defaultClose(startsAt))} onChange={(e) => { const ms = fromLocal(e.target.value); if (ms > 0) onChange({ closeAt: ms }); }} />}
          </div>
        </>
      )}
    </div>
  );
}
