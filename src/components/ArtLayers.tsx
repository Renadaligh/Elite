import type { CSSProperties } from 'react';
import { HERO_BG_NIGHT, HERO_DICE, LAYERS } from '../config/artwork';
import { useI18n } from '../i18n/I18nProvider';

type Vars = CSSProperties & { [k: `--${string}`]: string | number };

/** Parallax (outer) → scroll zoom (data-art-scroll) → entrance (data-anim=art) → image. */
export default function ArtLayers() {
  const { dir, t } = useI18n();
  const rtl = dir === 'rtl';
  return (
    <div className="absolute inset-0" role="img" aria-label={t.artAlt}>
      {LAYERS.map((l) => {
        const vars: Vars = {
          '--art': `url(${l.src})`,
          '--art-m': `url(${l.srcMobile})`,
          '--flip': (rtl ? l.mirrorInRtl : l.mirrorInLtr) ? -1 : 1,
          '--pos': rtl ? l.pos.rtl : l.pos.ltr,
          '--pos-m': rtl ? l.pos.mobileRtl : l.pos.mobileLtr,
        };
        return (
          <div key={l.id} className="art-layer" style={{ '--d': l.depth } as Vars}>
            <div data-art-scroll className="absolute inset-0">
              <div data-anim="art" className="absolute inset-0">
                <div className="hero-art" style={vars}>
                  <div className="hero-stage">
                    <div className="hero-plate">
                      <img src={l.src} alt="" draggable={false} />
                      <img className="hero-night" src={HERO_BG_NIGHT} alt="" draggable={false} />
                    </div>
                    <img className="hero-dice" src={HERO_DICE} alt="" draggable={false} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
