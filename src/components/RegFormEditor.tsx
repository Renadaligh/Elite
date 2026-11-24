import { useState } from 'react';
import { PRESET_HUES, hexOfHue, hueOfHex, plainVars, tintVars, useCoverHue } from '../data/regTheme';
import { FormFields, QuestionsEditor, type Answers, type RegFormData } from './RegForm';

/** Designer of the registration page. The organiser edits the page itself (picture, description, colour, questions) in the site's own look,
 *  and can switch to "what the player sees". Fully controlled: the parent keeps the values and decides when they are saved. */
const T = {
  ar: { edit: 'تحرير', prev: 'معاينة', dark: 'غامق', light: 'فاتح', done: 'تم', colour: 'لون الصفحة', auto: 'من الصورة', autoNo: 'تلقائي', pick: 'لون آخر', reset: 'رجوع للتلقائي', up: 'رفع صورة', chg: 'تغيير الصورة', rm: 'حذف الصورة', picNote: 'صورة بقياس 1280 × 720 (16:9). تظهر في صفحة التسجيل وفي بطاقة البطولة بالموقع، ومنها يُؤخذ لون الصفحة.', desc: 'وصف صفحة التسجيل (اختياري): القوانين، الجائزة، طريقة اللعب…', by: 'تنظيم', fixedSolo: 'معرّف بلاتو', fixedTeam: 'معرّفات اللاعبين', fixedNote: 'حقل ثابت يظهر دائمًا، والأسئلة تُضاف تحته.', qs: 'أسئلة إضافية', submit: 'تسجيل', demo: 'هذه معاينة فقط: لا يُرسل شي ولا يُسجَّل أحد.', editNote: 'أنت تحرر الصفحة. اللاعب يشوفها بدون أدوات التحرير.', prevNote: 'هكذا يشوفها اللاعب.', open: 'التسجيل مفتوح', noTitle: 'اسم البطولة' },
  en: { edit: 'Edit', prev: 'Preview', dark: 'Dark', light: 'Light', done: 'Done', colour: 'Page colour', auto: 'From picture', autoNo: 'Automatic', pick: 'Other colour', reset: 'Back to automatic', up: 'Upload picture', chg: 'Change picture', rm: 'Remove picture', picNote: 'A 1280 × 720 (16:9) picture. It shows on the registration page and on the tournament card on the site, and the page colour is taken from it.', desc: 'Registration page description (optional): rules, prize, how it is played…', by: 'By', fixedSolo: 'Plato ID', fixedTeam: 'Players’ IDs', fixedNote: 'A fixed field that always shows. Your questions are added under it.', qs: 'Extra questions', submit: 'Register', demo: 'Preview only: nothing is sent and nobody is registered.', editNote: 'You are editing the page. Players see it without the editing tools.', prevNote: 'This is what players see.', open: 'Registration is open', noTitle: 'Tournament name' },
};
const seg = (on: boolean) => `rf-seg${on ? ' on' : ''}`;
const field = 'w-full rounded-xl border bg-transparent px-4 py-3 text-[.95rem] outline-none';

