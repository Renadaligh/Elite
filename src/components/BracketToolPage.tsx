import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MAX_PLAYERS, MAX_RR, isLeague, champion, generate, resolve, setScore, setWinner, shuffled, type BFormat, type BMatch, type Bracket } from '../data/bracket';
import { bracketBlob, downloadBlob } from '../data/bracketImage';
import { useAuth, type AuthUser } from '../hooks/useAuth';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../services/api';
import BracketActions from './BracketActions';
import BracketView from './BracketView';

const WRAP = 'px-[clamp(1.1rem,7vw,6.9rem)]';
const DRAFT = 'elite-bracket-draft';
const card = { background: 'var(--glass)', borderColor: 'var(--glass-b)' };
const inp = 'w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[.95rem] outline-none focus:border-[#ff3347]';
const pill = 'rounded-full border px-4 py-2 text-[.85rem] font-semibold disabled:opacity-60';

const TXT = {
  ar: {
    title: 'أداة البراكت', sub: 'سوِّ براكت لأي سيرفر أو مجتمع: خروج مغلوب أو مزدوج أو دوري أو سويسري. حدّث النتائج واحفظه كصورة أو شاركه.',
    name: 'اسم البطولة', namePh: 'مثلاً: كأس سيرفر الأصدقاء', format: 'النظام', single: 'خروج المغلوب (فردي)', double: 'خروج مزدوج', rr: 'دوري (كل لاعب ضد الكل)', swiss: 'سويسري', dbl: 'دوري مزدوج (ذهاب وإياب)', maxRr: `الدوري: الحد الأقصى ${MAX_RR}`, players: 'اللاعبون / الفرق (سطر لكل واحد، الأعلى = الأقوى)',
    shuffle: 'خلط عشوائي', create: 'إنشاء البراكت', need: 'أدخل لاعبَين على الأقل', max: `الحد الأقصى ${MAX_PLAYERS}`,
    hint: 'اضغط على اسم الفائز في كل مباراة لتحديثه.', hintL: 'اكتب النتيجة في كل مباراة والترتيب يتحدث تلقائياً.', score: 'نتيجة المباراة', undo: 'تراجع', save: 'حفظ في براكتاتي', saved: 'تم الحفظ', saving: '…', mine: 'براكتاتي',
    login: 'تسجيل الدخول', logout: 'خروج', loginTitle: 'سجّل دخولك عشان تحفظ براكتاتك', loginSub: 'تجد كل براكتاتك في مكان واحد وترجع لها من أي جهاز. ما ننشر شيء باسمك.',
    discord: 'الدخول بحساب Discord', google: 'الدخول بحساب Google', none: 'تسجيل الدخول غير مفعّل بعد.', close: 'إغلاق',
    editPlayers: 'تعديل أسماء اللاعبين', rebuild: 'تعديل القائمة وإعادة البناء', rebuildAsk: 'إعادة البناء تمسح النتائج الحالية. متأكد؟', renameNote: 'تغيير الاسم يحافظ على النتائج.',
    notFound: 'البراكت غير موجود.', by: 'من', copy: 'انسخه لأعدّله', readonly: 'عرض فقط', unsaved: 'لم تُحفظ التعديلات بعد',
    loginFailed: 'تعذّر تسجيل الدخول، جرّب مرة ثانية.', loginUnavailable: 'تسجيل الدخول غير مفعّل بعد.', limit: 'وصلت الحد الأقصى من البراكتات المحفوظة (20). احذف واحد قديم.', saveFail: 'تعذّر الحفظ',
    myTitle: 'براكتاتي', newOne: '+ براكت جديد', empty: 'ما عندك براكتات محفوظة بعد.', open: 'فتح وتعديل', link: 'نسخ الرابط', linkDone: 'تم نسخ الرابط', img: '⬇ صورة', del: 'حذف', delAsk: 'حذف هذا البراكت؟',
    needLogin: 'سجّل دخولك لتشوف براكتاتك المحفوظة.', players_n: 'لاعبين', hello: 'أهلاً',
  },
  en: {
    title: 'Bracket tool', sub: 'Make a bracket for any server or community: single or double elimination, round robin or swiss. Update results, save it as an image or share it.',
    name: 'Tournament name', namePh: 'e.g. Friends Server Cup', format: 'Format', single: 'Single elimination', double: 'Double elimination', rr: 'Round robin', swiss: 'Swiss', dbl: 'Double round robin (home & away)', maxRr: `Round robin: max ${MAX_RR}`, players: 'Players / teams (one per line, top = strongest seed)',
    shuffle: 'Shuffle randomly', create: 'Create bracket', need: 'Enter at least 2 players', max: `Max ${MAX_PLAYERS}`,
    hint: 'Click the winner of each match to update it.', hintL: 'Type the score of each match; the standings update automatically.', score: 'Match score', undo: 'Undo', save: 'Save to my brackets', saved: 'Saved', saving: '…', mine: 'My brackets',
    login: 'Sign in', logout: 'Sign out', loginTitle: 'Sign in to save your brackets', loginSub: 'Find all your brackets in one place from any device. We never post anything for you.',
    discord: 'Continue with Discord', google: 'Continue with Google', none: 'Sign-in is not enabled yet.', close: 'Close',
    editPlayers: 'Edit player names', rebuild: 'Edit list & rebuild', rebuildAsk: 'Rebuilding clears the current results. Sure?', renameNote: 'Renaming keeps the results.',
    notFound: 'Bracket not found.', by: 'by', copy: 'Copy to edit', readonly: 'View only', unsaved: 'Unsaved changes',
    loginFailed: 'Sign-in failed, please try again.', loginUnavailable: 'Sign-in is not enabled yet.', limit: 'You reached the limit of saved brackets (20). Delete an old one.', saveFail: 'Could not save',
    myTitle: 'My brackets', newOne: '+ New bracket', empty: 'No saved brackets yet.', open: 'Open & edit', link: 'Copy link', linkDone: 'Link copied', img: '⬇ Image', del: 'Delete', delAsk: 'Delete this bracket?',
    needLogin: 'Sign in to see your saved brackets.', players_n: 'players', hello: 'Hi',
  },
} as const;
type Tx = (typeof TXT)['ar'] | (typeof TXT)['en'];

