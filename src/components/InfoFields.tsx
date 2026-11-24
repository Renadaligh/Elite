import type { ReactNode } from 'react';
import type { BFormat, BInfo } from '../data/bracket';
import { useGames } from '../hooks/useGames';
import FormatOpts, { type FmtState } from './FormatOpts';
import StartPicker from './StartPicker';
import GameSelect from './GameSelect';
import { nextHalfHour } from '../data/slot';

/** Every tournament setting in one form: used when a tournament is created and on the "Tournament info" page. */
const bd = { borderColor: 'var(--glass-b)', color: 'var(--text)' };
const sel = { ...bd, backgroundColor: 'var(--bg)' };
const inp = 'w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[.95rem] outline-none focus:border-[#3d7bff]';
const lbl = 'grid gap-1.5 text-[.85rem]';
const pad2 = (n: number) => String(n).padStart(2, '0');
const toLocal = (iso?: string) => { const d = new Date(iso ?? ''); return !iso || Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fromLocal = (v: string) => { const d = new Date(v); return v && !Number.isNaN(d.getTime()) ? d.toISOString() : ''; };
/** Default start offered for a new tournament: the nearest half hour from now (8:15 → 8:30). */
export const defaultStart = () => new Date(nextHalfHour()).toISOString();

export interface InfoFieldsProps {
  lang: 'ar' | 'en';
  title: string; onTitle: (v: string) => void;
  org: string; onOrg: (v: string) => void;
  fmt: BFormat; onFmt: (f: BFormat) => void; lo: FmtState; onLo: (s: FmtState) => void; players: number;
  fmtLabels: Record<BFormat, string>;
  info: BInfo; onInfo: (patch: Partial<BInfo>) => void;
  /** the picture is edited in the registration link card now; kept optional so callers need no change */
  cover?: string; onCover?: (f: File | null) => void; coverBusy?: boolean;
  /** "3rd place match" tick (single elimination only) */
  third?: { on: boolean; disabled: boolean; set: (on: boolean) => void };
  /** "placement matches" tick (single and double elimination) */
  placeOpt?: { on: boolean; disabled: boolean; set: (on: boolean) => void; /** lowest place decided (3 … 16) */ to: number; setTo: (n: number) => void };
  /** the "apply format" button (an existing tournament); a new one has no button here */
  apply?: { label: string; run: () => void };
  after?: ReactNode;
  /** two columns on wide screens (the create page); the narrow info tab keeps one */
  wide?: boolean;
}

export default function InfoFields(p: InfoFieldsProps) {
  const { lang, info } = p;
  const ar = lang === 'ar';
  const games = useGames();
  const total = info.total ?? 0;
  /** the deepest place the bracket can decide: the bracket size (a power of two, at least 8), never more than 16 */
  const placeMax = p.players > 0 ? Math.max(4, Math.min(16, 2 ** Math.ceil(Math.log2(Math.max(p.players, 8))))) : 16;
  const L = ar
    ? { name: 'اسم البطولة', namePh: 'مثلاً: كأس خادم الأصدقاء', org: 'اسم المنظم / المجموعة (اختياري)', orgPh: 'مثلاً: خادم الأصدقاء', fmt: 'النظام', game: 'اللعبة', pick: 'اختر لعبة', start: 'تاريخ ووقت بداية البطولة', seats: 'عدد المقاعد', unlimited: 'مفتوح بدون حد', mode: 'نوع التسجيل', solo: 'فردي', team: 'فريق', prize: 'الجائزة (اختياري)', prizePh: '', cover: 'صورة البطولة (اختياري)', up: 'رفع صورة', chg: 'تغيير الصورة', rm: 'حذف الصورة', coverNote: 'ارفع صورة بقياس 1280 × 720 (16:9)، PNG أو JPG أو WebP. تظهر في صفحة التسجيل وفي بطاقة البطولة بالموقع.', third: 'مباراة المركز الثالث' }
    : { name: 'Tournament name', namePh: 'e.g. Friends Server Cup', org: 'Organizer / group name (optional)', orgPh: 'e.g. Friends server', fmt: 'Format', game: 'Game', pick: 'Choose a game', start: 'Tournament start date and time', seats: 'Seats', unlimited: 'Open, no limit', mode: 'Registration type', solo: 'Solo', team: 'Team', prize: 'Prize (optional)', prizePh: '', cover: 'Tournament picture (optional)', up: 'Upload picture', chg: 'Change picture', rm: 'Remove picture', coverNote: 'Upload a 1280 × 720 picture (16:9), PNG, JPG or WebP. It shows on the registration page and on the tournament card on the site.', third: '3rd place match' };
  return (
    <div className={`grid gap-3.5 ${p.wide ? 'if-wide' : ''}`}>
     <div className="grid min-w-0 content-start gap-3.5">
      <label className={lbl} style={{ color: 'var(--muted)' }}><span>{L.name} <span style={{ color: '#ff6b7a' }}>*</span></span><input className={inp} style={bd} maxLength={60} value={p.title} placeholder={L.namePh} onChange={(e) => p.onTitle(e.target.value)} /></label>
      <label className={lbl} style={{ color: 'var(--muted)' }}>{L.org}<input className={inp} style={bd} maxLength={60} value={p.org} placeholder={L.orgPh} onChange={(e) => p.onOrg(e.target.value.slice(0, 60))} /></label>
      <label className={lbl} style={{ color: 'var(--muted)' }}><span>{L.fmt} <span style={{ color: '#ff6b7a' }}>*</span></span>
        <select className={`${inp} sel`} style={sel} value={p.fmt} onChange={(e) => p.onFmt(e.target.value as BFormat)}>{(['single', 'double', 'rr', 'swiss', 'groups', 'ffa'] as BFormat[]).map((f) => <option key={f} value={f}>{p.fmtLabels[f]}</option>)}</select></label>
      <FormatOpts fmt={p.fmt} value={p.lo} onChange={p.onLo} lang={lang} inpCls={inp} style={sel} border={{ borderColor: 'var(--glass-b)' }} players={p.players} />
      {p.third && p.fmt === 'single' && <label className="flex items-center gap-2.5 text-[.9rem]" style={p.third.disabled ? { opacity: .55 } : undefined}><input type="checkbox" className="h-4 w-4" disabled={p.third.disabled} checked={p.third.on} onChange={(e) => p.third?.set(e.target.checked)} />{L.third}</label>}
      {p.placeOpt && (p.fmt === 'single' || p.fmt === 'double') && <div className="grid gap-2.5">
        <label className="flex items-center gap-2.5 text-[.9rem]" style={p.placeOpt.disabled ? { opacity: .55 } : undefined}><input type="checkbox" className="h-4 w-4" disabled={p.placeOpt.disabled} checked={p.placeOpt.on} onChange={(e) => p.placeOpt?.set(e.target.checked)} />{ar ? 'مباريات تحديد المراكز' : 'Placement matches'}</label>
        {p.placeOpt.on && <label className={lbl} style={{ color: 'var(--muted)' }}>{ar ? 'تحديد المراكز حتى' : 'Decide the places down to'}
          <select className={`${inp} sel`} style={sel} value={Math.min(p.placeOpt.to, placeMax)} onChange={(e) => p.placeOpt?.setTo(+e.target.value)}>{Array.from({ length: placeMax - 2 }, (_, i) => i + 3).map((n) => <option key={n} value={n}>{ar ? `المركز ${n}` : `${n}${n === 3 ? 'rd' : 'th'} place`}</option>)}</select></label>}
      </div>}
      {p.apply && <div><button type="button" className="btn-primary" onClick={p.apply.run}>{p.apply.label}</button></div>}
     </div>
     <div className="grid min-w-0 content-start gap-3.5">
      <div className={lbl} style={{ color: 'var(--muted)' }}><span>{L.game} <span style={{ color: '#ff6b7a' }}>*</span></span>
        <GameSelect value={info.gameId ?? ''} onChange={(id) => p.onInfo({ gameId: id })} games={games} lang={lang} inpCls={inp} style={bd} /></div>
      <div className={lbl} style={{ color: 'var(--muted)' }}><span>{L.start} <span style={{ color: '#ff6b7a' }}>*</span></span>
        <StartPicker lang={lang} inpCls={inp} style={bd} required value={toLocal(info.startsAt)} onChange={(v) => p.onInfo({ startsAt: fromLocal(v) })} /></div>
      <div className={lbl} style={{ color: 'var(--muted)' }}>{L.seats}
        <div className="flex items-center gap-3" style={{ minHeight: 42 }}>
          <button type="button" role="switch" aria-checked={total > 0} aria-label={L.seats} className={`st-sw ${total > 0 ? 'on' : ''}`} onClick={() => p.onInfo({ total: total > 0 ? 0 : 16 })}><i /></button>
          {total > 0 ? <input type="number" min={2} max={1000} className={inp} style={bd} value={total} onChange={(e) => p.onInfo({ total: Math.max(2, Math.min(1000, +e.target.value || 2)) })} /> : <span>{L.unlimited} ∞</span>}
        </div>
      </div>
      <div className={lbl} style={{ color: 'var(--muted)' }}>{L.mode}
        <div className="flex gap-2" role="radiogroup" aria-label={L.mode}>
          {(['solo', 'team'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={(info.mode ?? 'solo') === m} className={`br-chip rect ${(info.mode ?? 'solo') === m ? 'on' : ''}`} onClick={() => p.onInfo({ mode: m })}>{m === 'solo' ? L.solo : L.team}</button>)}
        </div>
      </div>
      <label className={lbl} style={{ color: 'var(--muted)' }}>{L.prize}<input className={inp} style={bd} maxLength={80} value={info.prize ?? ''} placeholder={L.prizePh} onChange={(e) => p.onInfo({ prize: e.target.value })} /></label>
     </div>
      {p.after && <div className="if-full min-w-0">{p.after}</div>}
    </div>
  );
}
