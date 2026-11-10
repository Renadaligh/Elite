import { useState } from 'react';
import type { Bracket } from '../data/bracket';
import { bracketBlob, downloadBlob, shareBracket } from '../data/bracketImage';
import { useI18n } from '../i18n/I18nProvider';

/** "Save as image" + "Share" for a bracket. Works on the public page and in the dashboard. */
export default function BracketActions({ bracket, title, url }: { bracket: Bracket; title: string; url: string }) {
  const { lang } = useI18n();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const ar = lang === 'ar';
  const flash = (s: string) => { setMsg(s); window.setTimeout(() => setMsg(''), 2500); };
  async function run(kind: 'save' | 'share') {
    setBusy(true);
    try {
      const blob = await bracketBlob(bracket, { title, lang });
      if (kind === 'save') { downloadBlob(blob, `${title.replace(/[^\p{L}\p{N}]+/gu, '-') || 'bracket'}.png`); flash(ar ? 'تم حفظ الصورة' : 'Image saved'); }
      else { const r = await shareBracket(blob, title, url); if (r === 'copied') flash(ar ? 'تم نسخ الرابط' : 'Link copied'); else if (r === 'failed') flash(ar ? 'تعذّرت المشاركة' : 'Could not share'); }
    } catch { flash(ar ? 'تعذّر إنشاء الصورة' : 'Could not create the image'); }
    setBusy(false);
  }
  const b = 'rounded-full border px-4 py-2 text-[.85rem] font-semibold transition-opacity disabled:opacity-60';
  const st = { borderColor: 'var(--glass-b)', background: 'var(--glass)' };
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" className={b} style={st} disabled={busy} onClick={() => run('save')}>⬇ {ar ? 'حفظ كصورة' : 'Save as image'}</button>
      <button type="button" className={b} style={st} disabled={busy} onClick={() => run('share')}>↗ {ar ? 'مشاركة' : 'Share'}</button>
      {msg && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }} role="status">{msg}</span>}
    </div>
  );
}
