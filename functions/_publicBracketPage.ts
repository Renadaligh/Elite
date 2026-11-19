import type { Bracket } from '../src/data/bracket';
import { sha256 } from './_auth';
import type { Ctx } from './_lib';
import { publicBracketSvg } from './_publicBracketSvg';

type Row = { title: string; data: string };
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const CACHE_VERSION = 'v1';

async function snapshot(request: Request, row: Row, lang: 'ar' | 'en', bracketTitle: string, waitUntil?: Ctx['waitUntil']) {
  const revision = await sha256(JSON.stringify([row.title, row.data]));
  const key = new Request(new URL(`/v/_snapshot/${CACHE_VERSION}/${lang}/${revision}`, request.url));
  const cache = (globalThis.caches as CacheStorage & { default?: Cache } | undefined)?.default;
  const hit = await cache?.match(key).catch(() => undefined);
  if (hit) {
    const cached = await hit.text().catch(() => '');
    if (cached) return cached;
  }
  const svg = publicBracketSvg(JSON.parse(row.data) as Bracket, bracketTitle, lang);
  if (cache) {
    const save = cache.put(key, new Response(svg, { headers: {
      'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=86400',
    } })).catch(() => undefined);
    if (waitUntil) waitUntil(save);
    else await save;
  }
  return svg;
}

const styles = `
:root{color-scheme:dark;--bg:#0a1020;--panel:#111a2d;--fg:#edf2ff;--mut:#a8b4cf;--head:#283659;--row:#1d2a45;--win:#2655b8;--line:#677692}
:root[data-theme=light]{color-scheme:light;--bg:#f4f6fc;--panel:#fff;--fg:#192645;--mut:#495976;--head:#dce6fa;--row:#eaf0fa;--win:#bbd2ff;--line:#7183a5}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px system-ui,sans-serif}
header,main{max-width:1220px;margin:auto;padding:16px clamp(12px,4vw,36px)}
header,nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px}header{justify-content:space-between}
a,button{color:inherit;font:inherit}nav a,button,.retry{border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:7px 11px;text-decoration:none;cursor:pointer}
button:disabled{opacity:.5;cursor:default}h1{font-size:clamp(22px,5vw,36px);margin:0 0 14px;overflow-wrap:anywhere}h2{font-size:18px}
.sheet{margin-top:14px;background:var(--panel);border:1px solid var(--head);border-radius:12px;overflow:auto;padding:10px;direction:ltr}
.sheet section{margin-block:12px}.sheet h2,.bracket-meta{direction:var(--dir,ltr)}.bracket-meta p{margin:4px 4px 12px;color:var(--mut)}
.sheet svg[data-width]{display:block;max-width:none;height:auto;margin:0 auto 8px;width:var(--render-width, auto)}
.bs-hd,.bs-seed{fill:var(--head)}.bs-row{fill:var(--row)}.bs-row.win{fill:var(--win)}
.bs-nm,.bs-ht,.bs-sc,.bs-ck{fill:var(--fg)}.bs-nm.win{font-weight:800}.bs-sn,.bs-no,.bs-nm.lose,.bs-nm.bye{fill:var(--mut)}
.bs-ln{stroke:var(--line)}.bs-cup{stroke:#dca500}[hidden]{display:none!important}
`;

