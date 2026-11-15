import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { hasName, renamePlayer, resolve, setScore, setWinner, type BMatch, type Bracket } from '../data/bracket';
import { useI18n } from '../i18n/I18nProvider';
import { CloseIcon } from './icons';

const T = {
  ar: { title: 'نتيجة المباراة', part: 'اللاعب', score: 'النقاط', win: 'الفائز', tie: 'النقاط متعادلة، حدّد الفائز يدوياً.', pick: 'حدّد الفائز.', save: 'حفظ النتيجة', clear: 'مسح النتيجة', close: 'إغلاق', dup: 'هذا الاسم مستخدم عند لاعب آخر.', plus: 'زيادة', minus: 'إنقاص' },
  en: { title: 'Match result', part: 'Participant', score: 'Score', win: 'Winner', tie: 'Scores are tied, pick the winner.', pick: 'Pick the winner.', save: 'Save result', clear: 'Clear result', close: 'Close', dup: 'This name is already used by another player.', plus: 'Increase', minus: 'Decrease' },
};

/** One match: names, scores and the winner in one place (opens from the edit icon on the match).
 *  The higher score becomes the winner by itself; on a tie the organiser picks the winner with the two buttons. */
export default function MatchCard({ bracket, match, canRename, onApply, onClose }: { bracket: Bracket; match: BMatch; canRename?: boolean; onApply: (b: Bracket) => void; onClose: () => void }) {
  const { lang } = useI18n();
  const t = T[lang === 'en' ? 'en' : 'ar'];
  const r = useMemo(() => resolve(bracket).get(match.id), [bracket, match.id]);
  const ia = typeof r?.a === 'number' ? r.a : -1, ib = typeof r?.b === 'number' ? r.b : -1;
  const [na, setNa] = useState(bracket.players[ia] ?? '');
  const [nb, setNb] = useState(bracket.players[ib] ?? '');
  const [sa, setSa] = useState(match.sa ?? '');
  const [sb, setSb] = useState(match.sb ?? '');
  const [win, setWin] = useState<'a' | 'b' | undefined>(match.win);
  const [err, setErr] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  if (ia < 0 || ib < 0) return null;

  const num = (v: string) => (v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  const scores = (a: string, b: string) => { const x = num(a), y = num(b); if (x !== null && y !== null && x !== y) setWin(x > y ? 'a' : 'b'); };
  const typeA = (v: string) => { v = v.slice(0, 4); setSa(v); scores(v, sb); };
  const typeB = (v: string) => { v = v.slice(0, 4); setSb(v); scores(sa, v); };
  const step = (v: string, d: number) => String(Math.max(0, (num(v) ?? 0) + d));
  const tied = num(sa) !== null && num(sa) === num(sb);
  const entered = sa.trim() !== '' || sb.trim() !== '';
  const canSave = !!win || (!entered && !match.win);
  const hint = tied && !win ? t.tie : entered && !win ? t.pick : '';

  function save() {
    let next = bracket;
    if (canRename) {
      for (const [i, v, old] of [[ia, na, bracket.players[ia]], [ib, nb, bracket.players[ib]]] as [number, string, string][]) {
        const name = v.trim().slice(0, 40);
        if (!name || name === old) continue;
        if (hasName(next, name, i)) { setErr(t.dup); return; }
        next = renamePlayer(next, i, name);
      }
    }
    next = setScore(next, match.id, sa.trim(), sb.trim());
    next = setWinner(next, match.id, win);
    onApply(next);
    onClose();
  }
  function clear() { onApply(setWinner(setScore(bracket, match.id, '', ''), match.id, undefined)); onClose(); }

  const sc = 'h-11 w-14 shrink-0 rounded-xl border bg-transparent text-center text-[1.05rem] font-bold outline-none focus:border-[#3d7bff]';
  const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
  const stepBtn = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl font-bold leading-none';
  const row = (name: string, setName: (v: string) => void, s: string, setS: (v: string) => void, typeS: (v: string) => void, side: 'a' | 'b') => (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2" key={side}>
      {canRename
        ? <input className="w-full min-w-0 rounded-xl border bg-transparent px-3 py-2.5 text-[.95rem] outline-none focus:border-[#3d7bff]" style={bd} dir="auto" maxLength={40} value={name} aria-label={t.part} onChange={(e) => { setName(e.target.value); setErr(''); }} />
        : <b dir="auto" className="min-w-0 flex-1 truncate px-1 text-[.95rem]">{name}</b>}
      <span className="flex items-center gap-1.5" dir="ltr">
        <button type="button" className={stepBtn} style={bd} aria-label={t.minus} onClick={() => { const v = step(s, -1); setS(v); scores(side === 'a' ? v : sa, side === 'b' ? v : sb); }}>−</button>
        <input className={sc} style={bd} inputMode="decimal" maxLength={4} value={s} aria-label={`${t.score} ${name}`} onChange={(e) => typeS(e.target.value)} />
        <button type="button" className={stepBtn} style={bd} aria-label={t.plus} onClick={() => { const v = step(s, 1); setS(v); scores(side === 'a' ? v : sa, side === 'b' ? v : sb); }}>+</button>
      </span>
    </div>
  );
  const wbtn = (side: 'a' | 'b', name: string) => (
    <button key={side} type="button" aria-pressed={win === side} className="min-w-0 flex-1 truncate px-3 py-3 text-[.92rem] font-extrabold" style={win === side ? { background: '#3d7bff', color: '#fff' } : { background: 'rgba(255,255,255,.06)' }} onClick={() => setWin(win === side ? undefined : side)}>{name || '—'}</button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={t.title} className="max-h-[92svh] w-full max-w-[30rem] overflow-y-auto rounded-t-3xl border p-5 sm:rounded-3xl" style={{ background: 'var(--dialog)', borderColor: 'var(--glass-b)', color: 'var(--text)' }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[1.15rem] font-extrabold">{t.title}</h3>
          <button type="button" onClick={onClose} aria-label={t.close} className="rounded-full border p-2" style={{ borderColor: 'var(--glass-b)' }}><CloseIcon className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3">
          {row(na, setNa, sa, setSa, typeA, 'a')}
          {row(nb, setNb, sb, setSb, typeB, 'b')}
        </div>
        <div className="mt-5 text-center text-[.9rem] font-bold" style={{ color: 'var(--muted)' }}>{t.win}</div>
        <div className="mt-2 flex overflow-hidden rounded-2xl border" style={bd} dir="ltr">{wbtn('a', na)}{wbtn('b', nb)}</div>
        <p role="status" className="mt-2 min-h-[1.4rem] text-center text-[.85rem]" style={{ color: err ? '#ff6b7a' : 'var(--muted)' }}>{err || hint}</p>
        <button type="button" className="btn-primary mt-2 w-full" disabled={!canSave} onClick={save}>{t.save}</button>
        {(match.win || match.sa || match.sb) && <button type="button" className="mt-2 w-full rounded-full border px-4 py-2.5 text-[.88rem] font-bold" style={{ borderColor: 'var(--glass-b)' }} onClick={clear}>{t.clear}</button>}
      </div>
    </div>,
    document.body,
  );
}
