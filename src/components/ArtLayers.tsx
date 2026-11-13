import { useEffect, useState, type CSSProperties } from 'react';
import { DICE_DESKTOP, DICE_PHONE, HERO_BG_M, HERO_BG_M_NIGHT, HERO_BG_NIGHT, HERO_DICE, LAYERS, PIECES_DESKTOP, PIECES_PHONE, type FloatPiece } from '../config/artwork';
import { useI18n } from '../i18n/I18nProvider';

type Vars = CSSProperties & { [k: `--${string}`]: string | number };

function usePhone() {
  const q = '(max-width: 767px)';
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

/** One floating prop, placed in percentages of the picture it sits on. */
function Float({ p, W, H, phone }: { p: FloatPiece; W: number; H: number; phone: boolean }) {
  const dw = (p.w * p.tw) / (p.w - 28);
  const dh = (p.h * dw) / p.w;
  const st: Vars = { left: `${((p.cx - dw / 2) / W) * 100}%`, top: phone ? `calc(var(--pw) * ${(p.cy - dh / 2) / W})` : `${((p.cy - dh / 2) / H) * 100}%`, width: `${(dw / W) * 100}%`, '--dur': `${p.dur}s`, '--del': `${p.delay}s`, '--amp': p.amp };
  return <img className="hs-float" src={p.file} alt="" draggable={false} style={st} />;
}

/** Parallax (outer) → scroll zoom (data-art-scroll) → entrance (data-anim=art) → picture with its floating props. */
export default function ArtLayers() {
  const { t } = useI18n();
  const phone = usePhone();
  const W = phone ? 941 : 1672;
  const H = phone ? 1672 : 941;
  const pieces = phone ? PIECES_PHONE : PIECES_DESKTOP;
  const dice = phone ? DICE_PHONE : DICE_DESKTOP;
  const day = phone ? HERO_BG_M : LAYERS[0].src;
  const night = phone ? HERO_BG_M_NIGHT : HERO_BG_NIGHT;
  const diceSt: Vars = { left: `${(dice.x / W) * 100}%`, top: phone ? `calc(var(--pw) * ${dice.y / W})` : `${(dice.y / H) * 100}%`, width: `${(dice.w / W) * 100}%`, '--dur': `${dice.dur}s`, '--del': '-1s', '--amp': dice.amp };
  return (
    <div className="absolute inset-0" role="img" aria-label={t.artAlt}>
      <div className="art-layer" style={{ '--d': LAYERS[0].depth } as Vars}>
        <div data-art-scroll className="absolute inset-0">
          <div data-anim="art" className="absolute inset-0">
            <div className="hs">
              <div className={`hs-stage ${phone ? 'hs-m' : 'hs-d'}`}>
                <div className="hs-plate">
                  {phone ? (
                    [day, night].map((src, i) => (
                      <div key={i} className={`hs-bg hs-slices${i ? ' hs-night' : ''}`} style={{ '--src': `url(${src})` } as Vars}>
                        <i className="hs-top" /><i className="hs-mid" /><i className="hs-bot" />
                      </div>
                    ))
                  ) : (
                    <>
                      <img className="hs-bg" src={day} alt="" draggable={false} />
                      <img className="hs-bg hs-night" src={night} alt="" draggable={false} />
                    </>
                  )}
                  {pieces.map((p) => <Float key={p.id} p={p} W={W} H={H} phone={phone} />)}
                  <img className="hs-float hs-dice" src={HERO_DICE} alt="" draggable={false} style={diceSt} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
