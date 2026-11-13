/**
 * Hero artwork layers (back → front). A layer is a still image (desktop file + a lighter phone crop).
 * All paths use BASE_URL so they work under any base path.
 * The artwork keeps its empty space on the left and the dice character on the right; the hero copy sits in that empty space on desktop.
 */
export interface ArtLayer {
  id: string;
  src: string;
  srcMobile: string;
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
    src: `${BASE}art/hero-bg.webp`,                // 1672×941, background only (no dice)
    srcMobile: `${BASE}art/hero-bg.webp`,
    depth: 6,
    zoom: 0.03,
    mirrorInLtr: false,
    mirrorInRtl: false,
    pos: { ltr: '70% 40%', rtl: '70% 40%', mobileLtr: '90% 40%', mobileRtl: '90% 40%' },
  },
];

/** The dice is its own transparent image so it can be placed independently on desktop and on phones (and animated later). */
export const HERO_DICE = `${BASE}art/hero-dice.webp`;
export const HERO_BG_NIGHT = `${BASE}art/hero-bg-night.webp`;
