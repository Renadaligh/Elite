import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LAYERS, type ArtLayer } from '../config/artwork';
import { useI18n } from '../i18n/I18nProvider';
import EliteWordmark from './EliteWordmark';

type Vars = CSSProperties & { [k: `--${string}`]: string | number };

/** Looping muted video (no audio track). Pauses off-screen; reduced-motion users only see the poster. */
function ArtVideo({ layer, style }: { layer: ArtLayer; style: Vars }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Phones get the lighter 1280-wide file (picked once on load; the <video> key reloads it if the choice changes).
  const [phone] = useState(() => matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const v = ref.current;
    if (!v || reduce) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) void v.play().catch(() => undefined); else v.pause(); });
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  if (!layer.video) return null;
  const src = phone && layer.video.mobile ? layer.video.mobile : layer.video;
  return (
    <video key={src.mp4} ref={ref} className="art-video" style={style} poster={layer.src} muted loop playsInline preload="auto" autoPlay={!reduce} aria-hidden="true">
      <source src={src.webm} type="video/webm" />
      <source src={src.mp4} type="video/mp4" />
    </video>
  );
}

/** Parallax (outer) → scroll zoom (data-art-scroll) → entrance (data-anim=art) → media. */
export default function ArtLayers() {
  const { dir, t } = useI18n();
  const rtl = dir === 'rtl';
  return (
    <div className="absolute inset-0" role="img" aria-label={t.artAlt}>
      {LAYERS.map((l) => {
        const vars: Vars = {
          '--art': `url(${l.src})`,
          '--flip': (rtl ? l.mirrorInRtl : l.mirrorInLtr) ? -1 : 1,
          '--pos': rtl ? l.pos.rtl : l.pos.ltr,
          '--pos-m': rtl ? l.pos.mobileRtl : l.pos.mobileLtr,
        };
        return (
          <div key={l.id} className="art-layer" style={{ '--d': l.depth } as Vars}>
            <div data-art-scroll className="absolute inset-0">
              <div data-anim="art" className="absolute inset-0">
                {l.video ? <><ArtVideo layer={l} style={vars} /><EliteWordmark /></> : <div className="art-img" style={vars} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
