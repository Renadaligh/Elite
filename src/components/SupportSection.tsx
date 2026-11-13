import type { ReactNode } from 'react';
import { STORE } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import SectionShell from './SectionShell';

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const, className: 'h-7 w-7' };
const PrintIcon = <svg {...svg}><path d="M12 3 4.5 7v8L12 19l7.5-4V7L12 3Z" /><path d="M4.5 7 12 11l7.5-4M12 11v8" /></svg>;
const EngraveIcon = <svg {...svg}><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" /><path d="M14.5 6.5l3 3" /></svg>;
const LaserIcon = <svg {...svg}><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>;

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className="flex flex-col items-center gap-3 rounded-2xl border px-3 py-5 text-center transition-transform duration-300 hover:-translate-y-1" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,#3d7bff,#5b5ff0)', boxShadow: '0 12px 24px -12px rgba(61,123,255,.9)' }}>{icon}</span>
      <span className="text-[.95rem] font-semibold">{label}</span>
    </li>
  );
}

/** Support Us (#support): points to the Unlimited Blue store. */
export default function SupportSection() {
  const { t } = useI18n();
  return (
    <SectionShell id="support" title={t.navSupport} sub={t.supSub}>
      <div className="relative isolate overflow-hidden rounded-[2rem] border p-[clamp(1.5rem,4vw,3rem)]" style={{ background: 'var(--glass)', borderColor: 'var(--glass-b)' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -z-10 h-72 w-72 rounded-full opacity-50 blur-3xl [inset-inline-end:-4rem]" style={{ background: 'radial-gradient(circle,#3d7bff,transparent 70%)' }} />
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="inline-block rounded-full border px-3.5 py-1 text-[.82rem] font-bold" style={{ borderColor: 'var(--glass-b)', color: 'var(--link-on)', background: 'var(--chip-bg)' }}>{STORE.name}</span>
            <h3 className="mt-4 font-display text-[clamp(1.6rem,3.2vw,2.5rem)] font-black leading-tight rtl:font-sans rtl:font-extrabold">{t.supStoreTitle}</h3>
            <p className="mt-4 max-w-[34rem] leading-relaxed" style={{ color: 'var(--muted)' }}>{t.supStoreText}</p>
            <a href={STORE.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7 inline-flex">
              {t.supStoreBtn}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4"><path d="M7 17 17 7M8 7h9v9" /></svg>
            </a>
            <p className="mt-3 text-[.8rem]" style={{ color: 'var(--muted)' }}>{t.supNote}</p>
          </div>
          <ul className="grid grid-cols-3 gap-3">
            <Feature icon={PrintIcon} label={t.supF1} />
            <Feature icon={EngraveIcon} label={t.supF2} />
            <Feature icon={LaserIcon} label={t.supF3} />
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