const controls = `
const root = document.documentElement;
const theme = document.getElementById('theme');
theme?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  theme.setAttribute('aria-pressed', String(next === 'light'));
  try { localStorage.setItem('elite-pv-theme', next); } catch {}
});
const copy = document.getElementById('copy-link');
copy?.addEventListener('click', async (event) => {
  event.preventDefault();
  event.stopPropagation();
  const link = location.origin + location.pathname;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      copied = true;
    }
  } catch {}
  if (!copied) {
    const input = document.createElement('textarea');
    input.value = link;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try { copied = document.execCommand('copy'); } catch {}
    input.remove();
  }
  const original = copy.dataset.label || copy.textContent;
  if (copied) {
    copy.textContent = copy.dataset.copied;
    setTimeout(() => { copy.textContent = original; }, 1800);
  } else {
    copy.textContent = copy.dataset.failed;
    setTimeout(() => { copy.textContent = original; }, 2200);
  }
});
const saveImage = document.getElementById('save-image');
saveImage?.addEventListener('click', async (event) => {
  event.preventDefault();
  const sheetEl = document.querySelector('.sheet');
  const graphics = [...(sheetEl?.querySelectorAll('svg[data-width]') || [])];
  if (!graphics.length || saveImage.disabled) return;
  saveImage.disabled = true;
  const previousLabel = saveImage.textContent;
  saveImage.textContent = saveImage.dataset.saving;
  const urls = [];
  try {
    // Render the ORIGINAL SVG dimensions, independently of the current screen/zoom.
    // Resolve CSS variables inside the exported document because SVG images don't
    // inherit the web page's CSS classes or its light/dark theme.
    const color = (property) => getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    const rules = [
      ['.bs-hd,.bs-seed', 'fill', '--head'],
      ['.bs-row', 'fill', '--row'],
      ['.bs-row.win', 'fill', '--win'],
      ['.bs-nm,.bs-ht,.bs-sc,.bs-ck', 'fill', '--fg'],
      ['.bs-sn,.bs-no,.bs-nm.lose,.bs-nm.bye', 'fill', '--mut'],
      ['.bs-ln', 'stroke', '--line'],
    ].map(([selector, property, variable]) => selector + '{' + property + ':' + color(variable) + '}').join('') + '.bs-nm.win{font-weight:800}.bs-cup{stroke:#dca500}text{font-family:Arial,Tahoma,sans-serif}';
    const padding = 32, gap = 20, titleHeight = 68, textHeight = 30;
    const blocks = graphics.map((svg) => {
      const width = Number(svg.getAttribute('width')) || Number(svg.dataset.width) || 800;
      const height = Number(svg.getAttribute('height')) || 400;
      const section = svg.closest('section');
      // Don't repeat a section heading for every table in the same section.
      const heading = section && !section.querySelector('svg[data-width]')?.isSameNode(svg) ? '' : section?.querySelector('h2')?.textContent || '';
      return { svg, width, height, heading };
    });
    const totalWidth = Math.max(520, ...blocks.map(block => block.width + padding * 2));
    const totalHeight = padding + titleHeight + blocks.reduce((sum, block) => sum + (block.heading ? textHeight : 0) + block.height + gap, 0) + padding;
    // Keep large brackets within conservative browser canvas limits.
    const scale = Math.min(2, 8192 / totalWidth, 14000 / totalHeight);
    if (!(scale > 0.05)) throw new Error('Image too large');
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(totalWidth * scale);
    canvas.height = Math.ceil(totalHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available');
    context.scale(scale, scale);
    context.fillStyle = color('--bg');
    context.fillRect(0, 0, totalWidth, totalHeight);
    context.fillStyle = color('--fg');
    context.font = 'bold 26px Arial,Tahoma,sans-serif';
    context.textAlign = document.documentElement.dir === 'rtl' ? 'right' : 'left';
    const x = document.documentElement.dir === 'rtl' ? totalWidth - padding : padding;
    context.fillText(document.querySelector('h1')?.textContent || 'PLATO AR', x, padding + 30, totalWidth - padding * 2);
    let y = padding + titleHeight;
    for (const block of blocks) {
      if (block.heading) {
        context.fillStyle = color('--fg');
        context.font = 'bold 18px Arial,Tahoma,sans-serif';
        context.fillText(block.heading, x, y + 17, totalWidth - padding * 2);
        y += textHeight;
      }
      const clone = block.svg.cloneNode(true);
      clone.removeAttribute('style');
      clone.removeAttribute('class');
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(block.width));
      clone.setAttribute('height', String(block.height));
      const sheetStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      sheetStyle.textContent = rules;
      clone.insertBefore(sheetStyle, clone.firstChild);
      const source = new XMLSerializer().serializeToString(clone);
      const objectUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
      urls.push(objectUrl);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('SVG rendering failed'));
        img.src = objectUrl;
      });
      context.fillStyle = color('--panel');
      context.fillRect(padding - 6, y - 4, block.width + 12, block.height + 8);
      context.drawImage(img, padding, y, block.width, block.height);
      y += block.height + gap;
    }
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png'));
    const downloadUrl = URL.createObjectURL(blob);
    urls.push(downloadUrl);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'plato-ar-bracket-' + (location.pathname.split('/').filter(Boolean).pop() || 'view') + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    saveImage.textContent = saveImage.dataset.saved;
  } catch (error) {
    console.error('Could not save bracket image', error);
    saveImage.textContent = saveImage.dataset.failed;
  } finally {
    saveImage.disabled = false;
    setTimeout(() => { saveImage.textContent = previousLabel; urls.forEach(url => URL.revokeObjectURL(url)); }, 1800);
  }
});
const sheet = document.querySelector('.sheet');
if (sheet) {
  const charts = [...sheet.querySelectorAll('svg[data-width]')];
  const zoomIn = document.getElementById('zoom-in');
  const zoomOut = document.getElementById('zoom-out');
  let zoom = 1;
  const draw = () => {
    const available = sheet.clientWidth - 20;
    for (const chart of charts) {
      const width = Number(chart.dataset.width);
      const fit = Math.max(.48, Math.min(1, available / width));
      chart.style.setProperty('--render-width', (width * fit * zoom) + 'px');
    }
    zoomIn.disabled = zoom >= 3;
    zoomOut.disabled = zoom <= .6;
  };
  zoomIn.addEventListener('click', () => { zoom = Math.min(3, zoom + .25); draw(); });
  zoomOut.addEventListener('click', () => { zoom = Math.max(.6, zoom - .25); draw(); });
  document.getElementById('zoom-reset').addEventListener('click', () => { zoom = 1; draw(); });
  window.addEventListener('resize', draw);
  document.getElementById('zoom').hidden = false;
  draw();
}
`;

