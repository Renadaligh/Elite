import { linkify } from './linkify';
import { ChipInput } from './ChipInput';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Tournament } from '../data/tournaments';
import { useI18n } from '../i18n/I18nProvider';
import { CloseIcon } from './icons';
import { FormFields, NO_FORM, missingQ, type Answers, type RegFormData } from './RegForm';

type State = 'idle' | 'sending' | 'done' | 'error' | 'dup' | 'dupTeam' | 'dupMembers' | 'required' | 'badId' | 'requiredQ';
const key = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const okId = (s: string) => /^[A-Za-z0-9_]+$/.test(s);
const okIds = (l: string) => l.split(/[\n,،;]+/).map((v) => v.trim()).filter(Boolean).every(okId);
const MAX = { id: 80, name: 80, members: 600 };

const field = 'w-full rounded-xl border bg-transparent px-4 py-3 text-[.95rem] outline-none transition-colors focus:border-[var(--link-on)]';
const fieldStyle = { borderColor: 'var(--glass-b)', color: 'var(--text)' };

/** In-site registration form. Solo → one Plato ID; team → team name + captain + members. Posts to /api/registrations. */
export default function RegisterDialog({ x, onClose }: { x: Tournament; onClose: () => void }) {
  const { t, lang } = useI18n();
  const team = x.mode === 'team';
  const [state, setState] = useState<State>('idle');
  const [platoId, setPlatoId] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [hp, setHp] = useState(''); // honeypot: real users never fill it
  const [form, setForm] = useState<RegFormData>(NO_FORM); // the organiser's own questions, when there are any
  const [answers, setAnswers] = useState<Answers>({});
  const [badQ, setBadQ] = useState('');
  useEffect(() => {
    let live = true;
    fetch(`/api/tournaments/${encodeURIComponent(x.id)}/form`).then(async (r) => (r.ok ? ((await r.json()) as RegFormData) : NO_FORM)).then((f) => { if (live && f && Array.isArray(f.qs)) setForm(f); }).catch(() => undefined);
    return () => { live = false; };
  }, [x.id]);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    const id = team ? (ids[0] ?? '') : platoId.trim();
    const members = team ? ids.slice(1).join(', ') : '';
    if (!id || (team && !members.trim())) { setState('required'); return; }
    const miss = missingQ(form.qs, answers);
    if (miss) { setBadQ(miss); setState('requiredQ'); return; }
    setBadQ('');
    if (!okId(id) || (team && !okIds(members))) { setState('badId'); return; }
    if (team) { const all = [id, ...members.split(/[\n,،;]+/)].map(key).filter(Boolean); if (new Set(all).size !== all.length) { setState('dupMembers'); return; } }
    setState('sending');
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tournamentId: x.id, tournamentName: x.name.en, mode: team ? 'team' : 'solo', platoId: id, teamName: '', members: members.trim(), lang, hp, answers }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      setState(data.ok ? 'done' : data.error === 'duplicate' ? 'dup' : data.error === 'duplicate_team' ? 'dupTeam' : data.error === 'duplicate_members' ? 'dupMembers' : data.error === 'bad_id' ? 'badId' : data.error === 'required_q' ? 'requiredQ' : 'error');
    } catch {
      setState('error');
    }
  }

  const msg = state === 'requiredQ' ? (lang === 'ar' ? 'عبّئ الأسئلة المطلوبة.' : 'Fill in the required questions.') : state === 'required' ? t.regRequired : state === 'badId' ? t.regBadId : state === 'dup' ? t.regDup : state === 'dupTeam' ? t.regDupTeam : state === 'dupMembers' ? t.regDupMembers : state === 'error' ? t.regErr : '';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="reg-title" className="relative max-h-[88svh] w-full max-w-[30rem] overflow-y-auto rounded-3xl border p-6" style={{ background: 'var(--dialog)', borderColor: 'var(--glass-b)', ...(form.hue === null ? {} : { '--jn-ac': `hsl(${form.hue} 85% 52%)`, '--link-on': `hsl(${form.hue} 85% 60%)` } as React.CSSProperties) }}>
        {x.image && <img src={x.image} alt="" draggable={false} style={{ display: 'block', width: 'calc(100% + 3rem)', maxWidth: 'none', margin: '-1.5rem -1.5rem 1.25rem', aspectRatio: '16 / 9', objectFit: 'cover', objectPosition: x.imagePos || undefined, borderRadius: '1.5rem 1.5rem 0 0', background: 'var(--chip-bg)' }} />}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 id="reg-title" className="text-[1.3rem] font-extrabold">{t.regTitle}</h3>
            <p className="mt-1 text-[.9rem]" style={{ color: 'var(--muted)' }}>{t.regFor}: <b style={{ color: 'var(--text)' }}>{x.name[lang]}</b></p>
            {x.description?.[lang] && state !== 'done' && <p dir="auto" className="mt-3 whitespace-pre-line text-[.92rem] leading-relaxed [overflow-wrap:anywhere]" style={{ color: 'var(--text)' }}>{x.description[lang]}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={t.regClose} className={x.image ? 'absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-white backdrop-blur' : 'rounded-full border p-2'} style={x.image ? { background: 'rgba(8,10,30,.62)', border: '1px solid rgba(255,255,255,.35)', boxShadow: '0 2px 10px rgba(0,0,0,.4)' } : { borderColor: 'var(--glass-b)' }}><CloseIcon className={x.image ? 'h-5 w-5' : 'h-4 w-4'} /></button>
        </div>

        {state === 'done' ? (
          <div className="py-8 text-center" role="status">
            {x.doneMsg?.[lang] ? (
              <div className="text-[1.05rem] font-semibold leading-relaxed">{x.doneMsg[lang].split(/\r?\n/).map((ln, i) => (ln.trim() ? <p key={i} dir="auto" style={{ unicodeBidi: 'plaintext', textAlign: 'center' }}>{linkify(ln)}</p> : <div key={i} className="h-2" />))}</div>
            ) : (
              <>
                <p className="text-[1.5rem] font-extrabold">{t.regDone}</p>
                <p className="mt-2" style={{ color: 'var(--muted)' }}>{t.regDoneSub}</p>
              </>
            )}
            <button type="button" className="btn-glass mt-6 !px-6 !py-2.5" onClick={onClose}>{t.regClose}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {!team && (
              <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{(form?.idl?.trim() || t.regPlatoId)} <span style={{ color: '#ff6b7a' }}>*</span>
                <input ref={first} dir="ltr" className={field} style={fieldStyle} value={platoId} maxLength={MAX.id} onChange={(e) => setPlatoId(e.target.value)} autoComplete="off" />
              </label>
            )}
            {team && (
              <div className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{(form?.idl?.trim() || t.regTeamIds)} <span style={{ color: '#ff6b7a' }}>*</span>
                <ChipInput inputRef={first} dir="ltr" className={`${field} focus-within:border-[var(--link-on)]`} style={fieldStyle} value={ids} onChange={setIds} maxLen={40} maxChips={20} placeholder={t.regIdsPh} ariaLabel={t.regTeamIds} bad={(c) => !okId(c)} />
              </div>
            )}
            <FormFields qs={form.qs} value={answers} onChange={(a) => { setAnswers(a); setBadQ(''); }} bad={badQ} />
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: 'absolute', insetInlineStart: '-9999px', width: 1, height: 1, opacity: 0 }} />
            {msg && <p role="alert" className="text-[.9rem]" style={{ color: '#ff6b7a' }}>{msg}</p>}
            <button type="submit" className="btn-primary self-start" style={form.hue === null ? undefined : { background: 'var(--jn-ac)', boxShadow: '0 10px 28px color-mix(in srgb, var(--jn-ac) 50%, transparent)' }} disabled={state === 'sending'}>{state === 'sending' ? t.regSending : t.regSubmit}</button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
