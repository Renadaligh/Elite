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
    src: `${BASE}art/hero-bg.webp`,                // 1672×941, background only (no dice, no floating props)
    srcMobile: `${BASE}art/hero-bg-m.webp`,        // 941×1672 phone version
    depth: 6,
    zoom: 0.03,
    mirrorInLtr: false,
    mirrorInRtl: false,
    pos: { ltr: '70% 40%', rtl: '70% 40%', mobileLtr: '90% 40%', mobileRtl: '90% 40%' },
  },
];

/** Phone backgrounds (941×1672). */
export const HERO_BG_M = `${BASE}art/hero-bg-m.webp`;
export const HERO_BG_M_NIGHT = `${BASE}art/hero-bg-m-night.webp`;

/**
 * Floating props. Positions are centre points + visible width in pixels of the background they sit on
 * (desktop plate 1672×941, phone plate 941×1672); ArtLayers turns them into percentages so they follow the picture at any size.
 */
export interface FloatPiece { id: string; file: string; w: number; h: number; cx: number; cy: number; tw: number; dur: number; delay: number; amp: number }
const piece = (id: string, w: number, h: number, cx: number, cy: number, tw: number, dur: number, delay: number, amp: number): FloatPiece => ({ id, file: `${BASE}art/hp-${id}.webp`, w, h, cx, cy, tw, dur, delay, amp });
export const PIECES_DESKTOP: FloatPiece[] = [
  piece('coin_gold', 281, 231, 110, 200, 100, 6.2, 0, 0.7),
  piece('chip_blue', 238, 176, 118, 310, 76, 5.4, -1.3, 0.6),
  piece('card_diamond', 264, 268, 648, 100, 84, 5.8, -0.6, 0.6),
  piece('king', 296, 435, 1028, 123, 100, 7, -2, 0.7),
  piece('chip_purple', 235, 177, 1459, 60, 100, 6.6, -0.9, 0.6),
  piece('card_clubs', 270, 257, 1576, 160, 96, 5.6, -1.7, 0.7),
];
export const PIECES_PHONE: FloatPiece[] = [
  piece('coin_gold', 281, 231, 103, 188, 130, 6.2, 0, 1.4),
  piece('chip_blue', 238, 176, 85, 319, 100, 5.4, -1.3, 1.2),
  piece('card_diamond', 264, 268, 348, 153, 93, 5.8, -0.6, 1.2),
  piece('king', 296, 435, 656, 184, 107, 7, -2, 1.4),
  piece('chip_purple', 235, 177, 823, 81, 133, 6.6, -0.9, 1.2),
  piece('card_clubs', 270, 257, 855, 270, 125, 5.6, -1.7, 1.4),
];
/** Dice art (900×820): left/top/visible width in the same plate pixels. */
export const DICE_DESKTOP = { x: 1180, y: 163, w: 288, dur: 7.4, amp: 1.1 };
export const DICE_PHONE = { x: 303, y: 261, w: 324, dur: 7.4, amp: 2.2 };

/** The dice is its own transparent image so it can be placed independently on desktop and on phones (and animated later). */
export const HERO_DICE = `${BASE}art/hero-dice.webp`;
export const HERO_BG_NIGHT = `${BASE}art/hero-bg-night.webp`;
