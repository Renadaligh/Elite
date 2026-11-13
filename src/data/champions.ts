import type { Localized } from './news';

/**
 * Champions = winners of Plato tournaments (online / Discord), so no real-life photos are needed.
 * The card shows the champion's handle big, the tournament they won, the game and the year.
 * Artwork is optional and comes in two flavours; with neither, the card shows a trophy.
 */
export interface Champion {
  id: string;
  /** Handle (Plato / Discord name). It is the big vertical word on the card, so shorter reads better. */
  name: string;
  /** Slug of a game in data/games.ts. */
  gameId: string;
  /** The tournament that was won. */
  tournament: Localized;
  /** ISO date of the win, YYYY-MM-DD. The list is sorted by it, newest first. */
  date: string;
  prize?: Localized;
  /** Optional short line. */
  quote?: Localized;
  /** Optional avatar (Discord / Plato profile picture, square). Shown as a round badge. */
  avatar?: string;
  /** Optional transparent PNG artwork shown on the right of the card instead of the trophy. */
  image?: string;
}

/** Set to false once real champions replace the placeholders below. */
export const SHOW_EXAMPLE_CHAMPIONS = true;

const L = (en: string, ar: string): Localized => ({ en, ar });

export const CHAMPIONS_SEED: Champion[] = [
  { id: 'c1', name: 'Falcon', gameId: 'rift-arena', tournament: L('Rift Arena Open — Season 1', 'بطولة ريفت أرينا المفتوحة — الموسم 1'), date: '2026-09-28', prize: L('20,000 SAR', '20,000 ريال'), quote: L('Lead from the front.', 'قُد من الأمام.') },
  { id: 'c2', name: 'Nova', gameId: 'night-raid', tournament: L('Night Raid Invitational', 'دعوة نايت ريد'), date: '2026-09-14', prize: L('10,000 SAR', '10,000 ريال') },
  { id: 'c3', name: 'Raven', gameId: 'velocity', tournament: L('Velocity Time Trial', 'تحدي الوقت في فيلوسيتي'), date: '2026-08-30', prize: L('5,000 SAR', '5,000 ريال'), quote: L('Every lap is a new record.', 'كل لفة رقم قياسي جديد.') },
  { id: 'c4', name: 'Ghost', gameId: 'iron-siege', tournament: L('Iron Siege Cup', 'كأس آيرن سيج'), date: '2026-08-16', prize: L('7,500 SAR', '7,500 ريال') },
  { id: 'c5', name: 'Orbit', gameId: 'pixel-quest', tournament: L('Pixel Quest Cozy Cup', 'كأس بكسل كويست الهادئ'), date: '2026-07-22', prize: L('3,000 SAR', '3,000 ريال') },
  { id: 'c6', name: 'Titan', gameId: 'rift-arena', tournament: L('Rift Arena Community Night', 'ليلة المجتمع في ريفت أرينا'), date: '2026-07-04' },
];

export const newestFirst = (a: Champion, b: Champion) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
export const championsForGame = (gameId: string) => CHAMPIONS_SEED.filter((c) => c.gameId === gameId).sort(newestFirst);
