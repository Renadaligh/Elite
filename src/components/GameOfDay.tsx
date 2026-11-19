import { go as navTo } from '../hooks/nav';
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

/** Random game: a turning die beside the Games section. Click → it rolls, then opens a random game's page directly. */
export default function GameOfDay({ games }: { games: Game[] }) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'rolling'>('idle');
  const [pick, setPick] = useState<Game | null>(null);
  const timer = useRef<number>();
  const sorted = [...games].sort((a, b) => a.id.localeCompare(b.id));
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!sorted.length) return null;

  const roll = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let g: Game;
    do { g = sorted[Math.floor(Math.random() * sorted.length)]; } while (sorted.length > 1 && g.id === pick?.id);
    setState('rolling');
    window.clearTimeout(timer.current);
    // The die rolls for a moment, then we go straight to the game's page (no preview card).
    timer.current = window.setTimeout(() => { setPick(g); setState('idle'); navTo(`/games/${g.id}`); }, reduce ? 0 : 1100);
  };

  const onMain = () => { window.clearTimeout(timer.current); if (state === 'idle') roll(); };

  return (
    <div className="gotd mx-auto mt-5 w-max max-w-full">
      <button type="button" onClick={onMain} disabled={state === 'rolling'} className="gotd-btn">
        <Die rolling={state === 'rolling'} />
        <span className="text-start">
          <small>{t.gotdLabel}</small>
          <b>{t.gotdRoll}</b>
        </span>
      </button>
    </div>
  );
}
