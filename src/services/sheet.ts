/** Minimal Google-Sheets (published CSV) reader. Rows come back as header → value maps. */
export type Row = Record<string, string>;

export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) out.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) out.push(row);
  return out;
}

const cache = new Map<string, { at: number; rows: Promise<Row[]> }>();
const TTL = 60_000;

export function fetchRows(url: string, signal?: AbortSignal): Promise<Row[]> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.rows;
  const rows = fetch(url, { signal, cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error(`Sheet request failed (${r.status})`); return r.text(); })
    .then((txt) => {
      const [head, ...body] = parseCsv(txt);
      if (!head) return [];
      const keys = head.map((h) => h.trim().toLowerCase());
      return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])) as Row);
    });
  cache.set(url, { at: Date.now(), rows });
  rows.catch(() => cache.delete(url));
  return rows;
}

/** Rows with published = FALSE / no / 0 / لا are drafts and skipped. Empty cell = published. */
export const isPublished = (r: Row) => !['false', 'no', '0', 'لا', 'مسودة', 'draft'].includes((r.published ?? '').toLowerCase());

/** Only http(s) links, site-relative paths and #anchors are accepted (blocks javascript: etc.). */
export function safeUrl(v: string): string | undefined {
  const s = v.trim();
  return /^(https?:\/\/|\/|#)/i.test(s) ? s : undefined;
}

/** Plain date-times are read as Riyadh time (+03:00); an explicit offset or Z is kept. Returns undefined if invalid. */
export function toIso(v: string): string | undefined {
  let s = v.trim().replace(' ', 'T');
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00';
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) s += '+03:00';
  return Number.isNaN(Date.parse(s)) ? undefined : s;
}

/** Image cell → usable src: full URLs and /paths as-is, anything else is relative to the site base. */
export function assetUrl(v: string): string | undefined {
  const s = v.trim();
  if (!s) return undefined;
  return /^(https?:\/\/|\/)/i.test(s) ? s : import.meta.env.BASE_URL + s;
}