const base = () => `${window.location.origin}${window.location.pathname}`;
const loginNote = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('login');

function LoginModal({ tx, providers, r, onClose }: { tx: Tx; providers: { discord: boolean; google: boolean }; r: 'tool' | 'mine'; onClose: () => void }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const any = providers.discord || providers.google;
  return (
    <div className="backdrop-fade fixed inset-0 z-[90] grid place-items-center bg-black/60 p-5 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={tx.loginTitle} className="modal-in grid w-full max-w-[26rem] gap-3 rounded-2xl border p-7 text-center shadow-2xl" style={{ background: 'var(--dialog, #0b0b10)', borderColor: 'var(--glass-b)' }}>
        <h2 className="text-[1.2rem] font-extrabold">{tx.loginTitle}</h2>
        <p className="text-[.9rem]" style={{ color: 'var(--muted)' }}>{tx.loginSub}</p>
        {providers.discord && <a href={`/api/auth/login/discord?r=${r}`} className="rounded-xl px-4 py-3 font-bold text-white" style={{ background: '#5865f2' }}>{tx.discord}</a>}
        {providers.google && <a href={`/api/auth/login/google?r=${r}`} className="rounded-xl bg-white px-4 py-3 font-bold text-[#222]">{tx.google}</a>}
        {!any && <p className="rounded-xl border px-4 py-3 text-[.9rem]" style={{ ...card, color: 'var(--muted)' }}>{tx.none}</p>}
        <button type="button" className={`${pill} justify-self-center`} style={card} onClick={onClose}>{tx.close}</button>
      </div>
    </div>
  );
}

function Shell({ tx, user, onLogin, onLogout, children }: { tx: Tx; user: AuthUser | null; onLogin: () => void; onLogout: () => void; children: ReactNode }) {
  return (
    <article className={`page-in min-h-[100svh] pb-20 pt-[clamp(6.5rem,12vw,9rem)] ${WRAP}`} style={{ background: 'var(--bg)' }}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[40rem]">
          <h1 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-tight">{tx.title}</h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>{tx.sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {user ? (
            <>
              <span className="flex items-center gap-2 text-[.9rem]">{user.avatar && <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />}<b>{user.name}</b></span>
              <a href="#/bracket/mine" className={pill} style={card}>{tx.mine}</a>
              <button type="button" className={pill} style={card} onClick={onLogout}>{tx.logout}</button>
            </>
          ) : <button type="button" className={`${pill} text-white`} style={{ background: 'linear-gradient(135deg,#ff3347,#d90f26)', borderColor: 'transparent' }} onClick={onLogin}>{tx.login}</button>}
        </div>
      </div>
      {children}
    </article>
  );
}

