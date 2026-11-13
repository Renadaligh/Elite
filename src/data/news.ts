/**
 * News content model + placeholder data.
 * Every field that is shown to visitors exists per language, so Arabic and English can differ freely.
 * The section reads through `services/newsService.ts`, so swapping this file for a real API
 * (Cloudflare Worker + D1) later does not touch any component.
 */
export type Lang = 'en' | 'ar';
export type Localized = Record<Lang, string>;
export type NewsTag = 'update' | 'tournament' | 'community' | 'event';

export interface NewsItem {
  id: string;
  /** ISO date, YYYY-MM-DD. The section sorts by this, newest first. */
  date: string;
  tag: NewsTag;
  title: Localized;
  summary: Localized;
  /** Optional cover image (path under /public or full URL). Without one the card shows the branded panel. */
  image?: string;
  /** Optional link to the full story. Cards without it are not clickable. */
  href?: string;
}

export const NEWS_SEED: NewsItem[] = [
  { id: 'n1', date: '2026-10-12', tag: 'event',
    title: { en: 'Elite community night: details coming soon', ar: 'ليلة مجتمع ايليت: التفاصيل قريباً' },
    summary: { en: 'Placeholder news item. Replace this with the real announcement text.', ar: 'خبر تجريبي. استبدل هذا بنص الإعلان الحقيقي.' } },
  { id: 'n2', date: '2026-10-08', tag: 'tournament',
    title: { en: 'Tournament announcement placeholder', ar: 'إعلان بطولة تجريبي' },
    summary: { en: 'A short summary of the tournament goes here.', ar: 'هنا ملخص قصير عن البطولة.' } },
  { id: 'n3', date: '2026-10-03', tag: 'update',
    title: { en: 'Platform update placeholder', ar: 'تحديث تجريبي للمنصة' },
    summary: { en: 'What changed and why it matters to players.', ar: 'ما الذي تغيّر ولماذا يهم اللاعبين.' } },
  { id: 'n4', date: '2026-09-27', tag: 'community',
    title: { en: 'Community highlight placeholder', ar: 'إبراز تجريبي من المجتمع' },
    summary: { en: 'Shout-outs, new members, or a story from the community.', ar: 'تحية لأعضاء المجتمع أو قصة منهم.' } },
  { id: 'n5', date: '2026-09-20', tag: 'update',
    title: { en: 'Another update placeholder', ar: 'تحديث تجريبي آخر' },
    summary: { en: 'Keep summaries to one or two lines.', ar: 'اجعل الملخص سطراً أو سطرين.' } },
];
