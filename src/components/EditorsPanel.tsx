import { go as navTo } from '../hooks/nav';
import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../services/api';
import Fold from './Fold';

type Person = { id: string; name: string; handle: string; avatar: string; perms?: string[] };
const KEYS = ['tree', 'info', 'join', 'regs'] as const;
const LEGACY = ['tree', 'info'];
type Data = { isOwner: boolean; max: number; editors: Person[] };
const T = {
  ar: {
    title: 'إضافة منظم', sub: 'أضف عضواً مسجّلاً باسم المستخدم الخاص به ليعدّل معك على هذه البطولة.', ph: 'اسم مستخدم العضو (مثال: abdullah_9)', add: 'إضافة',
    none: 'لم يُضاف أحد بعد.', remove: 'إزالة', leave: 'ترك التحرير', asEditor: 'أنت محرر مشارك في هذه القرعة.', empty: 'اكتب اسم المستخدم.',
    err: { bad_handle: 'اسم المستخدم غير صالح: حروف إنجليزية وأرقام و _ فقط.', no_user: 'لم يتم العثور على عضو بهذا الاسم.', self: 'هذا اسم المستخدم الخاص بك.', limit: 'وصلت الحد الأقصى للمحررين.', no_perms: 'اختر صلاحية واحدة على الأقل.', migrate: 'الميزة تحتاج تحديث قاعدة البيانات (جمل SQL).', fail: 'لم تتم العملية، حاول مرة أخرى.' },
    notAdded: 'لم يُضَف هؤلاء محررين:', mine: 'اسم المستخدم', warn: 'المنظم المضاف يقدر يسوي فقط ما تعطيه من صلاحيات. صاحب البطولة وحده يحذفها وينشرها في الموقع ويضيف المنظمين ويزيلهم.',
    permsT: 'الصلاحيات', keys: { tree: 'الشجرة (النتائج واللاعبون)', info: 'معلومات البطولة', join: 'رابط التسجيل', regs: 'المسجلون وإجاباتهم' },
  },
  en: {
    title: 'Add organizer', sub: 'Add a registered member by username so they can edit this bracket with you. It shows in their “My brackets” and they can update results.', ph: 'Username (e.g. abdullah_9)', add: 'Add',
    none: 'Nobody added yet.', remove: 'Remove', leave: 'Leave', asEditor: 'You are a co-editor of this bracket.', empty: 'Enter a username.',
    err: { bad_handle: 'Invalid username: English letters, digits and _ only.', no_user: 'No member with that username.', self: 'That is your own username.', limit: 'Co-editor limit reached.', no_perms: 'Pick at least one permission.', migrate: 'This feature needs the database update (SQL statements).', fail: 'Something went wrong, try again.' },
    notAdded: 'These could not be added as co-editors:', mine: 'Your username', warn: 'An added organizer can only do what you allow. Only the tournament owner deletes it, publishes it on the site, and adds or removes organizers.',
    permsT: 'Permissions', keys: { tree: 'Bracket (results & players)', info: 'Tournament info', join: 'Registration link', regs: 'Participants & their answers' },
  },
} as const;

/** The permission check boxes (the owner ticks what a co-editor may do). */
function PermBoxes({ value, labels, onChange, disabled }: { value: string[]; labels: Record<string, string>; onChange: (v: string[]) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {KEYS.map((k) => (
        <label key={k} className="inline-flex cursor-pointer items-center gap-1.5 text-[.85rem] font-semibold">
          <input type="checkbox" className="h-4 w-4" disabled={disabled} checked={value.includes(k)} onChange={() => onChange(value.includes(k) ? value.filter((v) => v !== k) : KEYS.filter((v) => v === k || value.includes(v)))} />{labels[k]}
        </label>
      ))}
    </div>
  );
}

