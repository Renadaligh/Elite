import type { Localized } from './news';

/**
 * Tournament model + PLACEHOLDER data. Status is NOT stored: it is computed from the dates
 * (upcoming → live → completed), so a tournament moves on its own as time passes.
 * Replace the seed with real data (later: an API, like the news service).
 */
export interface Tournament {
  id: string;
  /** Slug of a game in data/games.ts. */
  gameId: string;
  name: Localized;
  format: Localized;
  /** ISO date-times with offset, e.g. 2026-11-20T18:00:00+03:00. */
  startsAt: string;
  endsAt: string;
  /** Free text so any currency works, e.g. "10,000 SAR". */
  prize: Localized;
  slots: { filled: number; total: number };
  /** solo = one Plato ID; team = team name + captain + members. Default solo. */
  mode?: 'solo' | 'team';
  /** major = a flagship tournament (gets a "Major" badge). Default regular. */
  tier?: 'major' | 'regular';
  /** Optional external registration link. No link → no register button. */
  registerUrl?: string;
  /** Optional cover image (path under /public or full URL). Faded behind the text; no image → plain game-colour card. */
  image?: string;
  /** Completed tournaments: who won. */
  winner?: Localized;
  /** Winner portrait (tall, ~9:16). Path under /public or full URL. */
  /** Names of the winning team's members (team tournaments only). */
  winnerMembers?: string[];
}

export type TournamentStatus = 'live' | 'upcoming' | 'completed';

const L = (en: string, ar: string): Localized => ({ en, ar });

export const TOURNAMENTS_SEED: Tournament[] = [
  { id: 'velocity-trial', gameId: 'velocity', name: L('Velocity Time Trial', 'تحدي الوقت في فيلوسيتي'), format: L('Solo · Fastest lap', 'فردي · أسرع لفة'),
    startsAt: '2026-10-10T18:00:00+03:00', endsAt: '2026-10-20T23:00:00+03:00', prize: L('5,000 SAR', '5,000 ريال'), slots: { filled: 64, total: 64 } },
  { id: 'rift-open', gameId: 'rift-arena', name: L('Rift Arena Open', 'بطولة ريفت أرينا المفتوحة'), format: L('5v5 · Single elimination', '5 ضد 5 · خروج المغلوب'),
    startsAt: '2026-11-20T18:00:00+03:00', endsAt: '2026-11-22T23:00:00+03:00', prize: L('20,000 SAR', '20,000 ريال'), slots: { filled: 18, total: 32 } },
  { id: 'night-invitational', gameId: 'night-raid', name: L('Night Raid Invitational', 'دعوة نايت ريد'), format: L('Squads of 4 · Points', 'سكواد من 4 · نقاط'),
    startsAt: '2026-12-05T19:00:00+03:00', endsAt: '2026-12-05T23:30:00+03:00', prize: L('10,000 SAR', '10,000 ريال'), slots: { filled: 9, total: 25 } },
  { id: 'iron-cup', gameId: 'iron-siege', name: L('Iron Siege Cup', 'كأس آيرن سيج'), format: L('1v1 · Double elimination', '1 ضد 1 · خروج مزدوج'),
    startsAt: '2026-12-19T17:00:00+03:00', endsAt: '2026-12-20T22:00:00+03:00', prize: L('7,500 SAR', '7,500 ريال'), slots: { filled: 0, total: 16 } },
  { id: 'pixel-cozy', gameId: 'pixel-quest', name: L('Pixel Quest Cozy Cup', 'كأس بكسل كويست الهادئ'), format: L('Co-op · Time attack', 'تعاوني · سباق الوقت'),
    startsAt: '2026-09-20T18:00:00+03:00', endsAt: '2026-09-22T22:00:00+03:00', prize: L('3,000 SAR', '3,000 ريال'), slots: { filled: 20, total: 20 }, winner: L('Team Placeholder', 'فريق تجريبي') },
];

export function statusOf(t: Tournament, now: number): TournamentStatus {
  if (now < Date.parse(t.startsAt)) return 'upcoming';
  if (now <= Date.parse(t.endsAt)) return 'live';
  return 'completed';
}

/** Live first, then upcoming (soonest first), then completed (most recent first). */
export function sortTournaments(list: Tournament[], now: number): Tournament[] {
  const rank = { live: 0, upcoming: 1, completed: 2 } as const;
  return [...list].sort((a, b) => {
    const sa = statusOf(a, now), sb = statusOf(b, now);
    if (sa !== sb) return rank[sa] - rank[sb];
    return sa === 'completed' ? Date.parse(b.endsAt) - Date.parse(a.endsAt) : Date.parse(a.startsAt) - Date.parse(b.startsAt);
  });
}

export const tournamentsForGame = (list: Tournament[], gameId: string) => list.filter((t) => t.gameId === gameId);
