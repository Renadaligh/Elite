import type { Bracket } from '../src/data/bracket';
import { sha256 } from './_auth';
import type { Ctx } from './_lib';
import { publicBracketSvg } from './_publicBracketSvg';

type Row = { title: string; data: string };
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const CACHE_VERSION = 'v3';

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
:root{color-scheme:dark;--bg:#0a1020;--panel:#111a2d;--fg:#edf2ff;--mut:#a8b4cf;--head:#283659;--row:#1d2a45;--win:#2655b8;--line:#677692;--toolbar:#0f1930;--champ-bg:#f3c93d;--champ-border:#e7b114;--champ-text:#3c2a00;--champ-sub:#6e5300}
:root[data-theme=light]{color-scheme:light;--bg:#eef3fb;--panel:#fff;--fg:#132750;--mut:#405a84;--head:#adc5ed;--row:#d7e4f5;--win:#8cb4f0;--line:#506b9e;--toolbar:#ffffff;--champ-bg:#ffd95a;--champ-border:#e4b51d;--champ-text:#4a3400;--champ-sub:#7b5a00}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px system-ui,sans-serif}
header,main{max-width:1380px;margin:auto;padding:16px clamp(12px,4vw,36px)}
header,nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px}header{justify-content:space-between}.brand img{display:block;height:34px;width:auto;max-width:128px;object-fit:contain}:root[data-theme=light] .brand img{filter:brightness(0) saturate(100%) invert(15%) sepia(39%) saturate(1049%) hue-rotate(184deg)}
a,button{color:inherit;font:inherit}
nav a,button,.retry{border:1px solid var(--line);border-radius:10px;background:var(--toolbar);padding:7px 10px;text-decoration:none;cursor:pointer}
button:disabled{opacity:.5;cursor:default}
h1{font-size:clamp(22px,5vw,36px);margin:0 0 6px;overflow-wrap:anywhere}h2{font-size:18px}
.sheet{margin-top:14px;background:transparent;border:0;border-radius:0;overflow:auto;padding:0 0 8px;direction:ltr;scrollbar-width:none;-ms-overflow-style:none;cursor:grab;overscroll-behavior-x:contain;touch-action:pan-x pan-y}.sheet::-webkit-scrollbar{display:none}.sheet.is-dragging{cursor:grabbing;user-select:none}.sheet.is-dragging *{user-select:none}.sheet section{margin-block:14px}.sheet h2{direction:var(--dir,ltr)}
.bracket-meta{direction:var(--dir,ltr);display:flex;flex-direction:column;gap:10px;margin:5px 0 18px}.bracket-meta p{margin:0;color:var(--mut)}.bracket-meta .bracket-organizer{font-size:12px}.bracket-champion{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 16px;border-radius:16px;background:linear-gradient(180deg,#ffe48a 0%,var(--champ-bg) 100%);border:1px solid var(--champ-border);color:var(--champ-text);box-shadow:0 12px 24px rgba(0,0,0,.18);width:min(100%,420px);margin-inline:auto;text-align:center}.bracket-champion-icon{font-size:26px;line-height:1}.bracket-champion-copy{display:flex;flex-direction:column;gap:3px}.bracket-champion-label{font-size:13px;font-weight:700;color:var(--champ-sub)}.bracket-champion-name{font-size:19px;font-weight:900;line-height:1.2}
.sheet svg[data-width]{display:block;max-width:none;height:auto;margin:0 auto 8px;width:var(--render-width, auto)}
.bs-hd,.bs-seed{fill:var(--head);stroke:color-mix(in srgb,var(--line) 75%, transparent);stroke-width:1.3}.bs-row{fill:var(--row);stroke:color-mix(in srgb,var(--line) 70%, transparent);stroke-width:1.15}.bs-row.win{fill:var(--win);stroke:color-mix(in srgb,var(--line) 78%, transparent);stroke-width:1.3}
.bs-nm,.bs-ht,.bs-sc,.bs-ck{fill:var(--fg)}.bs-nm.win{font-weight:800}.bs-sn,.bs-no,.bs-nm.lose,.bs-nm.bye{fill:var(--mut)}.bs-ln{stroke:var(--line);stroke-width:1.9}.bs-cup{stroke:#dca500}[hidden]{display:none!important}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;min-width:38px;min-height:38px;padding:7px 10px}.icon-btn svg{width:17px;height:17px;flex:none;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}.icon-btn .icon-text{font-size:13px;font-weight:700}
#zoom{display:inline-flex;align-items:center;gap:6px}#zoom button{min-width:39px;min-height:39px;padding:7px 12px}#zoom-level{min-width:54px;text-align:center;font-variant-numeric:tabular-nums}
.title-block h1{margin-bottom:4px}
#page-toast{position:fixed;inset-inline-start:50%;bottom:clamp(24px,6vh,64px);transform:translateX(-50%) translateY(10px);z-index:1000;min-width:140px;max-width:calc(100vw - 32px);padding:12px 20px;border-radius:12px;background:#213b70;color:#fff;box-shadow:0 12px 36px rgba(0,0,0,.24);font-size:14px;font-weight:750;text-align:center;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}#page-toast[data-visible="true"]{opacity:1;transform:translateX(-50%) translateY(0)}
@media (max-width: 720px){header,main{padding-inline:14px}.bracket-champion{width:100%}.sheet{padding-bottom:12px}}
`;

const controls = `
const root = document.documentElement;
const theme = document.getElementById('theme');
const themeIcon = theme?.querySelector('[data-theme-icon]');
const applyThemeIcon = () => {
  if (!themeIcon) return;
  const mode = root.dataset.theme === 'light' ? 'light' : 'dark';
  themeIcon.innerHTML = mode === 'light'
    ? '<path d="M20.98 13A9 9 0 0 1 11 3.02 9 9 0 1 0 20.98 13Z"/>'
    : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
  theme.title = mode === 'light' ? (root.lang === 'ar' ? 'الوضع الداكن' : 'Dark mode') : (root.lang === 'ar' ? 'الوضع الفاتح' : 'Light mode');
};
applyThemeIcon();
theme?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  theme.setAttribute('aria-pressed', String(next === 'light'));
  try { localStorage.setItem('elite-pv-theme', next); } catch {}
  applyThemeIcon();
});
const pageToast = document.getElementById('page-toast');
let toastTimer;
const showToast = (message, isError = false) => {
  if (!pageToast) return;
  pageToast.textContent = message;
  pageToast.style.background = isError ? '#9c2f3a' : '#213b70';
  pageToast.dataset.visible = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { pageToast.dataset.visible = 'false'; }, 2300);
};
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
  copy.title = copied ? copy.dataset.copied : copy.dataset.failed;
  showToast(copied ? copy.dataset.copied : copy.dataset.failed, !copied);
});
const saveImage = document.getElementById('save-image');
saveImage?.addEventListener('click', async (event) => {
  event.preventDefault();
  const sheetEl = document.querySelector('.sheet');
  const graphics = [...(sheetEl?.querySelectorAll('svg[data-width]') || [])];
  if (!graphics.length || saveImage.disabled) return;
  saveImage.disabled = true;
  const urls = [];
  try {
    const color = (property) => getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    const rules = [
      ['.bs-hd,.bs-seed', 'fill', '--head'],
      ['.bs-hd,.bs-seed', 'stroke', '--line'],
      ['.bs-row', 'fill', '--row'],
      ['.bs-row', 'stroke', '--line'],
      ['.bs-row.win', 'fill', '--win'],
      ['.bs-row.win', 'stroke', '--line'],
      ['.bs-nm,.bs-ht,.bs-sc,.bs-ck', 'fill', '--fg'],
      ['.bs-sn,.bs-no,.bs-nm.lose,.bs-nm.bye', 'fill', '--mut'],
      ['.bs-ln', 'stroke', '--line'],
    ].map(([selector, property, variable]) => selector + '{' + property + ':' + color(variable) + '}').join('') + '.bs-hd,.bs-seed{stroke-width:1.3}.bs-row,.bs-row.win{stroke-width:1.15}.bs-row.win{stroke-width:1.3}.bs-nm.win{font-weight:800}.bs-cup{stroke:#dca500}text{font-family:Arial,Tahoma,sans-serif}';
    const padding = 36, gap = 20, titleHeight = 72, textHeight = 30, brandBoxW = 180, brandBoxH = 56;
    const blocks = graphics.map((svg, index) => {
      const width = Number(svg.getAttribute('width')) || Number(svg.dataset.width) || 800;
      const height = Number(svg.getAttribute('height')) || 400;
      const section = svg.closest('section');
      const firstSvg = section?.querySelector('svg[data-width]');
      const heading = section && firstSvg && firstSvg.isSameNode(svg) ? (section.querySelector('h2')?.textContent || '') : '';
      return { svg, width, height, heading };
    });
    const totalWidth = Math.max(720, ...blocks.map(block => block.width + padding * 2));
    const championCard = document.querySelector('.bracket-champion');
    const organizerLine = document.querySelector('.bracket-organizer');
    const championHeight = championCard ? 74 : 0;
    const organizerHeight = organizerLine ? 24 : 0;
    const totalHeight = padding + titleHeight + organizerHeight + championHeight + blocks.reduce((sum, block) => sum + (block.heading ? textHeight : 0) + block.height + gap, 0) + padding;
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
    const brandBg = root.dataset.theme === 'light' ? '#1a2c5e' : '#0f1930';
    const brandImg = document.querySelector('.brand img');
    if (brandImg?.complete) {
      const boxX = totalWidth - padding - brandBoxW;
      const boxY = padding - 6;
      context.fillStyle = brandBg;
      context.beginPath();
      const r = 16;
      context.moveTo(boxX + r, boxY);
      context.arcTo(boxX + brandBoxW, boxY, boxX + brandBoxW, boxY + brandBoxH, r);
      context.arcTo(boxX + brandBoxW, boxY + brandBoxH, boxX, boxY + brandBoxH, r);
      context.arcTo(boxX, boxY + brandBoxH, boxX, boxY, r);
      context.arcTo(boxX, boxY, boxX + brandBoxW, boxY, r);
      context.closePath();
      context.fill();
      context.drawImage(brandImg, boxX + 22, boxY + 12, 112, 28);
      context.fillStyle = '#e9f0ff';
      context.font = '600 16px Arial,Tahoma,sans-serif';
      context.textAlign = 'center';
      context.fillText('plato-ar.com', boxX + brandBoxW / 2, boxY + 48, brandBoxW - 16);
    }
    context.fillStyle = color('--fg');
    context.font = 'bold 28px Arial,Tahoma,sans-serif';
    context.textAlign = document.documentElement.dir === 'rtl' ? 'right' : 'left';
    const titleX = document.documentElement.dir === 'rtl' ? totalWidth - padding : padding;
    context.fillText(document.querySelector('h1')?.textContent || 'PLATO AR', titleX, padding + 30, totalWidth - padding * 2 - brandBoxW - 12);
    let y = padding + titleHeight;
    if (organizerLine) {
      context.fillStyle = color('--mut');
      context.font = '600 14px Arial,Tahoma,sans-serif';
      context.fillText(organizerLine.textContent || '', titleX, y + 2, totalWidth - padding * 2);
      y += organizerHeight;
    }
    if (championCard) {
      const championLabel = championCard.querySelector('.bracket-champion-label')?.textContent || '';
      const championName = championCard.querySelector('.bracket-champion-name')?.textContent || '';
      const cardW = Math.min(420, totalWidth - padding * 2);
      const cardH = 64;
      const cardX = (totalWidth - cardW) / 2;
      const cardY = y;
      context.fillStyle = '#ffd95a';
      context.strokeStyle = '#e4b51d';
      context.lineWidth = 1.2;
      const rr = 16;
      context.beginPath();
      context.moveTo(cardX + rr, cardY);
      context.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, rr);
      context.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, rr);
      context.arcTo(cardX, cardY + cardH, cardX, cardY, rr);
      context.arcTo(cardX, cardY, cardX + cardW, cardY, rr);
      context.closePath();
      context.fill();
      context.stroke();
      context.font = '24px Arial,Tahoma,sans-serif';
      context.textAlign = 'center';
      context.fillStyle = '#4a3400';
      context.fillText('🏆', cardX + 30, cardY + 40);
      context.font = '700 13px Arial,Tahoma,sans-serif';
      context.fillStyle = '#7b5a00';
      context.fillText(championLabel, cardX + cardW / 2 + 8, cardY + 22, cardW - 70);
      context.font = '900 20px Arial,Tahoma,sans-serif';
      context.fillStyle = '#4a3400';
      context.fillText(championName, cardX + cardW / 2 + 8, cardY + 45, cardW - 70);
      y += championHeight;
    }
    for (const block of blocks) {
      if (block.heading) {
        context.fillStyle = color('--fg');
        context.font = 'bold 18px Arial,Tahoma,sans-serif';
        context.textAlign = document.documentElement.dir === 'rtl' ? 'right' : 'left';
        context.fillText(block.heading, titleX, y + 17, totalWidth - padding * 2);
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
    saveImage.title = saveImage.dataset.saved;
    showToast(saveImage.dataset.saved);
  } catch (error) {
    console.error('Could not save bracket image', error);
    saveImage.title = saveImage.dataset.failed;
    showToast(saveImage.dataset.failed, true);
  } finally {
    saveImage.disabled = false;
    setTimeout(() => { urls.forEach(url => URL.revokeObjectURL(url)); }, 5000);
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
    const desktopBoost = window.innerWidth >= 1180 ? 1.12 : window.innerWidth >= 860 ? 1.05 : 1;
    for (const chart of charts) {
      const width = Number(chart.dataset.width);
      const fit = Math.max(.58, Math.min(desktopBoost, (available / width) * desktopBoost));
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
  // Pan oversized brackets by holding and dragging the mouse; touch devices keep native scrolling.
  let drag = null;
  sheet.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (event.target.closest('a,button,input,textarea,select')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: sheet.scrollLeft, top: sheet.scrollTop };
    sheet.classList.add('is-dragging');
    sheet.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  sheet.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    sheet.scrollLeft = drag.left - (event.clientX - drag.x);
    sheet.scrollTop = drag.top - (event.clientY - drag.y);
  });
  const stopDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    sheet.classList.remove('is-dragging');
    if (sheet.hasPointerCapture(event.pointerId)) sheet.releasePointerCapture(event.pointerId);
  };
  sheet.addEventListener('pointerup', stopDrag);
  sheet.addEventListener('pointercancel', stopDrag);
  sheet.addEventListener('lostpointercapture', () => { drag = null; sheet.classList.remove('is-dragging'); });
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
  const metaStart = svg.indexOf('<div class="bracket-meta">');
  let meta = '';
  if (metaStart !== -1) {
    const tags = /<\/?div\b[^>]*>/g;
    tags.lastIndex = metaStart;
    let depth = 0;
    for (const match of svg.slice(metaStart).matchAll(/<\/?div\b[^>]*>/g)) {
      depth += match[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        const end = metaStart + match.index! + match[0].length;
        meta = svg.slice(metaStart, end);
        svg = svg.slice(0, metaStart) + svg.slice(end);
        break;
      }
    }
  }
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
      <a class="icon-btn" href="${target}" lang="${ar ? 'en' : 'ar'}" title="${ar ? 'Change language' : 'تغيير اللغة'}">${icon('language')}<span class="icon-text">${ar ? 'EN' : 'عربي'}</span></a>
      ${status === 200 ? `<button id="copy-link" type="button" data-copied="${ar ? 'تم النسخ ✓' : 'Copied ✓'}" data-failed="${ar ? 'تعذّر النسخ' : 'Copy failed'}" class="icon-btn" title="${ar ? 'نسخ الرابط' : 'Copy link'}" aria-label="${ar ? 'نسخ الرابط' : 'Copy link'}">${icon('copy')}</button>` : ''}
      ${status === 200 ? `<button id="save-image" type="button" data-saved="${ar ? 'تم الحفظ ✓' : 'Saved ✓'}" data-failed="${ar ? 'تعذّر حفظ الصورة' : 'Could not save image'}" class="icon-btn" title="${ar ? 'حفظ كصورة' : 'Save as image'}" aria-label="${ar ? 'حفظ كصورة' : 'Save as image'}">${icon('download')}</button>` : ''}
      <button id="theme" type="button" class="icon-btn" aria-pressed="false" aria-label="${ar ? 'تغيير وضع الألوان' : 'Change color mode'}" title="${ar ? 'تغيير وضع الألوان' : 'Change color mode'}"><svg data-theme-icon aria-hidden="true" viewBox="0 0 24 24"></svg></button>
    </nav></header><main style="--dir:${dir}"><div class="title-block"><h1 dir="auto">${escape(title)}</h1>${status === 200 ? meta : ''}</div>
    ${status === 200 ? `<nav id="zoom" hidden aria-label="${ar ? 'التكبير' : 'Zoom'}">
      <button type="button" id="zoom-in" aria-label="${ar ? 'تكبير' : 'Zoom in'}">+</button>
      <span id="zoom-level">100%</span>
      <button type="button" id="zoom-out" aria-label="${ar ? 'تصغير' : 'Zoom out'}">−</button></nav>
      <div class="sheet" tabindex="0" aria-label="${ar ? 'نتائج البطولة' : 'Bracket results'}">${svg}</div>`
      : `<p>${message}</p>${status === 503 ? `<a class="retry" href="?lang=${lang}">${ar ? 'إعادة المحاولة' : 'Try again'}</a>` : ''}`}
    </main><div id="page-toast" role="status" aria-live="polite" aria-atomic="true"></div><script nonce="${nonce}">document.getElementById('theme').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'light'));${controls}</script></body></html>`;

  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src 'self' blob: data:; base-uri 'none'; frame-ancestors 'self'`,
  });
  if (choice === 'ar' || choice === 'en') headers.set('set-cookie', `plato-lang=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`);
  return new Response(html, { status, headers });
}
