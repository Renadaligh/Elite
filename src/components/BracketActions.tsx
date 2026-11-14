import { useState } from 'react';
import { isDraft, type Bracket } from '../data/bracket';
import { bracketBlob, downloadBlob } from '../data/bracketImage';
import { useI18n } from '../i18n/I18nProvider';
import { DownloadIcon } from './icons';

/** "Save as image" + "Share" for a bracket. Works on the public page and in the dashboard. */
export interface UndoApi { onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean }

export default function BracketActions({ bracket, title, url, undo, linkOk }: { bracket: Bracket; title: string; url: string; undo?: UndoApi; linkOk?: boolean }) {
  const { lang } = useI18n();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const ar = lang === 'ar';
  const flash = (s: string) => { setMsg(s); window.setTimeout(() => setMsg(''), 2500); };
  async function run(kind: 'save') {
    setBusy(true);
    try {
      const blob = await bracketBlob(bracket, { title, lang });
      if (kind === 'save') { downloadBlob(blob, `${title.replace(/[^\p{L}\p{N}]+/gu, '-') || 'bracket'}.png`); flash(ar ? 'تم حفظ الصورة' : 'Image saved'); }
    } catch { flash(ar ? 'تعذّر إنشاء الصورة' : 'Could not create the image'); }
    setBusy(false);
  }
  function copyLink() {
    if (linkOk === false) { flash(ar ? 'فعّل «رابط العرض» أولاً' : 'Turn on the view link first'); return; }
    const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); a.remove();
  }
  const b = 'inline-flex items-center justify-center gap-2 rounded-full border px-4 max-sm:h-10 max-sm:w-10 max-sm:px-0 py-2 text-[.85rem] font-semibold transition-opacity disabled:opacity-60';
  const st = { borderColor: 'var(--glass-b)', background: 'var(--glass)' };
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {undo && (
        <>
          <button type="button" className={b} style={st} disabled={!undo.canUndo} title={ar ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'} onClick={undo.onUndo}><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></svg><span className="max-sm:sr-only">{ar ? 'تراجع' : 'Undo'}</span></button>
          <button type="button" className={b} style={st} disabled={!undo.canRedo} title={ar ? 'إعادة (Ctrl+Shift+Z)' : 'Redo (Ctrl+Shift+Z)'} onClick={undo.onRedo}><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 000 12h3" /></svg><span className="max-sm:sr-only">{ar ? 'إعادة' : 'Redo'}</span></button>
        </>
      )}
      {!isDraft(bracket) && <button type="button" className={b} style={st} disabled={busy} title={ar ? 'حفظ كصورة' : 'Save as image'} onClick={() => run('save')}><DownloadIcon className="h-4 w-4" /><span className="max-sm:sr-only">{ar ? 'حفظ كصورة' : 'Save as image'}</span></button>}
      {!isDraft(bracket) && <button type="button" className={`${b} !px-0 h-10 w-10`} style={st} title={ar ? 'فتح صفحة العرض' : 'Open the view page'} aria-label={ar ? 'فتح صفحة العرض' : 'Open the view page'} onClick={copyLink}><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.7 1.7" /><path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.7-1.7" /></svg></button>}
      {msg && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }} role="status">{msg}</span>}
    </div>
  );
}