export interface RegFormEditorProps {
  lang: 'ar' | 'en'; title: string; org: string; mode: 'solo' | 'team';
  cover: string; onCover: (f: File | null) => void;
  desc: string; onDesc: (v: string) => void;
  form: RegFormData; onForm: (f: RegFormData) => void;
  onClose: () => void; busy?: boolean;
  /** the description is edited somewhere else (site tournaments run by the admins): shown as it is, not editable here */
  hideDesc?: boolean;
}
export default function RegFormEditor({ lang, title, org, mode, cover, onCover, desc, onDesc, form, onForm, onClose, busy, hideDesc }: RegFormEditorProps) {
  const t = T[lang];
  const [view, setView] = useState<'edit' | 'prev'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [ans, setAns] = useState<Answers>({});
  const [demo, setDemo] = useState(false);
  const coverHue = useCoverHue(cover || undefined);
  const hue = form.hue ?? coverHue;
  const vars = { ...(hue === null ? plainVars(theme) : tintVars(hue, theme)), '--text': theme === 'dark' ? '#f4f7ff' : '#2b2160' } as React.CSSProperties;
  const editing = view === 'edit';
  const swatch = (h: number, on: boolean, label: string, onClick: () => void) => (
    <button key={label + h} type="button" aria-label={label} aria-pressed={on} onClick={onClick} className="rf-sw" style={{ background: `hsl(${h} 85% 52%)`, outline: on ? '2px solid var(--text-c, currentColor)' : 'none' }} />
  );
  return (
    <div className="rf" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="rf-bar">
        <div className="rf-segs" role="group">
          <button type="button" className={seg(editing)} aria-pressed={editing} onClick={() => setView('edit')}>{t.edit}</button>
          <button type="button" className={seg(!editing)} aria-pressed={!editing} onClick={() => { setView('prev'); setDemo(false); }}>{t.prev}</button>
        </div>
        <div className="rf-segs" role="group">
          <button type="button" className={seg(theme === 'dark')} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>{t.dark}</button>
          <button type="button" className={seg(theme === 'light')} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>{t.light}</button>
        </div>
        <button type="button" className="rf-done" disabled={busy} onClick={onClose}>{t.done}</button>
      </div>
      {editing && (
        <div className="rf-colour">
          <span className="rf-lbl">{t.colour}</span>
          <div className="flex flex-wrap items-center gap-2.5">
            {coverHue !== null && swatch(coverHue, form.hue === null, t.auto, () => onForm({ ...form, hue: null }))}
            {PRESET_HUES.map((h) => swatch(h, form.hue === h, `${h}`, () => onForm({ ...form, hue: h })))}
            <label className="rf-pick" title={t.pick}>
              <input type="color" aria-label={t.pick} value={hexOfHue(hue ?? 215)} onChange={(e) => { const h = hueOfHex(e.target.value); if (h !== null) onForm({ ...form, hue: h }); }} />
            </label>
            {form.hue !== null && <button type="button" className="rf-link" onClick={() => onForm({ ...form, hue: null })}>{t.reset}</button>}
          </div>
          {coverHue !== null && <small className="rf-note">{t.auto}: {form.hue === null ? '✓' : ''}</small>}
        </div>
      )}
      <p className="rf-note">{editing ? t.editNote : t.prevNote}</p>
      <div className="rf-pg" style={vars} data-rf={theme}>
        <div className="jn-card">
          {cover
            ? <img className="jn-cover" src={cover} alt="" draggable={false} />
            : editing ? <div className="jn-cover rf-emptycover">1280 × 720</div> : null}
          {editing && (
            <div className="rf-covbtns">
              <label className="rf-btn">{cover ? t.chg : t.up}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { onCover(e.target.files?.[0] ?? null); e.target.value = ''; }} /></label>
              {cover && <button type="button" className="rf-btn" style={{ color: '#ff6b7a' }} onClick={() => onCover(null)}>{t.rm}</button>}
              <small style={{ color: 'var(--muted)', flexBasis: '100%' }}>{t.picNote}</small>
            </div>
          )}
          <h1 className="text-[1.6rem] font-extrabold" dir="auto">{title.trim() || t.noTitle}</h1>
          {org.trim() && <p className="mt-1 font-semibold" style={{ color: 'var(--muted)' }}>{t.by}: <span dir="auto" style={{ color: 'var(--text)' }}>{org}</span></p>}
          <p className="jn-stat"><span className="jn-dot" /><span>{t.open}</span></p>
          {editing && !hideDesc
            ? <textarea dir="auto" className={`${field} mt-3 resize-y text-[.92rem]`} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)', minHeight: '5rem' }} maxLength={600} placeholder={t.desc} aria-label={t.desc} value={desc} onChange={(e) => onDesc(e.target.value)} />
            : desc.trim() ? <div className="mt-3 text-[.92rem] leading-relaxed" dir="auto" style={{ whiteSpace: 'pre-wrap' }}>{desc}</div> : null}
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{mode === 'team' ? t.fixedTeam : t.fixedSolo}
              <div className={field} style={{ borderColor: 'var(--glass-b)', color: 'var(--muted)', opacity: .75, fontWeight: 400 }} dir="ltr">&nbsp;</div>
              {editing && <small style={{ color: 'var(--muted)', fontWeight: 400 }}>{t.fixedNote}</small>}
            </div>
            {editing
              ? <><span className="rf-lbl">{t.qs}</span><QuestionsEditor qs={form.qs} onChange={(qs) => onForm({ ...form, qs })} lang={lang} /></>
              : <FormFields qs={form.qs} value={ans} onChange={setAns} />}
            {!editing && demo && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{t.demo}</p>}
            <button type="button" className="btn-primary self-start" onClick={() => setDemo(true)} style={{ cursor: editing ? 'default' : 'pointer' }}>{t.submit}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
