import type { BFormat, LeagueOpts } from '../data/bracket';

/** Settings shown under the format select for the non-elimination formats (shared by the dashboard and the public tool). */
export interface FmtState { win: string; draw: string; loss: string; rounds: string; double: boolean; groups: string; adv: string; ko: 'single' | 'double'; low: boolean }
export const fmtInit = (): FmtState => ({ win: '1', draw: '0.5', loss: '0', rounds: '', double: false, groups: '', adv: '', ko: 'single', low: false });
export const hasOpts = (f: BFormat) => f !== 'single' && f !== 'double';

const n = (v: string, d: number) => (v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
export function toOpts(f: BFormat, s: FmtState, players: number): Partial<LeagueOpts> {
  const pts = { win: n(s.win, 1), draw: n(s.draw, 0.5), loss: n(s.loss, 0) };
  if (f === 'swiss') return { ...pts, rounds: Math.min(12, Math.max(1, Math.round(n(s.rounds, Math.max(1, Math.ceil(Math.log2(Math.max(2, players))))))) ) };
  if (f === 'rr') return { ...pts, ...(s.double ? { double: true } : {}) };
  if (f === 'ffa') return { rounds: Math.min(30, Math.max(1, Math.round(n(s.rounds, 3)))), low: s.low };
  if (f === 'groups') return { ...pts, groups: Math.min(8, Math.max(2, Math.round(n(s.groups, players >= 12 ? 4 : 2)))), adv: Math.max(1, Math.round(n(s.adv, 2))), koFormat: s.ko };
  return {};
}

interface P { fmt: BFormat; value: FmtState; onChange: (v: FmtState) => void; lang: 'ar' | 'en'; inpCls: string; style?: React.CSSProperties; border?: React.CSSProperties; players: number }
export default function FormatOpts({ fmt, value: v, onChange, lang, inpCls, style, border, players }: P) {
  if (!hasOpts(fmt)) return null;
  const ar = lang === 'ar';
  const set = (p: Partial<FmtState>) => onChange({ ...v, ...p });
  const F = ({ l, children }: { l: string; children: React.ReactNode }) => <label className="grid gap-1.5 text-[.8rem]" style={{ color: 'var(--muted)' }}>{l}{children}</label>;
  const num = (k: keyof FmtState, ph?: string) => <input dir="ltr" inputMode="decimal" className={inpCls} style={style} value={v[k] as string} placeholder={ph} onChange={(e) => set({ [k]: e.target.value } as Partial<FmtState>)} />;
  const chk = (label: string, on: boolean, click: (b: boolean) => void) => <label className="flex items-center gap-2.5 text-[.9rem]"><input type="checkbox" className="h-4 w-4" checked={on} onChange={(e) => click(e.target.checked)} />{label}</label>;
  const pts = fmt !== 'ffa' && (
    <div className="grid grid-cols-3 gap-2">
      <F l={ar ? 'نقاط الفوز' : 'Win points'}>{num('win')}</F><F l={ar ? 'نقاط التعادل' : 'Draw points'}>{num('draw')}</F><F l={ar ? 'نقاط الخسارة' : 'Loss points'}>{num('loss')}</F>
    </div>
  );
  return (
    <div className="grid gap-3 rounded-lg border p-3" style={border}>
      {pts}
      {fmt === 'swiss' && <F l={ar ? 'عدد الجولات (فارغ = تلقائي)' : 'Rounds (empty = auto)'}>{num('rounds', String(Math.max(1, Math.ceil(Math.log2(Math.max(2, players))))))}</F>}
      {fmt === 'rr' && chk(ar ? 'دوري مزدوج (ذهاب وإياب)' : 'Double round robin (home & away)', v.double, (b) => set({ double: b }))}
      {fmt === 'ffa' && <>
        <F l={ar ? 'عدد الجولات' : 'Rounds'}>{num('rounds', '3')}</F>
        {chk(ar ? 'الأقل أفضل (مثل الزمن)' : 'Lower is better (e.g. time)', v.low, (b) => set({ low: b }))}
        <p className="text-[.78rem]" style={{ color: 'var(--muted)' }}>{ar ? 'كل لاعب يأخذ رقماً في كل جولة، والمجموع يحدد الترتيب.' : 'Every player gets a number each round; the total decides the ranking.'}</p>
      </>}
      {fmt === 'groups' && <>
        <div className="grid grid-cols-2 gap-2">
          <F l={ar ? 'عدد المجموعات' : 'Groups'}>{num('groups', String(players >= 12 ? 4 : 2))}</F>
          <F l={ar ? 'المتأهلون من كل مجموعة' : 'Advance per group'}>{num('adv', '2')}</F>
        </div>
        <F l={ar ? 'نوع الإقصائيات' : 'Knockout type'}>
          <select className={inpCls} style={style} value={v.ko} onChange={(e) => set({ ko: e.target.value as 'single' | 'double' })}><option value="single">{ar ? 'خروج المغلوب (فردي)' : 'Single elimination'}</option><option value="double">{ar ? 'خروج مزدوج' : 'Double elimination'}</option></select>
        </F>
      </>}
    </div>
  );
}
