import { useI18n } from '../i18n/I18nProvider';

/**
 * Hero copy. Phones: centred under the artwork. Desktop: a block in the artwork's empty side (left in English, right in
 * Arabic where the picture is mirrored); the main button on its own row, the two others side by side below it. The name is plain text for now (animation comes later). Copy lives in i18n (heroSub).
 */
export default function HeroContent() {
  const { t, lang } = useI18n();
  return (
    <div className="hero-copy mx-auto flex w-full max-w-[40rem] flex-col items-center text-center md:w-fit md:max-w-none">
      <h1 dir="ltr" className="hero-name" aria-label="Plato AR"><img src={`${import.meta.env.BASE_URL}brand/plato-ar-white.png`} alt="" draggable={false} /></h1>
      <p className="hero-desc">{t.heroSub}</p>
      <div aria-hidden="true" className="hero-gap" />
      <div className="hero-cta">
        <a href="#/bracket" className="hero-main">
          <svg className="hm-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 5h6v5H3zM3 14h6v5H3zM15 9.5h6v5h-6zM9 7.5h3v9M12 12h3" /></svg>
          <span>{lang === 'ar' ? 'جرّب أداة تنظيم البطولات' : 'Try the Bracket Tool'}</span>
        </a>
        <a href="#tournaments" className="hero-sec">{t.ctaTournaments}</a>
        <a href="#games" className="hero-sec">{t.ctaGames}</a>
      </div>
    </div>
  );
}
