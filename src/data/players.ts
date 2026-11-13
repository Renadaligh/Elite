import type { Localized } from './news';

/**
 * Pro players + PLACEHOLDER data. A player belongs to one or more games (gameIds, slugs from data/games.ts),
 * which are the "categories" used by the filter and by each game page ("Related pro players").
 */
export interface Player {
  id: string;
  /** In-game name, shown big. */
  nickname: string;
  /** Optional real name, per language. */
  name?: Localized;
  gameIds: string[];
  /** Big vertical word on the card. Keep it short (one word reads best). */
  role: Localized;
  /** Small label above the number, e.g. Captain / Pro. */
  rank: Localized;
  /** Short motto shown at the bottom of the card. */
  quote?: Localized;
  team?: string;
  country?: Localized;
  /** Number of titles / trophies. */
  titles: number;
  /** Optional portrait: a transparent PNG cut-out (path under /public or URL). Without one the card shows a placeholder silhouette. */
  image?: string;
  /** Optional links: only the ones given are shown. */
  links?: { x?: string; twitch?: string; youtube?: string };
}

/** Set to false once real players replace the placeholders below. */
export const SHOW_EXAMPLE_PLAYERS = true;

const L = (en: string, ar: string): Localized => ({ en, ar });

export const PLAYERS_SEED: Player[] = [
  { id: 'p1', nickname: 'Player One', name: L('Placeholder name', 'اسم تجريبي'), gameIds: ['rift-arena'], role: L('Captain', 'القائد'), rank: L('Team captain', 'قائد الفريق'), quote: L('Lead from the front, and the team follows.', 'قُد من الأمام ويتبعك الفريق.'), team: 'Team Alpha', country: L('Saudi Arabia', 'السعودية'), titles: 6 },
  { id: 'p2', nickname: 'Player Two', gameIds: ['rift-arena'], role: L('Entry', 'المهاجم'), rank: L('Pro', 'محترف'), quote: L('First in, no hesitation.', 'أول من يدخل بلا تردد.'), team: 'Team Alpha', country: L('Saudi Arabia', 'السعودية'), titles: 4 },
  { id: 'p3', nickname: 'Player Three', gameIds: ['night-raid'], role: L('Leader', 'الزعيم'), rank: L('Squad leader', 'قائد السكواد'), quote: L('A calm squad wins late circles.', 'الفريق الهادئ يفوز في الدوائر الأخيرة.'), team: 'Team Bravo', country: L('UAE', 'الإمارات'), titles: 5 },
  { id: 'p4', nickname: 'Player Four', gameIds: ['night-raid', 'rift-arena'], role: L('Flex', 'المرن'), rank: L('Pro', 'محترف'), quote: L('Adapt faster than the match changes.', 'تأقلم أسرع من تغيّر المباراة.'), country: L('Kuwait', 'الكويت'), titles: 3 },
  { id: 'p5', nickname: 'Player Five', gameIds: ['velocity'], role: L('Racer', 'السائق'), rank: L('Champion', 'بطل'), quote: L('Every lap is a new record.', 'كل لفة رقم قياسي جديد.'), team: 'Team Charlie', country: L('Saudi Arabia', 'السعودية'), titles: 8 },
  { id: 'p6', nickname: 'Player Six', gameIds: ['iron-siege'], role: L('Tactician', 'المخطط'), rank: L('Pro', 'محترف'), quote: L('Patience breaks every wall.', 'الصبر يكسر كل جدار.'), country: L('Jordan', 'الأردن'), titles: 2 },
  { id: 'p7', nickname: 'Player Seven', gameIds: ['velocity', 'iron-siege'], role: L('Allround', 'الشامل'), rank: L('Rising', 'صاعد'), quote: L('Learn every game, master one.', 'تعلّم كل لعبة وأتقن واحدة.'), team: 'Team Charlie', country: L('Bahrain', 'البحرين'), titles: 1 },
];

/** Strongest first. */
export const byTitles = (a: Player, b: Player) => b.titles - a.titles;
export const playersForGame = (gameId: string) => PLAYERS_SEED.filter((p) => p.gameIds.includes(gameId)).sort(byTitles);
