import type { Dict } from '../i18n/translations';

/** Header navigation. Every href is a real in-page target (sections live in App.tsx). */
export const NAV: { href: string; key: keyof Dict }[] = [
  { href: '#top', key: 'navHome' },
  { href: '#news', key: 'navNews' },
  { href: '#games', key: 'navGames' },
  { href: '#tournaments', key: 'navTournaments' },
  // { href: '#leaderboard', key: 'navLeaderboard' }, // add with SHOW_LEADERBOARD
  // { href: '#/bracket', key: 'navBracket' }, // hidden for now (reachable from the sign-in icon)
  // { href: '#community', key: 'navCommunity' }, // hidden for now
  // { href: '#support', key: 'navSupport' }, // hidden for now
];

/** Official site name per language. */
export const BRAND = { en: 'Plato AR', ar: 'بلاتو بالعربية' } as const;

/** Social links shown in the footer. Leave a url empty to hide that icon (Instagram: add the link once the account exists). */
export const SOCIALS = {
  discord: 'https://discord.gg/platoar',
  instagram: '',
} as const;

/** Support Us: the store that funds the community. */
export const STORE = { url: 'https://unlimited-blue.com', name: 'Unlimited Blue' } as const;

/** Top-3 leaderboard section on the home page. Built but hidden for now: set to true to show it. */
export const SHOW_LEADERBOARD = false;
