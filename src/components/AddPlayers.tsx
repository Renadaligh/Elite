import { useRef, useState } from 'react';
import { readNames, splitNames } from '../data/importNames';

/** Add players to a bracket without rebuilding it: type a name, or press + next to someone who registered. */
const T = {
  ar: { ph: 'أضف لاعب (اكتب الاسم واضغط +)', add: 'إضافة', regs: 'المسجّلون', none: 'ما سجّل أحد للحين.', all: 'إضافة الكل', added: 'مضاف', refresh: 'تحديث', captain: 'القائد', m1: 'اسم ثم +', m2: 'لصق قائمة', m3: 'من ملف Excel', pastePh: 'اكتب أو الصق الأسماء، اسم في كل سطر', addList: 'إضافة القائمة', pickFile: 'اختر ملف Excel أو CSV', fileHint: 'يقرأ أول عمود فيه أسماء (xlsx أو csv أو txt). صف العنوان يُتجاهل.', fileBad: 'تعذّرت قراءة الملف، جرّب xlsx أو csv.', fileNone: 'ما لقيت أسماء في الملف.', n: 'اسم', draftTitle: 'ما بدأ البراكت بعد', draftBody: 'أضف لاعبَين على الأقل ويُبنى البراكت تلقائياً.', remove: 'حذف' },
  en: { ph: 'Add a player (type a name, press +)', add: 'Add', regs: 'Registered', none: 'Nobody registered yet.', all: 'Add all', added: 'Added', refresh: 'Refresh', captain: 'Captain', m1: 'Name + +', m2: 'Paste a list', m3: 'From Excel file', pastePh: 'Type or paste names, one per line', addList: 'Add the list', pickFile: 'Choose an Excel or CSV file', fileHint: 'Reads the first column that has names (xlsx, csv or txt). A header row is ignored.', fileBad: 'Could not read the file, try xlsx or csv.', fileNone: 'No names found in the file.', n: 'names', draftTitle: 'The bracket has not started', draftBody: 'Add at least two players and it is drawn automatically.', remove: 'Remove' },
};
export const addTxt = (lang: 'ar' | 'en') => T[lang];

export interface RegRow { id: number; mode: string; plato_id: string; team_name: string; members: string }
export const regName = (r: RegRow) => (r.mode === 'team' ? r.team_name : r.plato_id).trim();

const line = 'rounded-xl border bg-transparent px-3 py-2 text-[.9rem] outline-none focus:border-[#3d7bff]';
const btn = 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg font-bold leading-none';

export function AddPlayerBar({ lang, onAdd }: { lang: 'ar' | 'en'; onAdd: (names: string[]) => void }) {
  const t = T[lang];
  const [mode, setMode] = useState<'one' | 'list' | 'file'>('one');
  const [v, setV] = useState('');
  const [txt, setTxt] = useState('');
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const go = () => { const n = v.trim().slice(0, 40); if (n) { onAdd([n]); setV(''); } };
  const addList = () => { const names = splitNames(txt); if (names.length) { onAdd(names); setTxt(''); setMsg(`+${names.length}`); } };
  const pick = async (f?: File) => {
    if (!f) return;
    try { const names = await readNames(f); if (!names.length) { setMsg(t.fileNone); } else { onAdd(names); setMsg(`+${names.length}`); } } catch { setMsg(t.fileBad); }
    if (file.current) file.current.value = '';
  };
  const tab = (k: typeof mode, label: string) => <button key={k} type="button" className={`br-chip ${mode === k ? 'on' : ''}`} onClick={() => { setMode(k); setMsg(''); }}>{label}</button>;
  const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
  return (
    <div className="grid gap-2.5">
      <div className="br-chips">{tab('one', t.m1)}{tab('list', t.m2)}{tab('file', t.m3)}</div>
      {mode === 'one' && (
        <div className="flex items-center gap-2">
          <input className={`${line} min-w-0 flex-1`} style={bd} dir="auto" maxLength={40} placeholder={t.ph} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }} />
          <button type="button" className={btn} style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)', color: 'var(--text)' }} aria-label={t.add} title={t.add} disabled={!v.trim()} onClick={go}>+</button>
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

export function RegistrantsPanel({ lang, regs, players, onAdd, onRefresh }: { lang: 'ar' | 'en'; regs: RegRow[]; players: string[]; onAdd: (names: string[]) => void; onRefresh?: () => void }) {
  const t = T[lang];
  const have = new Set(players.map((p) => p.trim().toLowerCase()));
  const todo = regs.map(regName).filter((n) => n && !have.has(n.toLowerCase()));
  return (
    <div className="grid gap-2.5 rounded-xl border p-3.5" style={{ borderColor: 'var(--glass-b)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b className="text-[.92rem]">{t.regs} · {regs.length}</b>
        <span className="flex gap-2">
          {onRefresh && <button type="button" className="rounded-full border px-3 py-1 text-[.8rem] font-bold" style={{ borderColor: 'var(--glass-b)' }} onClick={onRefresh}>{t.refresh}</button>}
          {todo.length > 0 && <button type="button" className="rounded-full border px-3 py-1 text-[.8rem] font-bold" style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)' }} onClick={() => onAdd(todo)}>{t.all} ({todo.length})</button>}
        </span>
      </div>
      {regs.length === 0 ? <p className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{t.none}</p> : (
        <ul className="grid gap-1.5">
          {regs.map((r, i) => {
            const n = regName(r), done = have.has(n.toLowerCase());
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-[.88rem]" style={{ borderColor: 'var(--glass-b)', opacity: done ? 0.6 : 1 }}>
                <div className="min-w-0"><b dir="auto">{i + 1}. {n}</b>{r.mode === 'team' && <div dir="auto" className="truncate" style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{t.captain}: {r.plato_id}{r.members ? ` · ${r.members.replace(/\n/g, '، ')}` : ''}</div>}</div>
                {done ? <span className="shrink-0 text-[.78rem] font-bold" style={{ color: '#2ecc8c' }}>✓ {t.added}</span>
                  : <button type="button" className={btn} style={{ borderColor: 'rgba(143,178,255,.55)', background: 'rgba(61,123,255,.2)', color: 'var(--text)' }} aria-label={t.add} title={t.add} onClick={() => onAdd([n])}>+</button>}
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
