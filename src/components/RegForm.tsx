import type { ReactNode } from 'react';

/** The organiser's own questions of a registration page: what a player fills in (FormFields) and the organiser's editor for them (QuestionsEditor). */
export type QKind = 'short' | 'para' | 'choice' | 'multi';
export interface FormQ { id: string; t: string; k: QKind; r: boolean; o: string[] }
export interface RegFormData { hue: number | null; qs: FormQ[]; /** the organiser's own wording of the fixed ID field (the field itself stays); empty = the default wording */ idl?: string }
export type Answers = Record<string, string | string[]>;
export const NO_FORM: RegFormData = { hue: null, qs: [] };
export const MAX_Q = 20;

export const newQ = (): FormQ => ({ id: Math.random().toString(36).slice(2, 8).padEnd(6, 'x'), t: '', k: 'short', r: false, o: [] });
/** a question the server will keep (a title, and two options for the choice kinds) */
export const qOk = (q: FormQ) => !!q.t.trim() && (q.k === 'short' || q.k === 'para' || q.o.map((o) => o.trim()).filter(Boolean).length >= 2);
/** id of the first required question that is still empty, or '' */
export function missingQ(qs: FormQ[], a: Answers): string {
  for (const q of qs) {
    if (!q.r || !qOk(q)) continue;
    const v = a[q.id];
    if (Array.isArray(v) ? v.length === 0 : !(typeof v === 'string' && v.trim())) return q.id;
  }
  return '';
}

const T = {
  ar: { short: 'إجابة قصيرة', para: 'فقرة', choice: 'اختيار واحد', multi: 'اختيار من متعدد', title: 'عنوان السؤال', req: 'مطلوب', del: 'حذف', up: 'أعلى', down: 'أسفل', addOpt: 'إضافة خيار', opt: 'خيار', add: 'إضافة سؤال', ans1: 'إجابة قصيرة', ansN: 'إجابة طويلة', hide: 'لن يظهر للاعبين: يحتاج عنوانًا', hideOpt: 'لن يظهر للاعبين: يحتاج خيارين على الأقل', max: 'وصلت الحد الأقصى للأسئلة.', rmOpt: 'حذف الخيار', kind: 'نوع السؤال' },
  en: { short: 'Short answer', para: 'Paragraph', choice: 'Single choice', multi: 'Multiple choice', title: 'Question title', req: 'Required', del: 'Delete', up: 'Up', down: 'Down', addOpt: 'Add option', opt: 'Option', add: 'Add question', ans1: 'Short answer', ansN: 'Long answer', hide: 'Players will not see it: it needs a title', hideOpt: 'Players will not see it: it needs at least two options', max: 'You reached the maximum number of questions.', rmOpt: 'Remove option', kind: 'Question type' },
};
const field = 'w-full rounded-xl border bg-transparent px-4 py-3 text-[.95rem] outline-none transition-colors focus:border-[var(--jn-ac,#3d7bff)]';
const fieldStyle = { borderColor: 'var(--glass-b)', color: 'var(--text)' };

