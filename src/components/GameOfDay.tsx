import { useEffect, useRef, useState } from 'react';
import type { Game } from '../data/games';
import { useI18n } from '../i18n/I18nProvider';

/** Pips of each die face (3×3 grid cells 1–9). Faces are laid out as a real die: 1 opposite 6, 2 opposite 5, 3 opposite 4. */
const FACES: number[][] = [[5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]];

/** A small 3D die that keeps turning (like the old Plato site); spins fast while "rolling". */
function Die({ rolling }: { rolling: boolean }) {
  return (
    <span aria-hidden="true" className="die-scene">
      <span className={`die-cube ${rolling ? 'is-rolling' : ''}`}>
        {FACES.map((pips, i) => (
          <span key={i} className={`die-face die-f${i + 1}`}>
            {pips.map((c) => <i key={c} style={{ gridArea: `${Math.ceil(c / 3)} / ${((c - 1) % 3) + 1}` }} />)}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Same pick for everyone on a given day (Riyadh date). */
const riyadhDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
function todayIndex(n: number) {
  const day = riyadhDay();
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0;
  return h % n;
}

/** "Game of the day": a turning die beside the Games section. Click → it rolls, then shows today's game (↻ for another one). */
export default function GameOfDay({ games }: { games: Game[] }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<'idle' | 'rolling' | 'open'>('idle');
  const [pick, setPick] = useState<Game | null>(null);
  const [random, setRandom] = useState(false);
  const pickDay = useRef('');
  const timer = useRef<number>();
  const root = useRef<HTMLDivElement>(null);
  const sorted = [...games].sort((a, b) => a.id.localeCompare(b.id));
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Close on Escape / click outside.
  useEffect(() => {
    if (state !== 'open') return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setState('idle'); };
    const out = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setState('idle'); };
    window.addEventListener('keydown', key); window.addEventListener('pointerdown', out);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', out); };
  }, [state]);

  if (!sorted.length) return null;

  const roll = (again: boolean) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let g: Game;
    if (again && sorted.length > 1) {
      do { g = sorted[Math.floor(Math.random() * sorted.length)]; } while (g.id === pick?.id);
    } else g = sorted[todayIndex(sorted.length)];
    setRandom(again);
    setState('rolling');
    window.clearTimeout(timer.current);
    pickDay.current = riyadhDay();
    timer.current = window.setTimeout(() => { setPick(g); setState('open'); }, reduce ? 0 : 1100);
  };

  const onMain = () => { if (state === 'idle') { if (pick && pickDay.current === riyadhDay()) setState('open'); else roll(false); } else if (state === 'open') setState('idle'); };

  return (
    <div ref={root} className="gotd mx-auto mt-5 w-max max-w-full md:absolute md:mt-0 md:top-[clamp(3rem,8vw,6rem)] md:end-[clamp(1.1rem,7vw,6.9rem)] md:z-30">
      <button type="button" onClick={onMain} disabled={state === 'rolling'} aria-expanded={state === 'open'} className="gotd-btn">
        <Die rolling={state === 'rolling'} />
        <span className="text-start">
          <small>{t.gotdLabel}</small>
          <b>{t.gotdRoll}</b>
        </span>
      </button>

      {state === 'open' && pick && (
        <div className="gotd-pop mx-auto mt-3 md:absolute md:end-0 md:top-full md:mt-3 md:mx-0">
          <div className="gotd-cov" style={{ background: `linear-gradient(160deg, ${pick.colors[0]}, ${pick.colors[1]})` }}>
            {pick.image && <img src={pick.image} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />}
          </div>
          <div className="p-4">
            <small className="gotd-tag">{random ? t.gotdRandom : t.gotdLabel}</small>
            <div className="mt-1 text-[1.3rem] font-extrabold leading-tight">{pick.name[lang]}</div>
            <div className="mt-0.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{pick.genre[lang]}</div>
            <div className="mt-3.5 flex items-center gap-2">
              <a href={`#/games/${pick.id}`} className="btn-primary !flex-1 !px-4 !py-2.5 !whitespace-nowrap !text-[.85rem]">{t.gamesDetails}</a>
              {sorted.length > 1 && (
                <button type="button" onClick={() => roll(true)} aria-label={t.gotdAgain} title={t.gotdAgain} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[1.05rem]" style={{ borderColor: 'var(--glass-b)' }}>↻</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
