import { useI18n } from '../i18n/I18nProvider';

/**
 * Centered block that sits right under the "ELITE" wordmark baked into the hero video.
 * Ink is dark because the video's centre is white fog. Copy lives in i18n (heroSub).
 */
export default function HeroContent() {
  const { t, lang } = useI18n();
  return (
    <div className="hero-copy hero-ink mx-auto flex max-w-[40rem] flex-col items-center text-center">
      <h1 className="sr-only">{t.brand}</h1>
      <p className="hero-desc mb-6 text-[clamp(.98rem,1.3vw,1.2rem)] leading-[1.75]">{t.heroSub}</p>
      <div className="hero-cta">
        <a href="#/bracket" className="hero-main">
          <svg className="hm-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 5h6v5H3zM3 14h6v5H3zM15 9.5h6v5h-6zM9 7.5h3v9M12 12h3" /></svg>
          <span>{lang === 'ar' ? 'جرّب أداة البراكت' : 'Try the Bracket Tool'}</span>
        </a>
        <div className="hero-row">
          <a href="#games" className="hero-sec">{t.navGames}</a>
          <a href="#tournaments" className="hero-sec">{t.navTournaments}</a>
        </div>
      </div>
    </div>
  );
}
