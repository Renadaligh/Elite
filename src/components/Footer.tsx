import { useI18n } from '../i18n/I18nProvider';
import { BRAND, SOCIALS } from '../config/site';
import { DiscordIcon, InstagramIcon } from './icons';

/** Discord link in the footer is hidden for now — set to true to show it again. */
const SHOW_DISCORD = false;

export default function Footer() {
  const { t, lang } = useI18n();
  const y = new Date().getFullYear();
  const yr = lang === 'ar' ? new Intl.NumberFormat('ar-SA-u-nu-latn', { useGrouping: false }).format(y) : String(y);
  return (
    <footer className="border-t px-[clamp(1.1rem,7vw,6.9rem)] py-8 text-center" style={{ background: 'var(--bg)', borderColor: 'var(--glass-b)' }}>
      <nav aria-label="Social" className="mb-5 flex justify-center gap-3">
        {([['Discord', SHOW_DISCORD ? SOCIALS.discord : '', DiscordIcon], ['Instagram', SOCIALS.instagram, InstagramIcon]] as const)
          .filter(([, url]) => url)
          .map(([name, url, Icon]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}
              className="grid h-11 w-11 place-items-center rounded-full border transition duration-200 hover:-translate-y-0.5 hover:text-[var(--link-on)]"
              style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
              <Icon className="h-5 w-5" />
            </a>
          ))}
      </nav>
      <p className="text-[.95rem] font-semibold">
        © {yr} <bdi>{BRAND[lang]}</bdi> · {t.footRights}
      </p>
      <p className="mx-auto mt-2 max-w-[44rem] text-[.8rem] leading-relaxed" style={{ color: 'var(--muted)' }}>{t.footNote}</p>
    </footer>
  );
}
