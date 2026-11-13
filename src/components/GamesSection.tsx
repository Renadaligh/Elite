import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { SHOW_EXAMPLE_GAMES, type Game } from '../data/games';
import { useSiteGames } from '../hooks/useGames';
import GameOfDay from './GameOfDay';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowIcon } from './icons';

const BASE = import.meta.env.BASE_URL;

function OfficialGameImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? <div className="gcard-art" /> : (
    <img src={src} alt="" draggable={false} loading="lazy" onError={() => setFailed(true)} className={`absolute inset-0 h-full w-full object-cover ${/^https?:/.test(src) ? 'scale-[1.35] origin-center' : 'object-top'}`} />
  );
}

type Vars = CSSProperties & { [k: `--${string}`]: string };

function useWide() {
  const q = '(min-width: 768px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

/** Fan-style carousel: active game in the centre, neighbours tilt and shrink. Swipe / drag / arrows / click a side card.
 *  Clicking the centre card fades the section out and opens the game page (#/games/<id>). */
export default function GamesSection() {
  const { t, lang, dir } = useI18n();
  const GAMES = useSiteGames();
  const wide = useWide();
  const [index, setIndex] = useState(0);
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => {
    const found = new Map<string, { en: string; ar: string }>();
    GAMES.forEach((g) => found.set(g.genre.en, g.genre));
    return [...found.values()];
  }, [GAMES]);
  const games = useMemo(() => category === 'all' ? GAMES : GAMES.filter(g => g.genre.en === category), [category, GAMES]);
  const chooseCategory = (id: string) => { setCategory(id); setIndex(0); setLeaving(false); };
  const [leaving, setLeaving] = useState(false);
  const sign = dir === 'rtl' ? -1 : 1;
  const span = wide ? 2 : 1;
  const n = games.length;
  const timer = useRef<number>();
  const drag = useRef({ x: 0, down: false, moved: false });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const go = (g: Game) => {
    if (leaving) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const open = () => { window.location.hash = `#/games/${g.id}`; };
    if (reduce) { open(); return; }
    setLeaving(true);
    timer.current = window.setTimeout(open, 320);
  };
  const step = (d: number) => setIndex((i) => Math.min(n - 1, Math.max(0, i + d)));

  const onDown = (e: PointerEvent) => { drag.current = { x: e.clientX, down: true, moved: false }; };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (d.down && Math.abs(e.clientX - d.x) > 8) d.moved = true;
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 40) step(dx * sign < 0 ? 1 : -1);
    window.setTimeout(() => { d.moved = false; }, 0);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') step(sign);
    else if (e.key === 'ArrowLeft') step(-sign);
    else return;
    e.preventDefault();
  };

  const cw = wide ? 'clamp(210px, 19vw, 290px)' : 'min(60vw, 250px)';
  const stage: Vars = { '--cw': cw, '--wm': `url(${BASE}brand/cube.png)`, height: 'calc(var(--cw) * 1.4 + 2.5rem)' };
  const active = games[index];

  return (
    <section id="games" aria-labelledby="games-title" className="relative scroll-mt-20 overflow-x-clip px-[clamp(1.1rem,7vw,6.9rem)] py-[clamp(3rem,8vw,6rem)]" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="mx-auto max-w-[40rem] text-center">
        <h2 id="games-title" className="font-display text-[clamp(1.8rem,4vw,3.2rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{t.gamesTitle}</h2>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>{t.gamesSub}</p>
      </div>

      <div className="mx-auto mt-7 flex max-w-[65rem] flex-wrap items-center justify-center gap-2" role="group" aria-label={lang === 'ar' ? 'تصفية الألعاب حسب التصنيف' : 'Filter games by category'}>
        {[{en: 'All', ar: 'الكل'}, ...categories].map((c, i) => {
          const id = i === 0 ? 'all' : c.en;
          const selected = category === id;
          return <button key={id} type="button" aria-pressed={selected} onClick={() => chooseCategory(id)}
            className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200"
            style={{ borderColor: selected ? '#9a88ff' : 'var(--glass-b)', color: selected ? '#fff' : 'var(--muted)',
              background: selected ? 'linear-gradient(115deg,#7a4dff,#2a2fa8)' : 'var(--glass)' }}>
            {c[lang]} <span className="ms-1 opacity-70">{i === 0 ? GAMES.length : GAMES.filter(g => g.genre.en === id).length}</span>
          </button>;
        })}
      </div>

      <GameOfDay games={GAMES} />

      <div className={`gstage mt-7 ${leaving ? 'is-leaving' : ''}`}>
        <div role="region" aria-roledescription="carousel" aria-label={t.gamesTitle} tabIndex={0} onKeyDown={onKey}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          className="relative mx-auto w-full max-w-[72rem] touch-pan-y rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--link-on)]" style={stage}>
          {games.map((g, i) => {
            const o = i - index;
            const a = Math.abs(o);
            const shown = a <= span;
            const c = Math.min(a, span + 1) * Math.sign(o);
            const x = sign * c * 0.6, y = Math.pow(Math.abs(c), 1.6) * 0.075, rot = sign * c * 7, sc = 1 - Math.abs(c) * 0.09;
            const style: Vars = {
              transform: `translateX(calc(-50% + var(--cw) * ${x})) translateY(calc(var(--cw) * ${y})) rotate(${rot}deg) scale(${sc})`,
              zIndex: 10 - a, opacity: shown ? 1 : 0, pointerEvents: shown ? 'auto' : 'none',
              filter: o === 0 ? 'none' : 'var(--card-dim)',
              background: `linear-gradient(160deg, ${g.colors[0]}, ${g.colors[1]})`,
            };
            return (
              <a key={g.id} href={`#/games/${g.id}`} draggable={false} aria-hidden={!shown || undefined} tabIndex={o === 0 ? 0 : -1}
                aria-label={`${g.name[lang]} — ${o === 0 ? t.gamesDetails : g.genre[lang]}`} className="gcard" style={style}
                onClick={(e: MouseEvent) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  if (drag.current.moved) return;
                  if (o === 0) go(g); else setIndex(i);
                }}>
                {g.image ? <OfficialGameImage key={g.id} src={g.image} /> : <div className="gcard-art" />}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{background:'linear-gradient(to top, rgba(7,10,38,.92) 0%,rgba(7,10,38,.7) 16%,rgba(7,10,38,.25) 40%,transparent 66%)'}} />
                <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-white sm:p-5">
                  <span className="text-[.78rem] font-semibold opacity-85">{g.genre[lang]}</span>
                  <div className="text-[clamp(1.15rem,1.8vw,1.55rem)] font-extrabold leading-tight">{g.name[lang]}</div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mx-auto mt-6 max-w-[34rem] text-center" aria-live="polite">
          <h3 className="text-[1.5rem] font-bold">{active.name[lang]}</h3>
          <p className="mt-1.5" style={{ color: 'var(--muted)' }}>{active.tagline[lang]}</p>
          <button type="button" className="btn-primary mt-5" onClick={() => go(active)}>
            {t.gamesDetails} <ArrowIcon className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button type="button" className="pill !px-0 disabled:opacity-35" onClick={() => step(-1)} disabled={index === 0} aria-label={t.gamesPrev}><ArrowIcon className="h-5 w-5 rotate-180 rtl:rotate-0" /></button>
          <div className="flex gap-2">
            {games.length <= 12 ? games.map((g, i) => (
              <button key={g.id} type="button" aria-label={g.name[lang]} aria-current={i === index} onClick={() => setIndex(i)} className="h-2 rounded-full transition-all" style={{ width: i === index ? '1.6rem' : '.5rem', background: i === index ? 'var(--link-on)' : 'var(--glass-b)' }} />
            )) : <span className="min-w-[5rem] text-center text-sm font-semibold tabular-nums" style={{color:'var(--muted)'}}>{index + 1} / {n}</span>}
          </div>
          <button type="button" className="pill !px-0 disabled:opacity-35" onClick={() => step(1)} disabled={index === n - 1} aria-label={t.gamesNext}><ArrowIcon className="h-5 w-5 rtl:rotate-180" /></button>
        </div>
      </div>

      {SHOW_EXAMPLE_GAMES && <p className="mt-6 text-center text-[.8rem]" style={{ color: 'var(--muted)', opacity: 0.75 }}>{t.gamesExample}</p>}
    </section>
  );
}
