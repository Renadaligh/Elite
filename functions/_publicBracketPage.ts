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
header,nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px}header{justify-content:space-between} .brand img{display:block;height:34px;width:auto;max-width:128px;object-fit:contain}:root[data-theme=light] .brand img{filter:brightness(0) saturate(100%) invert(15%) sepia(39%) saturate(1049%) hue-rotate(184deg)}
a,button{color:inherit;font:inherit}nav a,button,.retry{border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:7px 11px;text-decoration:none;cursor:pointer}
button:disabled{opacity:.5;cursor:default}h1{font-size:clamp(22px,5vw,36px);margin:0 0 14px;overflow-wrap:anywhere}h2{font-size:18px}
.sheet{margin-top:14px;background:transparent;border:0;border-radius:0;overflow:auto;padding:0;direction:ltr}
.sheet section{margin-block:12px}.sheet h2{direction:var(--dir,ltr)}.bracket-meta{direction:var(--dir,ltr);margin:5px 0 16px}.bracket-meta p{margin:4px 0;color:var(--mut)}
.sheet svg[data-width]{display:block;max-width:none;height:auto;margin:0 auto 8px;width:var(--render-width, auto)}
.bs-hd,.bs-seed{fill:var(--head)}.bs-row{fill:var(--row)}.bs-row.win{fill:var(--win)}
.bs-nm,.bs-ht,.bs-sc,.bs-ck{fill:var(--fg)}.bs-nm.win{font-weight:800}.bs-sn,.bs-no,.bs-nm.lose,.bs-nm.bye{fill:var(--mut)}
.bs-ln{stroke:var(--line)}.bs-cup{stroke:#dca500}[hidden]{display:none!important} .icon-btn{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}.icon-btn svg{width:17px;height:17px;flex:none;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}#zoom{display:inline-flex;align-items:center;gap:4px}#zoom button{min-width:37px}#zoom-level{min-width:52px;text-align:center;font-variant-numeric:tabular-nums} .title-block h1{margin-bottom:4px}.bracket-meta .bracket-organizer{font-size:12px}
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
  const copyLabel = copy.querySelector('[data-button-label]');
  const original = copy.dataset.label || copyLabel?.textContent;
  if (copied) {
    if (copyLabel) copyLabel.textContent = copy.dataset.copied;
    setTimeout(() => { if (copyLabel) copyLabel.textContent = original; }, 1800);
  } else {
    if (copyLabel) copyLabel.textContent = copy.dataset.failed;
    setTimeout(() => { if (copyLabel) copyLabel.textContent = original; }, 2200);
  }
});
const saveImage = document.getElementById('save-image');
saveImage?.addEventListener('click', async (event) => {
  event.preventDefault();
  const sheetEl = document.querySelector('.sheet');
  const graphics = [...(sheetEl?.querySelectorAll('svg[data-width]') || [])];
  if (!graphics.length || saveImage.disabled) return;
  saveImage.disabled = true;
  const saveLabel = saveImage.querySelector('[data-button-label]');
  const previousLabel = saveLabel?.textContent;
  if (saveLabel) saveLabel.textContent = saveImage.dataset.saving;
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
      clone.removeAttribute('font-family');
      clone.setAttribute('font-family', 'Arial, Tahoma, sans-serif');
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
    if (saveLabel) saveLabel.textContent = saveImage.dataset.saved;
  } catch (error) {
    console.error('Could not save bracket image', error);
    if (saveLabel) saveLabel.textContent = saveImage.dataset.failed;
  } finally {
    saveImage.disabled = false;
    setTimeout(() => { if (saveLabel) saveLabel.textContent = previousLabel; urls.forEach(url => URL.revokeObjectURL(url)); }, 5000);
  }
});
const sheet = document.querySelector('.sheet');
if (sheet) {
  const charts = [...sheet.querySelectorAll('svg[data-width]')];
  const zoomIn = document.getElementById('zoom-in');
  const zoomOut = document.getElementById('zoom-out');
  let zoom = 1;
  const level = document.getElementById('zoom-level');
  const draw = () => {
    const available = sheet.clientWidth - 20;
    for (const chart of charts) {
      const width = Number(chart.dataset.width);
      const fit = Math.max(.48, Math.min(1, available / width));
      chart.style.setProperty('--render-width', (width * fit * zoom) + 'px');
    }
    if (level) level.textContent = Math.round(zoom * 100) + '%';
    zoomIn.disabled = zoom >= 3;
    zoomOut.disabled = zoom <= .6;
  };
  zoomIn.addEventListener('click', () => { zoom = Math.min(3, zoom + .25); draw(); });
  zoomOut.addEventListener('click', () => { zoom = Math.max(.6, zoom - .25); draw(); });
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

  // The organizer and winner stay directly under the title, outside the horizontally scrolling SVG area.
  const metaMatch = svg.match(/<div class="bracket-meta">([\s\S]*?)<\/div>/);
  const meta = metaMatch ? `<div class="bracket-meta">${metaMatch[1]}</div>` : '';
  if (metaMatch) svg = svg.replace(metaMatch[0], '');
  const target = '?lang=' + (ar ? 'en' : 'ar');
  const message = status === 404
    ? (ar ? 'البطولة غير موجودة. تأكدي من الرابط.' : 'Bracket not found. Check the link.')
    : (ar ? 'تعذّر عرض البطولة الآن. حاولي مرة ثانية.' : 'Could not load the bracket. Please try again.');
  // Small inline icons preserve the familiar compact toolbar rather than replacing actions with text-only buttons.
  const icon = (name: 'language' | 'sun' | 'moon' | 'copy' | 'download') => {
    const shapes = {
      language: '<path d="m5 8 6 0M8 5v3c0 5-2 7-5 8M5 11c1.5 2.5 3 4 5 5M13 18l4-11 4 11M14.5 14h5"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
      moon: '<path d="M20.98 13A9 9 0 0 1 11 3.02 9 9 0 1 0 20.98 13Z"/>',
      copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
      download: '<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
    };
    return `<svg aria-hidden="true" viewBox="0 0 24 24">${shapes[name]}</svg>`;
  };
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
    <header><a class="brand" href="/" aria-label="Plato AR"><img src="/brand/plato-ar-white.png" alt="PLATO AR"></a><nav>
      <a class="icon-btn" href="${target}" lang="${ar ? 'en' : 'ar'}">${icon('language')}${ar ? 'English' : 'العربية'}</a>
      ${status === 200 ? `<button id="copy-link" type="button" data-label="${ar ? 'نسخ الرابط' : 'Copy link'}" data-copied="${ar ? 'تم النسخ ✓' : 'Copied ✓'}" data-failed="${ar ? 'تعذّر النسخ' : 'Copy failed'}" class="icon-btn">${icon('copy')}<span data-button-label>${ar ? 'نسخ الرابط' : 'Copy link'}</span></button>` : ''}
      ${status === 200 ? `<button id="save-image" type="button" data-saving="${ar ? 'جارٍ حفظ الصورة…' : 'Saving image…'}" data-saved="${ar ? 'تم الحفظ ✓' : 'Saved ✓'}" data-failed="${ar ? 'تعذّر حفظ الصورة' : 'Could not save image'}" class="icon-btn">${icon('download')}<span data-button-label>${ar ? 'حفظ كصورة' : 'Save as image'}</span></button>` : ''}
      <button id="theme" type="button" class="icon-btn" aria-pressed="false">${icon('sun')}${icon('moon')}<span>${ar ? 'فاتح / داكن' : 'Light / dark'}</span></button>
    </nav></header><main style="--dir:${dir}"><div class="title-block"><h1 dir="auto">${escape(title)}</h1>${status === 200 ? meta : ''}</div>
    ${status === 200 ? `<nav id="zoom" hidden aria-label="${ar ? 'التكبير' : 'Zoom'}">
      <button type="button" id="zoom-out" aria-label="${ar ? 'تصغير' : 'Zoom out'}">−</button>
      <span id="zoom-level">100%</span>
      <button type="button" id="zoom-in" aria-label="${ar ? 'تكبير' : 'Zoom in'}">+</button></nav>
      <div class="sheet" tabindex="0" aria-label="${ar ? 'نتائج البطولة' : 'Bracket results'}">${svg}</div>`
      : `<p>${message}</p>${status === 503 ? `<a class="retry" href="?lang=${lang}">${ar ? 'إعادة المحاولة' : 'Try again'}</a>` : ''}`}
    </main><script nonce="${nonce}">document.getElementById('theme').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'light'));${controls}</script></body></html>`;

  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src 'self' blob: data:; base-uri 'none'; frame-ancestors 'self'`,
  });
  if (choice === 'ar' || choice === 'en') headers.set('set-cookie', `plato-lang=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`);
  return new Response(html, { status, headers });
}
