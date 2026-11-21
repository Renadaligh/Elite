import { useRef, useState } from 'react';
import { readNames, splitNames } from '../data/importNames';
import { nameKey } from '../data/bracket';
import { ChipInput } from './ChipInput';

/** Add players to a bracket without rebuilding it: type a name, or press + next to someone who registered. */
const T = {
  ar: { autoLbl: 'إضافة المسجّلين للشجرة تلقائيًا', autoOffNote: 'الإضافة يدوية: اضغط + بجانب الاسم ليدخل الشجرة (أو «إضافة الكل»).', outAll: 'إخراج الكل من الشجرة', outAllAsk: 'إخراج كل اللاعبين من الشجرة؟ يبقون في القائمة وترجّعهم بـ «إضافة الكل».', manual: 'يدوي', delManualAsk: 'حذف هذا اللاعب من القرعة؟', search: 'ابحث عن اسم…', az: 'ترتيب أبجدي', noMatch: 'لا يوجد اسم مطابق.', ph: 'اكتب الاسم واضغط مسافة', add: 'إضافة', autoNote: 'المسجّلون يُضافون إلى القرعة مباشرة. زر − يُخرج اللاعب من القرعة ويبقى تسجيله، وزر × يحذف التسجيل ويُخرجه من القرعة.', regs: 'المسجّلون', none: 'لم يسجّل أحد حتى الآن.', all: 'إضافة الكل', added: 'مضاف', unadd: 'إزالة من القرعة (التسجيل يبقى)', del: 'حذف', delAsk: 'حذف هذا التسجيل وإزالة اللاعب من القرعة؟ (مثلاً إذا انسحب)', refresh: 'تحديث', captain: 'القائد', m1: 'اسم ثم مسافة', m2: 'لصق قائمة', m3: 'من ملف Excel', pastePh: 'اكتب أو الصق الأسماء، اسم في كل سطر', addList: 'إضافة القائمة', pickFile: 'اختر ملف Excel أو CSV', fileHint: 'يقرأ أول عمود فيه أسماء (xlsx أو csv أو txt). صف العنوان يُتجاهل.', fileBad: 'تعذّرت قراءة الملف، جرّب xlsx أو csv.', fileNone: 'لم يتم العثور على أسماء في الملف.', n: 'اسم', draftTitle: 'لم تبدأ القرعة بعد', draftBody: 'أضف لاعبَين على الأقل وتُبنى القرعة تلقائياً.', remove: 'حذف', dup1: 'هذا الاسم مضاف مسبقاً.', skip: (n: number) => `تم تجاهل ${n} اسم مكرر.` },
  en: { autoLbl: 'Add registrants to the bracket automatically', autoOffNote: 'Manual mode: press + next to a name to put it in the bracket (or “Add all”).', outAll: 'Take everyone out of the bracket', outAllAsk: 'Take all players out of the bracket? They stay in the list and “Add all” brings them back.', manual: 'Manual', delManualAsk: 'Remove this player from the bracket?', search: 'Search a name…', az: 'A–Z order', noMatch: 'No matching name.', ph: 'Type a name, press space', add: 'Add', autoNote: 'Registrants are added to the bracket automatically. − takes a player out of the bracket and keeps the registration; × deletes the registration and removes the player from the bracket.', regs: 'Registered', none: 'Nobody registered yet.', all: 'Add all', added: 'Added', unadd: 'Remove from the bracket (the registration stays)', del: 'Delete', delAsk: 'Delete this registration and remove the player from the bracket? (e.g. the player withdrew)', refresh: 'Refresh', captain: 'Captain', m1: 'Name, then space', m2: 'Paste a list', m3: 'From Excel file', pastePh: 'Type or paste names, one per line', addList: 'Add the list', pickFile: 'Choose an Excel or CSV file', fileHint: 'Reads the first column that has names (xlsx, csv or txt). A header row is ignored.', fileBad: 'Could not read the file, try xlsx or csv.', fileNone: 'No names found in the file.', n: 'names', draftTitle: 'The bracket has not started', draftBody: 'Add at least two players and it is drawn automatically.', remove: 'Remove', dup1: 'This name is already in the list.', skip: (n: number) => `${n} duplicate name${n > 1 ? 's' : ''} skipped.` },
};
export const addTxt = (lang: 'ar' | 'en') => T[lang];

export interface RegRow { id: number; mode: string; plato_id: string; team_name: string; members: string; src?: 'join' | 'site' | 'manual'; created_at?: string }
export const regName = (r: RegRow) => (r.mode === 'team' ? r.team_name : r.plato_id).trim();

