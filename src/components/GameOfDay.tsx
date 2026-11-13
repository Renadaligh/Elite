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

/** Random game: a turning die beside the Games section. Click → it rolls, shows the pick for two seconds, then opens that game's page by itself. */
export default function GameOfDay({ games }: { games: Game[] }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<'idle' | 'rolling' | 'open'>('idle');
  const [pick, setPick] = useState<Game | null>(null);
  const timer = useRef<number>();
  const root = useRef<HTMLDivElement>(null);
  const sorted = [...games].sort((a, b) => a.id.localeCompare(b.id));
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Close on Escape / click outside.
  useEffect(() => {
    if (state !== 'open') return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { window.clearTimeout(timer.current); setState('idle'); } };
    const out = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) { window.clearTimeout(timer.current); setState('idle'); } };
    window.addEventListener('keydown', key); window.addEventListener('pointerdown', out);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', out); };
  }, [state]);

  if (!sorted.length) return null;

  const roll = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let g: Game;
    do { g = sorted[Math.floor(Math.random() * sorted.length)]; } while (sorted.length > 1 && g.id === pick?.id);
    setState('rolling');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPick(g); setState('open');
      // Show the result for two seconds, then go straight to the game page.
      timer.current = window.setTimeout(() => { setState('idle'); window.location.hash = `#/games/${g.id}`; }, reduce ? 800 : 2000);
    }, reduce ? 0 : 1100);
  };

  const onMain = () => { window.clearTimeout(timer.current); if (state === 'idle') roll(); else if (state === 'open') setState('idle'); };

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
            {pick.image ? <img src={pick.image} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" /> : <span aria-hidden="true" className="relative block h-full w-full" style={{ background: `url(${import.meta.env.BASE_URL}brand/cube-v2.png) 50% 50% / 52% no-repeat` }} />}
          </div>
          <div className="p-4">
            <small className="gotd-tag">{t.gotdRandom}</small>
            <div className="mt-1 text-[1.3rem] font-extrabold leading-tight">{pick.name[lang]}</div>
            <div className="mt-0.5 text-[.85rem]" style={{ color: 'var(--muted)' }}>{pick.genre[lang]}</div>
            <div className="mt-3.5 flex items-center gap-2">
              <a href={`#/games/${pick.id}`} className="btn-primary !flex-1 !px-4 !py-2.5 !whitespace-nowrap !text-[.85rem]">{t.gamesDetails}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