interface Draft { title: string; names: string; fmt: BFormat; br: Bracket | null }
const readDraft = (): Draft => { try { const d = JSON.parse(localStorage.getItem(DRAFT) ?? ''); if (d && typeof d.title === 'string') return d; } catch { /* none */ } return { title: '', names: '', fmt: 'single', br: null }; };

function Editor({ id, tx, auth }: { id?: string; tx: Tx; auth: ReturnType<typeof useAuth> }) {
  const { lang } = useI18n();
  const init = useMemo(() => (id ? { title: '', names: '', fmt: 'single' as BFormat, br: null } : readDraft()), [id]);
  const [title, setTitle] = useState(init.title);
  const [names, setNames] = useState(init.names);
  const [fmt, setFmt] = useState<BFormat>(init.fmt);
  const [shuf, setShuf] = useState(false);
  const [br, setBr] = useState<Bracket | null>(init.br);
  const [sel, setSel] = useState<string | null>(null);
  const [owner, setOwner] = useState('');
  const [mine, setMine] = useState(!id);
  const [state, setState] = useState<'load' | 'ok' | 'missing'>(id ? 'load' : 'ok');
  const [login, setLogin] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dbl, setDbl] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(() => { const n = loginNote(); return n === 'failed' ? tx.loginFailed : n === 'unavailable' ? tx.loginUnavailable : ''; });
  const [editP, setEditP] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<{ title: string; bracket: Bracket | null; owner: string; mine: boolean }>(`/brackets/${id}`)
      .then((r) => { if (!r.bracket) { setState('missing'); return; } setTitle(r.title); setBr(r.bracket); setOwner(r.owner); setMine(r.mine); setState('ok'); })
      .catch(() => setState('missing'));
  }, [id, auth.user?.id]);

  // Guests keep their work in the browser, so signing in (a page round-trip) never loses it.
  useEffect(() => { if (id) return; try { localStorage.setItem(DRAFT, JSON.stringify({ title, names, fmt, br })); } catch { /* private mode */ } }, [id, title, names, fmt, br]);

  const edit = (b: Bracket | null) => { setBr(b); setDirty(true); setMsg(''); };
  const url = id ? `${base()}#/bracket/${id}` : `${base()}#/bracket`;
  const shownTitle = title.trim() || (lang === 'ar' ? 'براكت' : 'Bracket');

  function create() {
    const list = names.split('\n').map((n) => n.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
    if (list.length < 2) { setMsg(tx.need); return; }
    if (fmt === 'rr' && list.length > MAX_RR) { setMsg(tx.maxRr); return; }
    edit(generate(fmt, shuf ? shuffled(list) : list, fmt === 'rr' && dbl ? { double: true } : undefined)); setSel(null);
  }
  const pick = (m: BMatch, side: 'a' | 'b') => { if (!br) return; setSel(m.id); edit(setWinner(br, m.id, m.win === side ? undefined : side)); };
  const rename = (i: number, v: string) => br && edit({ ...br, players: br.players.map((p, j) => (j === i ? v.slice(0, 40) : p)) });
  function rebuild() { if (!br || !window.confirm(tx.rebuildAsk)) return; setNames(br.players.join('\n')); setFmt(br.format); edit(null); setSel(null); setEditP(false); }

  async function save() {
    if (!br) return;
    if (!auth.user) { setLogin(true); return; }
    setBusy(true); setMsg('');
    try {
      const body = JSON.stringify({ title: shownTitle, bracket: br });
      if (id) { await api(`/brackets/${id}`, { method: 'PUT', body }); setDirty(false); setMsg(tx.saved); }
      else {
        const r = await api<{ id: string }>('/brackets', { method: 'POST', body });
        try { localStorage.removeItem(DRAFT); } catch { /* ignore */ }
        window.location.hash = `#/bracket/${r.id}`;
      }
    } catch (e) { setMsg((e as Error & { detail?: string }).detail === 'limit' ? tx.limit : tx.saveFail); }
    setBusy(false);
  }
  function copyToEdit() {
    if (!br) return;
    try { localStorage.setItem(DRAFT, JSON.stringify({ title, names: br.players.join('\n'), fmt: br.format, br: { ...br, cur: undefined } })); } catch { /* ignore */ }
    window.location.hash = '#/bracket';
  }

  const m = br && sel ? br.matches.find((i) => i.id === sel) : undefined;
  const R = br ? resolve(br) : null;
  const champ = br ? champion(br) : null;
  const editable = mine;

  if (state === 'load') return <p style={{ color: 'var(--muted)' }}>…</p>;
  if (state === 'missing') return <p className="text-lg">{tx.notFound}</p>;

  return (
    <>
      {!br ? (
        editable && (
          <div className="grid max-w-[34rem] gap-4 rounded-2xl border p-5" style={card}>
            <label className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.name}<input className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} maxLength={60} value={title} placeholder={tx.namePh} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.format}
              <select className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)', background: 'var(--bg)' }} value={fmt} onChange={(e) => setFmt(e.target.value as BFormat)}><option value="single">{tx.single}</option><option value="double">{tx.double}</option><option value="rr">{tx.rr}</option><option value="swiss">{tx.swiss}</option></select></label>
            {fmt === 'rr' && <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={dbl} onChange={(e) => setDbl(e.target.checked)} />{tx.dbl}</label>}
            <label className="grid gap-1.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{tx.players} · {tx.max}<textarea rows={8} dir="auto" className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} value={names} onChange={(e) => setNames(e.target.value)} /></label>
            <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={shuf} onChange={(e) => setShuf(e.target.checked)} />{tx.shuffle}</label>
            <div><button type="button" className="btn-primary" onClick={create}>{tx.create}</button></div>
            {msg && <p role="status" className="text-[.85rem]" style={{ color: '#ffb02e' }}>{msg}</p>}
          </div>
        )
      ) : (
        <div className="grid min-w-0 gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {editable ? <input className="w-full max-w-[26rem] rounded-xl border bg-transparent px-3 py-2 text-[1.2rem] font-extrabold outline-none focus:border-[#ff3347]" style={{ borderColor: 'var(--glass-b)' }} maxLength={60} value={title} placeholder={tx.namePh} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
                : <h2 className="text-[1.4rem] font-extrabold">{title}</h2>}
              {!editable && <p className="mt-1 text-[.85rem]" style={{ color: 'var(--muted)' }}>{owner && `${tx.by} ${owner} · `}{tx.readonly}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <BracketActions bracket={br} title={shownTitle} url={url} />
              {editable && <button type="button" className={`${pill} text-white`} style={{ background: 'linear-gradient(135deg,#ff3347,#d90f26)', borderColor: 'transparent' }} disabled={busy} onClick={save}>{busy ? tx.saving : tx.save}</button>}
              {!editable && <button type="button" className={pill} style={card} onClick={copyToEdit}>{tx.copy}</button>}
            </div>
          </div>
          {(msg || dirty) && <p role="status" className="text-[.85rem]" style={{ color: msg === tx.saved ? '#27c27a' : '#ffb02e' }}>{msg || tx.unsaved}</p>}
          {editable && <p className="text-[.9rem]" style={{ color: 'var(--muted)' }}>{br && isLeague(br) ? tx.hintL : tx.hint}</p>}
          {champ !== null && <p className="text-[1rem]">🏆 <b>{br.players[champ]}</b></p>}
          <div className="rounded-2xl border p-3" style={card}><BracketView bracket={br} onPick={editable ? pick : undefined} selected={sel} onChange={editable ? edit : undefined} /></div>
          {editable && m && R && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border p-3" style={card}>
              <b className="self-center">{m.id}</b>
              <label className="grid gap-1 text-[.8rem]" style={{ color: 'var(--muted)' }}>{tx.score}
                <span className="flex items-center gap-2" dir="ltr">
                  <input className={`${inp} !w-16 text-center`} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} maxLength={4} value={m.sa ?? ''} onChange={(e) => edit(setScore(br, m.id, e.target.value, m.sb ?? ''))} />–
                  <input className={`${inp} !w-16 text-center`} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} maxLength={4} value={m.sb ?? ''} onChange={(e) => edit(setScore(br, m.id, m.sa ?? '', e.target.value))} />
                </span>
              </label>
              {m.win && <button type="button" className={pill} style={card} onClick={() => edit(setWinner(br, m.id, undefined))}>{tx.undo}</button>}
            </div>
          )}
          {editable && (
            <div className="rounded-xl border p-3" style={card}>
              <button type="button" className={pill} style={card} onClick={() => setEditP((v) => !v)}>{tx.editPlayers} {editP ? '▲' : '▼'}</button>
              {editP && (
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {br.players.map((p, i) => <label key={i} className="flex items-center gap-2 text-[.8rem]"><span className="w-6 text-center" style={{ color: 'var(--muted)' }}>{i + 1}</span><input dir="auto" className={inp} style={{ borderColor: 'var(--glass-b)', color: 'var(--text)' }} value={p} onChange={(e) => rename(i, e.target.value)} /></label>)}
                  </div>
                  <p className="text-[.8rem]" style={{ color: 'var(--muted)' }}>{tx.renameNote}</p>
                  <div><button type="button" className={pill} style={{ ...card, color: '#ffb02e' }} onClick={rebuild}>{tx.rebuild}</button></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {login && <LoginModal tx={tx} providers={auth.providers} r="tool" onClose={() => setLogin(false)} />}
    </>
  );
}

function Mine({ tx, auth, onLogin }: { tx: Tx; auth: ReturnType<typeof useAuth>; onLogin: () => void }) {
  type Row = { id: string; title: string; format: string; players: number; updatedAt: string };
  const { lang } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [flash, setFlash] = useState('');
  const load = () => api<Row[]>('/brackets').then(setRows).catch(() => setRows([]));
  useEffect(() => { if (auth.user) load(); }, [auth.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const when = (iso: string) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const say = (s: string) => { setFlash(s); window.setTimeout(() => setFlash(''), 2200); };
  async function image(r: Row) {
    try { const d = await api<{ bracket: Bracket }>(`/brackets/${r.id}`); downloadBlob(await bracketBlob(d.bracket, { title: r.title, lang }), `${r.title.replace(/[^\p{L}\p{N}]+/gu, '-') || 'bracket'}.png`); } catch { say(tx.saveFail); }
  }
  async function del(r: Row) { if (!window.confirm(tx.delAsk)) return; await api(`/brackets/${r.id}`, { method: 'DELETE' }).catch(() => undefined); load(); }
  async function copy(r: Row) { try { await navigator.clipboard.writeText(`${base()}#/bracket/${r.id}`); say(tx.linkDone); } catch { say(`${base()}#/bracket/${r.id}`); } }

  if (!auth.ready) return <p style={{ color: 'var(--muted)' }}>…</p>;
  if (!auth.user) return (<div className="grid max-w-[28rem] gap-4"><p>{tx.needLogin}</p><div><button type="button" className="btn-primary" onClick={onLogin}>{tx.login}</button></div></div>);
  return (
    <div className="grid max-w-[52rem] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[1.4rem] font-extrabold">{tx.myTitle} {rows ? `(${rows.length})` : ''}</h2><a href="#/bracket" className="btn-primary">{tx.newOne}</a></div>
      {flash && <p role="status" className="text-[.85rem]" style={{ color: 'var(--muted)' }}>{flash}</p>}
      {rows && !rows.length && <p className="rounded-2xl border px-5 py-6" style={{ ...card, color: 'var(--muted)' }}>{tx.empty}</p>}
      {rows?.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4" style={card}>
          <div className="min-w-0">
            <b className="[overflow-wrap:anywhere]">{r.title}</b> <span className="ms-2 rounded-full px-2 py-0.5 text-[.7rem]" style={{ background: 'var(--glass-b)' }}>{r.format === 'double' ? tx.double : tx.single}</span>
            <div className="mt-1 text-[.8rem]" style={{ color: 'var(--muted)' }}>{r.players} {tx.players_n} · {when(r.updatedAt)}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`#/bracket/${r.id}`} className={pill} style={card}>{tx.open}</a>
            <button type="button" className={pill} style={card} onClick={() => copy(r)}>{tx.link}</button>
            <button type="button" className={pill} style={card} onClick={() => image(r)}>{tx.img}</button>
            <button type="button" className={pill} style={{ ...card, color: '#ff6b7a' }} onClick={() => del(r)}>{tx.del}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Public bracket tool: #/bracket (new) · #/bracket/<id> (a saved bracket: view, or edit if it is yours) · #/bracket/mine (my brackets). */
export default function BracketToolPage({ id }: { id?: string }) {
  const { lang } = useI18n();
  const tx = TXT[lang];
  const auth = useAuth();
  const [login, setLogin] = useState(false);
  return (
    <Shell tx={tx} user={auth.user} onLogin={() => setLogin(true)} onLogout={auth.logout}>
      {id === 'mine' ? <Mine tx={tx} auth={auth} onLogin={() => setLogin(true)} /> : <Editor key={`${id ?? 'new'}:${auth.user?.id ?? ''}`} id={id} tx={tx} auth={auth} />}
      {login && <LoginModal tx={tx} providers={auth.providers} r={id === 'mine' ? 'mine' : 'tool'} onClose={() => setLogin(false)} />}
    </Shell>
  );
}