export async function publicBracketPage({ request, env, params, waitUntil }: Ctx) {
  const url = new URL(request.url);
  const choice = url.searchParams.get('lang');
  const cookie = request.headers.get('cookie') ?? '';
  const stored = /(?:^|;\s*)plato-lang=(ar|en)(?:;|$)/.exec(cookie)?.[1];
  const lang = choice === 'ar' || choice === 'en' ? choice : stored === 'ar' ? 'ar' : 'en';
  const ar = lang === 'ar';
  const dir = ar ? 'rtl' : 'ltr';
  const nonce = crypto.randomUUID();
  let title = ar ? 'عرض البطولة' : 'Bracket view';
  let svg = '';
  let status = 200;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    // Public links are always enabled in the existing bracket API.
    const row = await Promise.race([
      env.DB.prepare('SELECT title, data FROM user_brackets WHERE id = ?').bind(params.id).first<Row>(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Database timeout')), 7000); }),
    ]);
    if (!row) status = 404;
    else {
      title = row.title || title;
      svg = await snapshot(request, row, lang, title, waitUntil);
    }
  } catch (error) {
    console.error('Could not render public bracket', error);
    status = 503;
  } finally {
    clearTimeout(timer);
  }

  const target = '?lang=' + (ar ? 'en' : 'ar');
  const message = status === 404
    ? (ar ? 'البطولة غير موجودة. تأكدي من الرابط.' : 'Bracket not found. Check the link.')
    : (ar ? 'تعذّر عرض البطولة الآن. حاولي مرة ثانية.' : 'Could not load the bracket. Please try again.');
  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escape(title)} · Plato AR</title><style>${styles}</style>
    <script nonce="${nonce}">try {
      const lang = ${JSON.stringify(lang)};
      const explicit = ${choice === 'ar' || choice === 'en'};
      const stored = localStorage.getItem('elite-lang');
      document.documentElement.dataset.theme = localStorage.getItem('elite-pv-theme') === 'light' ? 'light' : 'dark';
      if (explicit) localStorage.setItem('elite-lang', lang);
      else if ((stored === 'ar' || stored === 'en') && stored !== lang) location.replace('?lang=' + stored);
    } catch {}</script></head><body>
    <header><a href="/" aria-label="Plato AR">PLATO AR</a><nav>
      <a href="${target}" lang="${ar ? 'en' : 'ar'}">${ar ? 'English' : 'العربية'}</a>
      ${status === 200 ? `<button id="copy-link" type="button" data-label="${ar ? 'نسخ الرابط' : 'Copy link'}" data-copied="${ar ? 'تم النسخ ✓' : 'Copied ✓'}" data-failed="${ar ? 'تعذّر النسخ' : 'Copy failed'}">${ar ? 'نسخ الرابط' : 'Copy link'}</button>` : ''}
      ${status === 200 ? `<button id="save-image" type="button" data-saving="${ar ? 'جارٍ حفظ الصورة…' : 'Saving image…'}" data-saved="${ar ? 'تم الحفظ ✓' : 'Saved ✓'}" data-failed="${ar ? 'تعذّر حفظ الصورة' : 'Could not save image'}">${ar ? 'حفظ كصورة' : 'Save as image'}</button>` : ''}
      <button id="theme" type="button" aria-pressed="false">${ar ? 'فاتح / داكن' : 'Light / dark'}</button>
    </nav></header><main style="--dir:${dir}"><h1 dir="auto">${escape(title)}</h1>
    ${status === 200 ? `<nav id="zoom" hidden aria-label="${ar ? 'التكبير' : 'Zoom'}">
      <button type="button" id="zoom-in">${ar ? 'تكبير' : 'Zoom in'}</button>
      <button type="button" id="zoom-out">${ar ? 'تصغير' : 'Zoom out'}</button>
      <button type="button" id="zoom-reset">${ar ? 'ملاءمة' : 'Fit'}</button></nav>
      <div class="sheet" tabindex="0" aria-label="${ar ? 'نتائج البطولة' : 'Bracket results'}">${svg}</div>`
      : `<p>${message}</p>${status === 503 ? `<a class="retry" href="?lang=${lang}">${ar ? 'إعادة المحاولة' : 'Try again'}</a>` : ''}`}
    </main><script nonce="${nonce}">document.getElementById('theme').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'light'));${controls}</script></body></html>`;

  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'`,
  });
  if (choice === 'ar' || choice === 'en') headers.set('set-cookie', `plato-lang=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`);
  return new Response(html, { status, headers });
}
