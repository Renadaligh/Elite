import type { Bracket } from '../src/data/bracket';
import { sha256 } from './_auth';
import type { Ctx } from './_lib';
import { publicBracketSvg } from './_publicBracketSvg';

type Row = { id: string; title: string; data: string };
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const CACHE_VERSION = 'v4';

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
:root{color-scheme:dark;--bg:#0f1423;--panel:#1a2236;--fg:#e8edf8;--mut:#8a95b2;--head:#26314a;--row:#1a2236;--win:#2f5fd0;--line:#55627f;--toolbar:#0b101d;--champ-bg:#f3c93d;--champ-border:#e7b114;--champ-text:#3c2a00;--champ-sub:#6e5300}
:root[data-theme=light]{color-scheme:light;--bg:#f3f5f9;--panel:#fff;--fg:#1c2433;--mut:#6b778c;--head:#d0d8e6;--row:#e4e9f2;--win:#bfd4ff;--line:#8795ad;--toolbar:#ffffff;--champ-bg:#ffd95a;--champ-border:#e4b51d;--champ-text:#4a3400;--champ-sub:#7b5a00}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px system-ui,sans-serif}
header,main{max-width:1380px;margin:auto;padding:16px clamp(12px,4vw,36px)}
header,nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px}header{justify-content:space-between}.brand img{display:block;height:34px;width:auto;max-width:128px;object-fit:contain}:root[data-theme=light] .brand img{filter:brightness(0) saturate(100%) invert(15%) sepia(39%) saturate(1049%) hue-rotate(184deg)}
a,button{color:inherit;font:inherit}
nav a,button,.retry{border:1px solid var(--line);border-radius:10px;background:var(--toolbar);padding:7px 10px;text-decoration:none;cursor:pointer}
button:disabled{opacity:.5;cursor:default}
h1{font-size:clamp(22px,5vw,36px);margin:0 0 6px;overflow-wrap:anywhere}h2{font-size:18px}
.sheet{margin-top:14px;background:transparent;border:0;border-radius:0;overflow:auto;padding:0 0 8px;direction:ltr;scrollbar-width:none;-ms-overflow-style:none;cursor:grab;overscroll-behavior-x:contain;touch-action:pan-x pan-y}.sheet::-webkit-scrollbar{display:none}.sheet.is-dragging{cursor:grabbing;user-select:none}.sheet.is-dragging *{user-select:none}.sheet section{margin-block:14px}.sheet h2{direction:var(--dir,ltr)}
.bracket-meta{direction:var(--dir,ltr);display:flex;flex-direction:column;gap:10px;margin:5px 0 18px}.bracket-meta p{margin:0;color:var(--mut)}.bracket-meta .bracket-organizer{font-size:12px}
/* Same winner card palette and vector trophy as the original dashboard. */
.bracket-champion{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 16px;border-radius:14px;background:linear-gradient(135deg,rgba(214,165,40,.24),rgba(214,165,40,.09));border:1px solid rgba(232,184,64,.5);color:#fff;width:min(100%,420px);margin-inline:auto;text-align:center}
.bracket-champion-icon{width:26px;height:26px;flex:none;color:#f2c14e;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.bracket-champion-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.bracket-champion-label{font-size:12px;font-weight:700;color:rgba(255,224,150,.78)}.bracket-champion-name{font-size:19px;font-weight:800;color:#ffd56a;overflow-wrap:anywhere;line-height:1.2}
:root[data-theme=light] .bracket-champion{background:linear-gradient(135deg,#f7d064,#e3a92b);border-color:transparent;color:#2b1d00;box-shadow:0 8px 18px -12px rgba(200,140,10,.9)}
:root[data-theme=light] .bracket-champion-icon{color:#4d3200}:root[data-theme=light] .bracket-champion-label{color:rgba(43,29,0,.72)}:root[data-theme=light] .bracket-champion-name{color:#241800}
.sheet svg[data-width]{display:block;max-width:none;height:auto;margin:0 auto 8px;width:var(--render-width, auto)}
.bs-hd,.bs-seed{fill:var(--head);stroke:none}.bs-row{fill:var(--row);stroke:none}.bs-row.win{fill:var(--win);stroke:none}
.bs-nm,.bs-ht,.bs-sc,.bs-ck{fill:var(--fg)}.bs-nm.win{font-weight:800}.bs-sn,.bs-no,.bs-nm.lose,.bs-nm.bye{fill:var(--mut)}.bs-ln{stroke:var(--line);stroke-width:1.9}.bs-cup{stroke:#dca500}[hidden]{display:none!important}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;min-width:38px;min-height:38px;padding:7px 10px}.icon-btn svg{width:17px;height:17px;flex:none;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}.icon-btn .icon-text{font-size:13px;font-weight:700}#copy-link{position:relative}#copy-feedback{position:absolute;top:calc(100% + 5px);left:50%;transform:translate(-50%, -3px);font-size:11px;font-weight:650;white-space:nowrap;color:var(--fg);opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease}#copy-feedback[data-visible=true]{opacity:1;transform:translate(-50%, 0)}
#zoom{display:inline-flex;align-items:center;gap:6px}#zoom button{min-width:39px;min-height:39px;padding:7px 12px}#zoom-level{min-width:54px;text-align:center;font-variant-numeric:tabular-nums}
.title-block h1{margin-bottom:4px}
#page-toast{position:fixed;inset-inline-start:50%;bottom:clamp(24px,6vh,64px);transform:translateX(-50%) translateY(10px);z-index:1000;min-width:140px;max-width:calc(100vw - 32px);padding:12px 20px;border-radius:12px;background:#213b70;color:#fff;box-shadow:0 12px 36px rgba(0,0,0,.24);font-size:14px;font-weight:750;text-align:center;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}#page-toast[data-visible="true"]{opacity:1;transform:translateX(-50%) translateY(0)}
@media (max-width: 720px){header,main{padding-inline:14px}.bracket-champion{width:100%}.sheet{padding-bottom:12px}}
`;

const controls = `
document.getElementById('change-language')?.addEventListener('click', (event) => {
  event.preventDefault();
  const next = event.currentTarget.dataset.nextLang;
  if (next !== 'ar' && next !== 'en') return;
  document.cookie = 'plato-lang=' + next + '; Path=/; Max-Age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  try { localStorage.setItem('elite-lang', next); } catch {}
  location.replace(location.pathname);
});
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
let copyFeedbackTimer;
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
  const link = location.origin + '/v/' + document.body.dataset.shortId;
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
  const copySvg = copy.querySelector('svg');
  const feedback = document.getElementById('copy-feedback');
  if (feedback) {
    feedback.textContent = copied ? (root.lang === 'ar' ? 'تم النسخ' : 'Copied') : (root.lang === 'ar' ? 'تعذّر النسخ' : 'Copy failed');
    feedback.dataset.visible = 'true';
  }
  if (copySvg && !copySvg.dataset.original) copySvg.dataset.original = copySvg.innerHTML;
  if (copied && copySvg) copySvg.innerHTML = '<path d="M20 6 9 17l-5-5"/>';
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    if (copySvg?.dataset.original) copySvg.innerHTML = copySvg.dataset.original;
    if (feedback) feedback.dataset.visible = 'false';
    copy.title = root.lang === 'ar' ? 'نسخ الرابط' : 'Copy link';
  }, 2100);
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
    // Capture the ACTIVE page settings once. The exported PNG should match the
    // currently displayed language, bracket orientation and light/dark palette.
    await document.fonts?.ready;
    const exportRoot = document.documentElement;
    const exportLanguage = exportRoot.lang === 'ar' ? 'ar' : 'en';
    const exportRtl = exportLanguage === 'ar';
    const exportTheme = exportRoot.dataset.theme === 'light' ? 'light' : 'dark';
    const pageStyles = getComputedStyle(exportRoot);
    const color = (property) => pageStyles.getPropertyValue(property).trim();
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const headingFont = getComputedStyle(document.querySelector('h1') || document.body).fontFamily;
    const rules = [
      ['.bs-hd,.bs-seed', 'fill', '--head'],
      ['.bs-row', 'fill', '--row'],
      ['.bs-row.win', 'fill', '--win'],
      ['.bs-nm,.bs-ht,.bs-sc,.bs-ck', 'fill', '--fg'],
      ['.bs-sn,.bs-no,.bs-nm.lose,.bs-nm.bye', 'fill', '--mut'],
      ['.bs-ln', 'stroke', '--line'],
    ].map(([selector, property, variable]) => selector + '{' + property + ':' + color(variable) + '}').join('') + '.bs-hd,.bs-seed,.bs-row,.bs-row.win{stroke:none}.bs-nm.win{font-weight:800}.bs-cup{stroke:#dca500}';
    const padding = 36, gap = 20, titleHeight = 108, textHeight = 30, brandBoxW = 180, brandBoxH = 82;
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
    const brandImg = document.querySelector('.brand img');
    if (brandImg?.complete && brandImg.naturalWidth > 0) {
      // No colored plaque behind the logo: the logo sits directly on the page
      // background, using a dark tint in light mode to remain legible.
      const isArabic = exportRtl;
      const boxX = isArabic ? padding : totalWidth - padding - brandBoxW;
      const boxY = padding - 6;
      const logoWidth = 125;
      const logoHeight = logoWidth * brandImg.naturalHeight / brandImg.naturalWidth;
      context.save();
      if (exportTheme === 'light') context.filter = 'brightness(0) saturate(100%) invert(15%) sepia(39%) saturate(1049%) hue-rotate(184deg)';
      context.drawImage(brandImg, boxX + (brandBoxW - logoWidth) / 2, boxY + 5, logoWidth, logoHeight);
      context.restore();
      context.fillStyle = color('--fg');
      context.font = '600 15px Arial,Tahoma,sans-serif';
      context.textAlign = 'center';
      context.fillText('plato-ar.com', boxX + brandBoxW / 2, boxY + 72, brandBoxW - 16);
    }
    context.fillStyle = color('--fg');
    context.font = 'bold 28px ' + headingFont;
    const rtlExport = exportRtl;
    context.textAlign = rtlExport ? 'right' : 'left';
    context.direction = rtlExport ? 'rtl' : 'ltr';
    const titleX = rtlExport ? totalWidth - padding : padding;
    context.fillText(document.querySelector('h1')?.textContent || 'PLATO AR', titleX, padding + 36, totalWidth - padding * 2 - brandBoxW - 30);
    let y = padding + titleHeight;
    if (organizerLine) {
      context.fillStyle = color('--mut');
      context.font = '600 14px ' + bodyFont;
      context.direction = exportRtl ? 'rtl' : 'ltr';
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
      const isLightWinner = exportTheme === 'light';
      const cardGradient = context.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      if (isLightWinner) {
        cardGradient.addColorStop(0, '#f7d064');
        cardGradient.addColorStop(1, '#e3a92b');
      } else {
        // Keep the original translucent gold overlay, with the page background beneath it.
        cardGradient.addColorStop(0, 'rgba(214,165,40,.24)');
        cardGradient.addColorStop(1, 'rgba(214,165,40,.09)');
      }
      context.fillStyle = cardGradient;
      context.strokeStyle = isLightWinner ? 'rgba(0,0,0,0)' : 'rgba(232,184,64,.5)';
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
      // Original TrophyIcon path, drawn as a vector rather than an emoji.
      context.save();
      context.translate(cardX + 18, cardY + 18);
      context.scale(1.25, 1.25);
      context.strokeStyle = isLightWinner ? '#4d3200' : '#f2c14e';
      context.lineWidth = 1.9;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.stroke(new Path2D('M7 3h10v6a5 5 0 0 1-10 0V3ZM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M10 18h4'));
      context.restore();
      context.textAlign = 'center';
      context.font = '700 13px ' + bodyFont;
      context.fillStyle = isLightWinner ? 'rgba(43,29,0,.72)' : 'rgba(255,224,150,.78)';
      context.direction = exportRtl ? 'rtl' : 'ltr';
      context.fillText(championLabel, cardX + cardW / 2 + 12, cardY + 22, cardW - 82);
      context.font = '800 20px ' + bodyFont;
      context.fillStyle = isLightWinner ? '#241800' : '#ffd56a';
      context.fillText(championName, cardX + cardW / 2 + 12, cardY + 45, cardW - 82);
      y += championHeight;
    }
    for (const block of blocks) {
      if (block.heading) {
        context.fillStyle = color('--fg');
        context.font = 'bold 18px ' + bodyFont;
        context.textAlign = exportRtl ? 'right' : 'left';
        context.fillText(block.heading, titleX, y + 17, totalWidth - padding * 2);
        y += textHeight;
      }
      const clone = block.svg.cloneNode(true);
      clone.removeAttribute('style');
      clone.removeAttribute('class');
      // Keep the SVG's own typography: it already matches the displayed bracket.
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
    // Successful downloads do not show a toast; errors remain visible.
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
    // The sheet is LTR internally so its scrolling coordinates remain consistent.
    // The Arabic SVG is visually mirrored: begin at the rightmost rounds after
    // refresh and after zooming, without reversing the bracket itself.
    if (root.lang === 'ar') sheet.scrollLeft = Math.max(0, sheet.scrollWidth - sheet.clientWidth);
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
  // Backward compatibility: clean old ?lang= links while retaining the language choice in a cookie.
  if (choice === 'ar' || choice === 'en') {
    return new Response(null, { status: 302, headers: {
      location: url.pathname,
      'cache-control': 'no-store',
      'set-cookie': `plato-lang=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`,
    } });
  }
  const cookie = request.headers.get('cookie') ?? '';
  const stored = /(?:^|;\s*)plato-lang=(ar|en)(?:;|$)/.exec(cookie)?.[1];
  const lang = stored === 'ar' ? 'ar' : 'en';
  const ar = lang === 'ar';
  const dir = ar ? 'rtl' : 'ltr';
  const nonce = crypto.randomUUID();
  let title = ar ? 'عرض البطولة' : 'Bracket view';
  let shortId = params.id;
  let svg = '';
  let status = 200;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    // Public links are always enabled in the existing bracket API.
    // An exact ID always wins. Six-digit aliases resolve only if the prefix is unique.
    const row = await Promise.race([
      (async () => {
        const exact = await env.DB.prepare('SELECT id, title, data FROM user_brackets WHERE id = ?').bind(params.id).first<Row>();
        if (exact) return { row: exact, ambiguous: false };
        if (!/^[a-f0-9]{6}$/i.test(params.id)) return { row: null, ambiguous: false };
        const hits = (await env.DB.prepare('SELECT id, title, data FROM user_brackets WHERE id LIKE ? LIMIT 2').bind(params.id.toLowerCase() + '%').all<Row>()).results;
        return { row: hits.length === 1 ? hits[0] : null, ambiguous: hits.length > 1 };
      })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Database timeout')), 7000); }),
    ]);
    if (row.ambiguous) status = 409;
    else if (!row.row) status = 404;
    else {
      title = row.row.title || title;
      shortId = row.row.id.slice(0, 6);
      svg = await snapshot(request, row.row, lang, title, waitUntil);
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
  const target = ar ? 'en' : 'ar';
  const message = status === 409 ? (ar ? 'هذا الرابط المختصر مشترك بين بطولتين. استخدمي الرابط الأصلي الكامل.' : 'This short link is ambiguous. Please use the original full link.') : status === 404
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
    <link rel="icon" type="image/png" href="/brand/favicon-v2.png">
    <link rel="apple-touch-icon" href="/brand/apple-touch-icon-v2.png">
    <title>${escape(title)} · Plato AR</title><style>${styles}</style>
    <script nonce="${nonce}">try {
      document.documentElement.dataset.theme = localStorage.getItem('elite-pv-theme') === 'light' ? 'light' : 'dark';
    } catch {}</script></head><body data-short-id="${escape(shortId)}">
    <header><a class="brand" href="/" aria-label="Plato AR"><img src="/brand/plato-ar-white.png" alt="PLATO AR"></a><nav>
      <button id="change-language" type="button" class="icon-btn" data-next-lang="${target}" lang="${ar ? 'en' : 'ar'}" title="${ar ? 'Change language' : 'تغيير اللغة'}">${icon('language')}<span class="icon-text">${ar ? 'EN' : 'عربي'}</span></button>
      ${status === 200 ? `<button id="copy-link" type="button" data-copied="${ar ? 'تم النسخ ✓' : 'Copied ✓'}" data-failed="${ar ? 'تعذّر النسخ' : 'Copy failed'}" class="icon-btn" title="${ar ? 'نسخ الرابط' : 'Copy link'}" aria-label="${ar ? 'نسخ الرابط' : 'Copy link'}">${icon('copy')}<span id="copy-feedback" aria-hidden="true"></span></button>` : ''}
      ${status === 200 ? `<button id="save-image" type="button" data-saved="${ar ? 'تم الحفظ ✓' : 'Saved ✓'}" data-failed="${ar ? 'تعذّر حفظ الصورة' : 'Could not save image'}" class="icon-btn" title="${ar ? 'حفظ كصورة' : 'Save as image'}" aria-label="${ar ? 'حفظ كصورة' : 'Save as image'}">${icon('download')}</button>` : ''}
      <button id="theme" type="button" class="icon-btn" aria-pressed="false" aria-label="${ar ? 'تغيير وضع الألوان' : 'Change color mode'}" title="${ar ? 'تغيير وضع الألوان' : 'Change color mode'}"><svg data-theme-icon aria-hidden="true" viewBox="0 0 24 24"></svg></button>
    </nav></header><main style="--dir:${dir}"><div class="title-block"><h1 dir="auto">${escape(title)}</h1>${status === 200 ? meta : ''}</div>
    ${status === 200 ? `<nav id="zoom" hidden aria-label="${ar ? 'التكبير' : 'Zoom'}">
      <button type="button" id="zoom-in" aria-label="${ar ? 'تكبير' : 'Zoom in'}">+</button>
      <span id="zoom-level">100%</span>
      <button type="button" id="zoom-out" aria-label="${ar ? 'تصغير' : 'Zoom out'}">−</button></nav>
      <div class="sheet" tabindex="0" aria-label="${ar ? 'نتائج البطولة' : 'Bracket results'}">${svg}</div>`
      : `<p>${message}</p>${status === 503 ? `<a class="retry" href="${url.pathname}">${ar ? 'إعادة المحاولة' : 'Try again'}</a>` : ''}`}
    </main><div id="page-toast" role="status" aria-live="polite" aria-atomic="true"></div><script nonce="${nonce}">document.getElementById('theme').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'light'));${controls}</script></body></html>`;

  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src 'self' blob: data:; base-uri 'none'; frame-ancestors 'self'`,
  });
  return new Response(html, { status, headers });
}
