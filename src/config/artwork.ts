/**
 * Hero artwork layers (back → front). A layer is either a still image or a looping video.
 * Video layers use `src` as the poster (shown before playback and for reduced-motion users).
 * All paths use BASE_URL so they work under any base path.
 * The footage has no wordmark: <EliteWordmark/> draws it on top (aligned to the footage), so the layer is never mirrored.
 */
export interface ArtLayer {
  id: string;
  src: string;
  video?: { webm: string; mp4: string; mobile?: { webm: string; mp4: string } };
  depth: number;                                 // pointer-parallax px
  zoom: number;                                  // extra scale at the end of the scroll transition
  mirrorInLtr: boolean;
  mirrorInRtl: boolean;
  pos: { ltr: string; rtl: string; mobileLtr: string; mobileRtl: string };
}

const BASE = import.meta.env.BASE_URL;

export const LAYERS: ArtLayer[] = [
  {
    id: 'scene',
    src: `${BASE}art/hero-scene.webp`,
    video: {
      webm: `${BASE}art/hero-scene.webm`, mp4: `${BASE}art/hero-scene.mp4`,                 // 1920×1080
      mobile: { webm: `${BASE}art/hero-scene-m.webm`, mp4: `${BASE}art/hero-scene-m.mp4` }, // 1280×720 for phones
    },
    depth: 0,      // keep static: the wordmark overlay must stay aligned with the footage
    zoom: 0.03,
    mirrorInLtr: false,
    mirrorInRtl: false,
    pos: { ltr: '50% 50%', rtl: '50% 50%', mobileLtr: '46% 50%', mobileRtl: '46% 50%' },
  },
];