/**
 * Registrants go straight into the bracket (the organiser does not approve them: deleting one, or taking a player out of the bracket, is their decision).
 * Only registrations newer than the last SAVED bracket are added, so a player the organiser removed does not come back. The mark is committed when the bracket is saved.
 */
const pendingMarks = new Map<string, number>();
const markKey = (bracketId: string, src: string) => `elite-auto:${bracketId}:${src}`;
export function autoAddNew(bracketId: string, src: string, rows: RegRow[], players: string[], onAdd: (names: string[]) => void) {
  const key = markKey(bracketId, src);
  let mark = -1; try { const v = localStorage.getItem(key); if (v !== null && Number.isFinite(Number(v))) mark = Number(v); } catch { /* private mode */ }
  mark = Math.max(mark, pendingMarks.get(key) ?? -1);
  const fresh = rows.filter((r) => r.id > mark);
  if (!fresh.length) return;
  pendingMarks.set(key, Math.max(...rows.map((r) => r.id)));
  const have = new Set(players.map(nameKey));
  const names = fresh.map(regName).filter((n, i, a) => n && !have.has(nameKey(n)) && a.findIndex((x) => nameKey(x) === nameKey(n)) === i);
  if (names.length) onAdd(names);
}
/** Called after the bracket was saved: the auto-added registrants are now part of it for good. */
export function commitAutoAdds(bracketId: string) {
  for (const [k, v] of [...pendingMarks]) if (k.startsWith(`elite-auto:${bracketId}:`)) { try { localStorage.setItem(k, String(v)); } catch { /* private mode */ } pendingMarks.delete(k); }
}

const line = 'rounded-xl border bg-transparent px-3 py-2 text-[.9rem] outline-none focus:border-[#3d7bff]';
const btn = 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg font-bold leading-none';

export function AddPlayerBar({ lang, onAdd, existing = [] }: { lang: 'ar' | 'en'; onAdd: (names: string[]) => void; existing?: string[] }) {
  const t = T[lang];
  /** Drops names already in the bracket (and repeats inside the batch); returns how many were skipped. */
  const fresh = (names: string[]) => { const have = new Set(existing.map(nameKey)); const out: string[] = []; for (const n of names) { const k = nameKey(n); if (k && !have.has(k)) { have.add(k); out.push(n); } } return { out, skipped: names.length - out.length }; };
  const [mode, setMode] = useState<'one' | 'list' | 'file'>('one');
  const [chips, setChips] = useState<string[]>([]);
  const [txt, setTxt] = useState('');
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const go = () => { if (!chips.length) return; const f = fresh(chips); if (!f.out.length) { setMsg(t.dup1); setChips([]); return; } onAdd(f.out); setChips([]); setMsg(f.skipped ? `+${f.out.length} · ${t.skip(f.skipped)}` : ''); };
  const addList = () => { const f = fresh(splitNames(txt)); if (!f.out.length) { if (f.skipped) setMsg(t.dup1); return; } onAdd(f.out); setTxt(''); setMsg(`+${f.out.length}${f.skipped ? ` · ${t.skip(f.skipped)}` : ''}`); };
  const pick = async (f?: File) => {
    if (!f) return;
    try { const names = await readNames(f); if (!names.length) { setMsg(t.fileNone); } else { const f = fresh(names); if (!f.out.length) setMsg(t.dup1); else { onAdd(f.out); setMsg(`+${f.out.length}${f.skipped ? ` · ${t.skip(f.skipped)}` : ''}`); } } } catch { setMsg(t.fileBad); }
    if (file.current) file.current.value = '';
  };
  const tab = (k: typeof mode, label: string) => <button key={k} type="button" className={`br-chip ${mode === k ? 'on' : ''}`} onClick={() => { setMode(k); setMsg(''); }}>{label}</button>;
  const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
  return (
    <div className="grid gap-2.5">
      <div className="br-chips">{tab('one', t.m1)}{tab('list', t.m2)}{tab('file', t.m3)}</div>
      {mode === 'one' && (
        <div className="flex min-w-0 items-start gap-2">
          <ChipInput className={`${line} min-w-0 flex-1 focus-within:border-[#3d7bff]`} style={bd} value={chips} onChange={setChips} placeholder={t.ph} ariaLabel={t.ph} onEnterEmpty={go} />
          <button type="button" className={btn} style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)', color: 'var(--text)', width: 'auto', paddingInline: 14 }} disabled={!chips.length} onClick={go}>{t.add}{chips.length ? ` (${chips.length})` : ''}</button>
        </div>
      )}
      {mode === 'list' && (
        <div className="grid gap-2">
          <textarea className={`${line} min-h-[110px] w-full resize-y`} style={bd} dir="auto" placeholder={t.pastePh} value={txt} onChange={(e) => setTxt(e.target.value)} />
          <button type="button" className="justify-self-start rounded-full border px-4 py-2 text-[.85rem] font-bold" style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)', color: 'var(--text)' }} disabled={!splitNames(txt).length} onClick={addList}>{t.addList}{splitNames(txt).length ? ` (${splitNames(txt).length})` : ''}</button>
        </div>
      )}
      {mode === 'file' && (
        <div className="grid gap-2">
          <input ref={file} type="file" hidden accept=".xlsx,.csv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => void pick(e.target.files?.[0])} />
          <button type="button" className="justify-self-start rounded-full border px-4 py-2 text-[.85rem] font-bold" style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)', color: 'var(--text)' }} onClick={() => file.current?.click()}>{t.pickFile}</button>
          <p className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{t.fileHint}</p>
        </div>
      )}
      {msg && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }} role="status">{msg}</span>}
    </div>
  );
}

