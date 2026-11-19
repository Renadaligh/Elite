/** Export a saved bracket using the SAME renderer used by the public /v/:id page.
 * This is intentionally separate from the editable dashboard's bracket UI. */
export function publicBracketExport(id: string, lang: 'ar' | 'en', theme: 'dark' | 'light'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10000px;top:-10000px;border:0';
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      window.removeEventListener('message', receive);
      frame.remove();
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      const data = event.data;
      if (!data || data.requestId !== requestId) return;
      if (data.kind === 'plato:export-bracket-result' && data.bytes instanceof ArrayBuffer) {
        cleanup();
        resolve(new Blob([data.bytes], { type: 'image/png' }));
      } else if (data.kind === 'plato:export-bracket-error') {
        cleanup();
        reject(new Error('Unable to export public bracket'));
      }
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Bracket export timed out'));
    }, 25000);
    window.addEventListener('message', receive);
    frame.onload = () => {
      // Same-origin page. It renders the current stored bracket in the selected language,
      // then applies the dashboard theme before producing its PNG.
      try {
        if (!frame.contentWindow?.document.getElementById('save-image')) {
          cleanup();
          reject(new Error('Bracket not available for export'));
          return;
        }
        frame.contentWindow.postMessage({ kind: 'plato:export-bracket', requestId, theme }, location.origin);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    frame.onerror = () => {
      cleanup();
      reject(new Error('Cannot load public bracket renderer'));
    };
    frame.src = `/v/${encodeURIComponent(id)}?exportLang=${lang}`;
    document.body.appendChild(frame);
  });
}
