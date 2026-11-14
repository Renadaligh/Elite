import { useState } from 'react';
import type { Bracket } from '../data/bracket';
import { bracketBlob, downloadBlob, shareBracket } from '../data/bracketImage';
import { useI18n } from '../i18n/I18nProvider';
import { DownloadIcon, ShareIcon } from './icons';

/** "Save as image" + "Share" for a bracket. Works on the public page and in the dashboard. */
export interface UndoApi { onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean }

export default function BracketActions({ bracket, title, url, undo }: { bracket: Bracket; title: string; url: string; undo?: UndoApi }) {
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
      <button type="button" className={b} style={st} disabled={busy} title={ar ? 'حفظ كصورة' : 'Save as image'} onClick={() => run('save')}><DownloadIcon className="h-4 w-4" /><span className="max-sm:sr-only">{ar ? 'حفظ كصورة' : 'Save as image'}</span></button>
      <button type="button" className={b} style={st} disabled={busy} title={ar ? 'مشاركة' : 'Share'} onClick={() => run('share')}><ShareIcon className="h-4 w-4" /><span className="max-sm:sr-only">{ar ? 'مشاركة' : 'Share'}</span></button>
      {msg && <span className="text-[.82rem]" style={{ color: 'var(--muted)' }} role="status">{msg}</span>}
    </div>
  );
}
