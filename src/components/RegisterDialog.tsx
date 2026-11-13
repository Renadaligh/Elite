import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Tournament } from '../data/tournaments';
import { useI18n } from '../i18n/I18nProvider';
import { CloseIcon } from './icons';

type State = 'idle' | 'sending' | 'done' | 'error' | 'dup' | 'dupTeam' | 'required';
const MAX = { id: 80, name: 80, members: 600 };

const field = 'w-full rounded-xl border bg-transparent px-4 py-3 text-[.95rem] outline-none transition-colors focus:border-[var(--link-on)]';
const fieldStyle = { borderColor: 'var(--glass-b)', color: 'var(--text)' };

/** In-site registration form. Solo → one Plato ID; team → team name + captain + members. Posts to /api/registrations. */
export default function RegisterDialog({ x, onClose }: { x: Tournament; onClose: () => void }) {
  const { t, lang } = useI18n();
  const team = x.mode === 'team';
  const [state, setState] = useState<State>('idle');
  const [platoId, setPlatoId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState('');
  const [hp, setHp] = useState(''); // honeypot: real users never fill it
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
    const id = platoId.trim();
    if (!id || (team && (!teamName.trim() || !members.trim()))) { setState('required'); return; }
    setState('sending');
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tournamentId: x.id, tournamentName: x.name.en, mode: team ? 'team' : 'solo', platoId: id, teamName: teamName.trim(), members: members.trim(), lang, hp }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      setState(data.ok ? 'done' : data.error === 'duplicate' ? 'dup' : data.error === 'duplicate_team' ? 'dupTeam' : 'error');
    } catch {
      setState('error');
    }
  }

  const msg = state === 'required' ? t.regRequired : state === 'dup' ? t.regDup : state === 'dupTeam' ? t.regDupTeam : state === 'error' ? t.regErr : '';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="reg-title" className="max-h-[92svh] w-full max-w-[30rem] overflow-y-auto rounded-t-3xl border p-6 sm:rounded-3xl" style={{ background: 'var(--dialog)', borderColor: 'var(--glass-b)' }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 id="reg-title" className="text-[1.3rem] font-extrabold">{t.regTitle}</h3>
            <p className="mt-1 text-[.9rem]" style={{ color: 'var(--muted)' }}>{t.regFor}: <b style={{ color: 'var(--text)' }}>{x.name[lang]}</b></p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.regClose} className="rounded-full border p-2" style={{ borderColor: 'var(--glass-b)' }}><CloseIcon className="h-4 w-4" /></button>
        </div>

        {state === 'done' ? (
          <div className="py-8 text-center" role="status">
            <p className="text-[1.5rem] font-extrabold">{t.regDone}</p>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>{t.regDoneSub}</p>
            <button type="button" className="btn-glass mt-6 !px-6 !py-2.5" onClick={onClose}>{t.regClose}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {team && (
              <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{t.regTeamName}
                <input ref={first} className={field} style={fieldStyle} value={teamName} maxLength={MAX.name} onChange={(e) => setTeamName(e.target.value)} autoComplete="off" />
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{team ? t.regCaptain : t.regPlatoId}
              {team && <span className="text-[.8rem] font-normal" style={{ color: 'var(--muted)' }}>{t.regCaptainNote}</span>}
              <input ref={team ? undefined : first} dir="ltr" className={field} style={fieldStyle} value={platoId} maxLength={MAX.id} onChange={(e) => setPlatoId(e.target.value)} autoComplete="off" />
            </label>
            {team && (
              <label className="flex flex-col gap-1.5 text-[.9rem] font-semibold">{t.regMembers}
                <span className="text-[.8rem] font-normal" style={{ color: 'var(--muted)' }}>{t.regMembersNote}</span>
                <textarea dir="ltr" rows={4} className={field} style={fieldStyle} value={members} maxLength={MAX.members} onChange={(e) => setMembers(e.target.value)} />
              </label>
            )}
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: 'absolute', insetInlineStart: '-9999px', width: 1, height: 1, opacity: 0 }} />
            {msg && <p role="alert" className="text-[.9rem]" style={{ color: '#ff6b7a' }}>{msg}</p>}
            <button type="submit" className="btn-primary self-start" disabled={state === 'sending'}>{state === 'sending' ? t.regSending : t.regSubmit}</button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