/** What the player sees. `bad` = the question to mark (a required one left empty). */
export function FormFields({ qs, value, onChange, bad, readOnly }: { qs: FormQ[]; value: Answers; onChange: (a: Answers) => void; bad?: string; readOnly?: boolean }) {
  const set = (id: string, v: string | string[]) => onChange({ ...value, [id]: v });
  return (
    <>
      {qs.filter(qOk).map((q) => {
        const v = value[q.id];
        const mark = bad === q.id ? { borderColor: '#ff6b7a' } : {};
        const label: ReactNode = <span dir="auto">{q.t}{q.r && <b style={{ color: '#ff6b7a' }}> *</b>}</span>;
        if (q.k === 'short') return <label key={q.id} className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{label}<input dir="auto" className={field} style={{ ...fieldStyle, ...mark }} maxLength={200} value={typeof v === 'string' ? v : ''} onChange={(e) => set(q.id, e.target.value)} readOnly={readOnly} autoComplete="off" /></label>;
        if (q.k === 'para') return <label key={q.id} className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{label}<textarea dir="auto" rows={3} className={`${field} resize-y`} style={{ ...fieldStyle, ...mark }} maxLength={1000} value={typeof v === 'string' ? v : ''} onChange={(e) => set(q.id, e.target.value)} readOnly={readOnly} /></label>;
        const multi = q.k === 'multi', cur = Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];
        return (
          <fieldset key={q.id} className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0 text-[.9rem] font-semibold">
            <legend className="mb-1.5 p-0">{label}</legend>
            {q.o.filter((o) => o.trim()).map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 font-normal" style={{ ...fieldStyle, ...mark }}>
                <input type={multi ? 'checkbox' : 'radio'} name={`q-${q.id}`} style={{ accentColor: 'var(--jn-ac,#3d7bff)', width: 18, height: 18, flex: 'none' }} checked={cur.includes(o)}
                  onChange={() => set(q.id, multi ? (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]) : o)} />
                <span dir="auto">{o}</span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </>
  );
}

const btn = 'inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[.78rem] font-semibold';
/** The organiser's editor of the questions: type, title, options, required, order. */
export function QuestionsEditor({ qs, onChange, lang }: { qs: FormQ[]; onChange: (q: FormQ[]) => void; lang: 'ar' | 'en' }) {
  const t = T[lang];
  const upd = (i: number, p: Partial<FormQ>) => onChange(qs.map((q, n) => (n === i ? { ...q, ...p } : q)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= qs.length) return; const c = qs.slice(); [c[i], c[j]] = [c[j], c[i]]; onChange(c); };
  return (
    <div className="flex flex-col gap-3">
      {qs.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-2.5 rounded-2xl border p-3" style={{ borderColor: 'var(--glass-b)', background: 'color-mix(in srgb, var(--text) 4%, transparent)' }}>
          <div className="flex flex-wrap items-center gap-2">
            <input dir="auto" className={`${field} min-w-0 flex-1 !py-2`} style={fieldStyle} maxLength={120} placeholder={t.title} aria-label={t.title} value={q.t} onChange={(e) => upd(i, { t: e.target.value })} />
            <select aria-label={t.kind} className="h-10 rounded-xl border bg-transparent px-2 text-[.82rem]" style={fieldStyle} value={q.k}
              onChange={(e) => { const k = e.target.value as QKind; upd(i, { k, o: (k === 'choice' || k === 'multi') && q.o.length < 2 ? [`${t.opt} 1`, `${t.opt} 2`] : q.o }); }}>
              <option value="short">{t.short}</option><option value="para">{t.para}</option><option value="choice">{t.choice}</option><option value="multi">{t.multi}</option>
            </select>
          </div>
          {q.k === 'short' && <div className="rounded-xl border border-dashed px-4 py-2.5 text-[.85rem]" style={{ ...fieldStyle, color: 'var(--muted)', width: '70%' }}>{t.ans1}</div>}
          {q.k === 'para' && <div className="rounded-xl border border-dashed px-4 py-2.5 text-[.85rem]" style={{ ...fieldStyle, color: 'var(--muted)', minHeight: 56 }}>{t.ansN}</div>}
          {(q.k === 'choice' || q.k === 'multi') && (
            <div className="flex flex-col gap-2">
              {q.o.map((o, j) => (
                <div key={j} className="flex items-center gap-2">
                  <span aria-hidden className="flex-none border" style={{ width: 16, height: 16, borderRadius: q.k === 'multi' ? 4 : 99, borderColor: 'var(--muted)' }} />
                  <input dir="auto" className={`${field} min-w-0 flex-1 !py-1.5 !text-[.88rem]`} style={fieldStyle} maxLength={80} aria-label={t.opt} value={o} onChange={(e) => upd(i, { o: q.o.map((x, n) => (n === j ? e.target.value : x)) })} />
                  <button type="button" aria-label={t.rmOpt} className="h-8 w-8 flex-none rounded-lg border text-[1rem]" style={fieldStyle} onClick={() => upd(i, { o: q.o.filter((_, n) => n !== j) })}>×</button>
                </div>
              ))}
              {q.o.length < 20 && <button type="button" className="self-start text-[.85rem] font-semibold" style={{ color: 'var(--jn-ac,#3d7bff)' }} onClick={() => upd(i, { o: [...q.o, `${t.opt} ${q.o.length + 1}`] })}>+ {t.addOpt}</button>}
            </div>
          )}
          {!qOk(q) && <p className="text-[.8rem]" style={{ color: '#ffb02e' }}>{!q.t.trim() ? t.hide : t.hideOpt}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: 'var(--glass-b)' }}>
            <label className="flex cursor-pointer items-center gap-2 text-[.85rem]" style={{ color: 'var(--muted)' }}>
              <input type="checkbox" style={{ accentColor: 'var(--jn-ac,#3d7bff)', width: 16, height: 16 }} checked={q.r} onChange={(e) => upd(i, { r: e.target.checked })} />{t.req}
            </label>
            <span className="flex flex-wrap gap-1.5">
              <button type="button" className={btn} style={fieldStyle} disabled={i === 0} onClick={() => move(i, -1)}>▲ {t.up}</button>
              <button type="button" className={btn} style={fieldStyle} disabled={i === qs.length - 1} onClick={() => move(i, 1)}>▼ {t.down}</button>
              <button type="button" className={btn} style={{ borderColor: 'var(--glass-b)', color: '#ff6b7a' }} onClick={() => onChange(qs.filter((_, n) => n !== i))}>{t.del}</button>
            </span>
          </div>
        </div>
      ))}
      {qs.length < MAX_Q
        ? <button type="button" className="rounded-2xl border border-dashed px-3 py-3 text-[.9rem] font-semibold" style={{ borderColor: 'var(--jn-ac,#3d7bff)', color: 'var(--jn-ac,#3d7bff)' }} onClick={() => onChange([...qs, newQ()])}>+ {t.add}</button>
        : <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.max}</p>}
    </div>
  );
}