/** Sign-up time (stored as UTC "YYYY-MM-DD HH:MM:SS") shown in the viewer's own time: date and time, 12-hour. */
const regTime = (iso: string, lang: 'ar' | 'en') => {
  const d = new Date(`${iso.replace(' ', 'T')}${/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? '' : 'Z'}`);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 16) : d.toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
};
export function RegistrantsPanel({ lang, regs, players, onAdd, onRefresh, onDelete, onUnadd, onUnaddAll, bench = [], autoOn = true, onAuto }: { lang: 'ar' | 'en'; regs: RegRow[]; players: string[]; onAdd: (names: string[]) => void; onRefresh?: () => void; onDelete?: (r: RegRow) => void; onUnadd?: (name: string, keep?: boolean) => void; onUnaddAll?: (keep: string[]) => void; bench?: string[]; autoOn?: boolean; onAuto?: (on: boolean) => void }) {
  const t = T[lang];
  const [q, setQ] = useState('');
  const [az, setAz] = useState(false);
  const have = new Set(players.map(nameKey));
  const todo = regs.map(regName).filter((n, i, a) => n && !have.has(nameKey(n)) && a.findIndex((x) => nameKey(x) === nameKey(n)) === i);
  // players typed in by hand (not from a registration) sit in the same list, so everybody is in one place
  const isReg = (n: string) => regs.some((r) => nameKey(regName(r)) === nameKey(n));
  const manualIn = players.filter((p) => !isReg(p));
  const manualOut = bench.filter((b) => !have.has(nameKey(b)) && !isReg(b));
  const manual: RegRow[] = onUnadd ? [...manualIn, ...manualOut].map((p, i) => ({ id: -(i + 1), mode: 'solo', plato_id: p, team_name: '', members: '', src: 'manual' as const })) : [];
  const todoAll = [...todo, ...manualOut];
  const all = [...regs, ...manual];
  const needle = nameKey(q);
  const shown = all.filter((r) => !needle || nameKey(regName(r)).includes(needle) || nameKey(r.team_name ?? '').includes(needle)).sort((a, b) => (az ? regName(a).localeCompare(regName(b), lang, { sensitivity: 'base', numeric: true }) : 0));
  return (
    <div className="grid gap-2.5 rounded-xl border p-3.5" style={{ borderColor: 'var(--glass-b)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b className="text-[.92rem]">{t.regs} · {all.length}</b>
        <span className="flex gap-2">
          {onRefresh && <button type="button" className="rounded-full border px-3 py-1 text-[.8rem] font-bold" style={{ borderColor: 'var(--glass-b)' }} onClick={onRefresh}>{t.refresh}</button>}
          {todoAll.length > 0 && <button type="button" className="rounded-full border px-3 py-1 text-[.8rem] font-bold" style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)' }} onClick={() => onAdd(todoAll)}>{t.all} ({todoAll.length})</button>}
          {onUnaddAll && players.length > 0 && <button type="button" className="rounded-full border px-3 py-1 text-[.8rem] font-bold" style={{ borderColor: 'rgba(255,176,46,.55)', background: 'rgba(255,176,46,.14)' }} onClick={() => { if (window.confirm(t.outAllAsk)) onUnaddAll(manualIn); }}>{t.outAll}</button>}
        </span>
      </div>
      {onAuto && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[.85rem] font-semibold">{t.autoLbl}</span>
          <button type="button" role="switch" aria-checked={autoOn} aria-label={t.autoLbl} className={`st-sw ${autoOn ? 'on' : ''}`} onClick={() => onAuto(!autoOn)}><i /></button>
        </div>
      )}
      {onAuto ? <p className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{autoOn ? t.autoNote : t.autoOffNote}</p> : onDelete && regs.length > 0 && <p className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{t.autoNote}</p>}
      {all.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} className="min-w-0 flex-1 rounded-xl border bg-transparent px-3 py-1.5 text-[.85rem] outline-none focus:border-[#3d7bff]" style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} />
          <button type="button" aria-pressed={az} className="rounded-full border px-3 py-1 text-[.8rem] font-bold" style={{ borderColor: az ? 'rgba(143,178,255,.55)' : 'var(--glass-b)', background: az ? 'rgba(61,123,255,.2)' : 'transparent' }} onClick={() => setAz((v) => !v)}>{t.az}</button>
        </div>
      )}
      {all.length === 0 ? <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.none}</p> : shown.length === 0 ? <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.noMatch}</p> : (
        <ul className="grid gap-1.5">
          {shown.map((r, i) => {
            const n = regName(r), done = have.has(nameKey(n));
            return (
              <li key={`${r.src ?? ''}-${r.id}`} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-[.88rem]" style={{ borderColor: 'var(--glass-b)', opacity: done && !onUnadd ? 0.6 : 1 }}>
                <div className="min-w-0"><b dir="auto">{done && onUnadd && <span style={{ color: '#2ecc8c' }}>✓ </span>}{i + 1}. {n}</b>{r.created_at && <small dir="ltr" className="ms-2 text-[.74rem] font-normal" style={{ color: 'var(--muted)' }}>{regTime(r.created_at, lang)}</small>}{r.src === 'manual' && <span className="ms-2 rounded-full px-2 py-0.5 text-[.7rem] font-bold" style={{ background: 'var(--tc-pill, rgba(255,255,255,.1))', color: 'var(--muted)' }}>{t.manual}</span>}{r.mode === 'team' && <div dir="auto" className="truncate" style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{t.captain}: {r.plato_id}{r.members ? ` · ${r.members.replace(/\n/g, '، ')}` : ''}</div>}</div>
                <div className="flex shrink-0 items-center gap-2">
                  {done ? (onUnadd
                    ? <button type="button" className={btn} style={{ borderColor: 'rgba(255,176,46,.55)', background: 'rgba(255,176,46,.14)', color: 'var(--text)' }} aria-label={t.unadd} title={t.unadd} onClick={() => onUnadd(n, r.src === 'manual')}>−</button>
                    : <span className="text-[.78rem] font-bold" style={{ color: '#2ecc8c' }}>✓ {t.added}</span>)
                    : <button type="button" className={btn} style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)', color: 'var(--text)' }} aria-label={t.add} title={t.add} onClick={() => onAdd([n])}>+</button>}
                  {(onDelete || r.src === 'manual') && <button type="button" className={btn} style={{ borderColor: 'rgba(255,120,120,.5)', background: 'rgba(255,90,90,.14)', color: 'var(--text)' }} aria-label={t.del} title={t.del} onClick={() => { if (r.src === 'manual') { if (window.confirm(t.delManualAsk)) onUnadd?.(n, false); } else if (window.confirm(t.delAsk)) { onDelete?.(r); if (done) onUnadd?.(n); } }}>×</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DraftBox({ lang, players, onRemove }: { lang: 'ar' | 'en'; players: string[]; onRemove?: (i: number) => void }) {
  const t = T[lang];
  return (
    <div className="grid gap-2 rounded-xl border border-dashed p-4" style={{ borderColor: 'var(--glass-b)' }}>
      <b>{t.draftTitle}</b>
      <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.draftBody}</p>
      {players.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {players.map((p, i) => <li key={`${p}-${i}`} dir="auto" className="rounded-full px-2.5 py-1 text-[.82rem]" style={{ background: 'var(--tc-pill, rgba(255,255,255,.08))' }}>{p}{onRemove && <button type="button" aria-label={t.remove} className="ms-1.5 opacity-70" onClick={() => onRemove(i)}>×</button>}</li>)}
        </ul>
      )}
    </div>
  );
}