/** Owner: add / remove co-editors by username. A co-editor sees the list and can leave. */
export default function EditorsPanel({ id, lang, userId, style }: { id: string; lang: 'ar' | 'en'; userId: string; style?: CSSProperties }) {
  const x = T[lang];
  const [d, setD] = useState<Data | null>(null);
  const [h, setH] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string[]>(LEGACY); // permissions of the person about to be added
  const [fails, setFails] = useState<string[]>([]);
  useEffect(() => {
    try {
      const k = `plato-editor-fail-${id}`, raw = sessionStorage.getItem(k);
      if (!raw) return;
      sessionStorage.removeItem(k);
      const bad = JSON.parse(raw) as { h: string; c: string }[];
      setFails(bad.map((b) => `@${b.h}: ${(x.err as Record<string, string>)[b.c] ?? x.err.fail}`));
    } catch { /* ignore */ }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const load = () => api<Data>(`/brackets/${id}/editors`).then(setD).catch((e: Error & { detail?: string }) => { if (e.detail === 'migrate') setMsg(x.err.migrate); });
  useEffect(() => { void load(); }, [id]);
  const fail = (e: unknown) => setMsg((x.err as Record<string, string>)[(e as Error & { detail?: string }).detail ?? ''] ?? x.err.fail);
  async function add() {
    const v = h.trim().replace(/^@/, '');
    if (!v) { setMsg(x.empty); return; }
    setBusy(true); setMsg('');
    try { await api(`/brackets/${id}/editors`, { method: 'POST', body: JSON.stringify({ handle: v, perms: sel }) }); setH(''); await load(); } catch (e) { fail(e); }
    setBusy(false);
  }
  async function setPerms(uid: string, next: string[]) {
    if (!next.length) { setMsg(x.err.no_perms); return; }
    setBusy(true); setMsg('');
    try { await api(`/brackets/${id}/editors`, { method: 'PUT', body: JSON.stringify({ userId: uid, perms: next }) }); await load(); } catch (e) { fail(e); }
    setBusy(false);
  }
  async function del(uid: string) {
    setBusy(true); setMsg('');
    try { await api(`/brackets/${id}/editors`, { method: 'DELETE', body: JSON.stringify({ userId: uid }) }); if (uid === userId) navTo('/bracket', true); else await load(); } catch (e) { fail(e); }
    setBusy(false);
  }
  if (!d) return msg ? <p className="st-shn" style={style}>{msg}</p> : null;
  const owner = d.isOwner;
  return (
    <Fold title={x.title} style={style} defaultOpen={fails.length > 0}>
      {fails.length > 0 && <div role="alert" className="grid gap-1 rounded-xl border px-3 py-2 text-[.86rem] font-semibold" style={{ borderColor: 'rgba(255,77,94,.5)', color: '#ff8a80' }}><span>{x.notAdded}</span>{fails.map((f) => <span key={f} dir="auto">{f}</span>)}</div>}
      {owner ? <p className="st-shn">{x.sub}</p> : <p className="st-shn">{x.asEditor}</p>}
      {owner && (
        <div className="st-shl">
          <input dir="ltr" placeholder={x.ph} maxLength={30} value={h} onChange={(e) => setH(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button type="button" disabled={busy} onClick={add}>{x.add}</button>
        </div>
      )}
      {owner && <div className="grid gap-1.5" style={{ marginTop: '.6rem' }}><b className="text-[.85rem]">{x.permsT}</b><PermBoxes value={sel} labels={x.keys} onChange={setSel} /></div>}
      {msg && <p className="st-shn" role="status" style={{ color: '#ff8a80' }}>{msg}</p>}
      <ul className="grid gap-2" style={{ marginTop: '.7rem' }}>
        {d.editors.map((p) => {
          const pm = p.perms ?? LEGACY;
          return (
            <li key={p.id} className="grid gap-2 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--glass-b)' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  {p.avatar ? <img src={p.avatar} alt="" className="h-7 w-7 rounded-full object-cover" /> : <i className="h-7 w-7 rounded-full" style={{ background: 'var(--glass-b)' }} />}
                  <span className="min-w-0 truncate"><b>{p.name}</b> <small dir="ltr" style={{ color: 'var(--muted)' }}>@{p.handle}</small></span>
                </span>
                {(owner || p.id === userId) && <button type="button" disabled={busy} className="text-[.85rem] font-semibold underline" onClick={() => del(p.id)}>{owner ? x.remove : x.leave}</button>}
              </div>
              {owner
                ? <PermBoxes value={pm} labels={x.keys} disabled={busy} onChange={(v) => void setPerms(p.id, v)} />
                : <small style={{ color: 'var(--muted)' }}>{x.permsT}: {KEYS.filter((k) => pm.includes(k)).map((k) => x.keys[k]).join(' · ')}</small>}
            </li>
          );
        })}
        {!d.editors.length && <li className="st-shn">{x.none}</li>}
      </ul>
      {owner && <p className="st-shn" style={{ marginTop: '.6rem' }}>{x.warn}</p>}
    </Fold>
  );
}

/** Same card for a bracket that is not saved yet: the usernames are kept here and added as soon as the bracket is created. */
export function DraftEditors({ lang, handles, setHandles, style }: { lang: 'ar' | 'en'; handles: string[]; setHandles: (h: string[]) => void; style?: CSSProperties }) {
  const x = T[lang];
  const [h, setH] = useState('');
  const [msg, setMsg] = useState('');
  function add() {
    const v = h.trim().replace(/^@/, '').toLowerCase();
    if (!v) { setMsg(x.empty); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(v)) { setMsg(x.err.bad_handle); return; }
    if (!handles.includes(v)) setHandles([...handles, v]);
    setH(''); setMsg('');
  }
  return (
    <Fold title={x.title} style={style}>
      <p className="st-shn">{lang === 'ar' ? 'أضف أسماء مستخدمي المنظمين الإضافيين الآن، وسيُضافون تلقائياً فور إنشاء البطولة.' : 'Add extra organisers now; they are added automatically as soon as you create the tournament.'}</p>
      <div className="st-shl">
        <input dir="ltr" placeholder={x.ph} maxLength={30} value={h} onChange={(e) => setH(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button type="button" onClick={add}>{x.add}</button>
      </div>
      {msg && <p className="st-shn" role="status" style={{ color: '#ff8a80' }}>{msg}</p>}
      <ul className="grid gap-2">
        {handles.map((u) => (
          <li key={u} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--glass-b)' }}>
            <small dir="ltr"><b>@{u}</b></small>
            <button type="button" className="text-[.85rem] font-semibold underline" onClick={() => setHandles(handles.filter((v) => v !== u))}>{x.remove}</button>
          </li>
        ))}
        {!handles.length && <li className="st-shn">{x.none}</li>}
      </ul>
      <p className="st-shn">{x.warn}</p>
    </Fold>
  );
}
