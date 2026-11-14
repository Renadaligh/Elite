/** Reads a list of player names from a file the organiser picks: .xlsx (no library: an xlsx is a zip of XML files), .csv or .txt.
 *  Takes the first column that has anything in it; skips a header row such as "name" / "الاسم". */
const HEADERS = new Set(['name', 'names', 'player', 'players', 'اسم', 'الاسم', 'الأسماء', 'اللاعب', 'اللاعبين', 'لاعب', 'اسم اللاعب']);

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const w = ds.writable.getWriter(); void w.write(data as BufferSource); void w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

async function unzip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const v = new DataView(buf), u8 = new Uint8Array(buf), out = new Map<string, Uint8Array>();
  let e = u8.length - 22;
  while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('zip');
  const n = v.getUint16(e + 10, true);
  let p = v.getUint32(e + 16, true);
  const dec = new TextDecoder();
  for (let i = 0; i < n; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
    p += 46 + nl + el + cl;
    if (!/^xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(name)) continue;
    const ds = off + 30 + v.getUint16(off + 26, true) + v.getUint16(off + 28, true);
    const raw = u8.subarray(ds, ds + csize);
    out.set(name, method === 0 ? raw : await inflate(raw));
  }
  return out;
}

const colNum = (ref: string) => [...(/^[A-Z]+/.exec(ref)?.[0] ?? 'A')].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);

async function fromXlsx(file: File): Promise<string[][]> {
  const z = await unzip(await file.arrayBuffer());
  const xml = (k: string) => { const b = z.get(k); return b ? new DOMParser().parseFromString(new TextDecoder().decode(b), 'application/xml') : null; };
  const shared = [...(xml('xl/sharedStrings.xml')?.getElementsByTagName('si') ?? [])].map((si) => [...si.getElementsByTagName('t')].map((t) => t.textContent ?? '').join(''));
  const sheetKey = [...z.keys()].filter((k) => k.startsWith('xl/worksheets/')).sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]))[0];
  const sh = sheetKey ? xml(sheetKey) : null;
  if (!sh) return [];
  const rows: string[][] = [];
  for (const row of [...sh.getElementsByTagName('row')]) {
    const r: string[] = [];
    for (const c of [...row.getElementsByTagName('c')]) {
      const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      const val = t === 's' ? shared[Number(v)] ?? '' : t === 'inlineStr' ? [...c.getElementsByTagName('t')].map((x) => x.textContent ?? '').join('') : v;
      r[colNum(c.getAttribute('r') ?? 'A1') - 1] = val;
    }
    rows.push(r);
  }
  return rows;
}

function fromText(text: string): string[][] {
  return text.replace(/^﻿/, '').split(/\r?\n/).map((l) => {
    const m = /^"((?:[^"]|"")*)"|^[^,;\t]*/.exec(l);
    return [m ? (m[1] !== undefined ? m[1].replace(/""/g, '"') : m[0]) : l];
  });
}

export async function readNames(file: File): Promise<string[]> {
  const rows = /\.xlsx$/i.test(file.name) ? await fromXlsx(file) : fromText(await file.text());
  const width = Math.max(0, ...rows.map((r) => r.length));
  let col = 0;
  for (; col < width; col++) if (rows.some((r) => (r[col] ?? '').trim())) break;
  const names = rows.map((r) => (r[col] ?? '').trim()).filter(Boolean);
  if (names.length && HEADERS.has(names[0].toLowerCase())) names.shift();
  return [...new Set(names.map((n) => n.slice(0, 40)))];
}

/** Splits pasted text into names: one per line (commas / semicolons / Arabic comma also work). */
export const splitNames = (text: string): string[] => [...new Set(text.split(/[\n\r,;،]+/).map((s) => s.trim().slice(0, 40)).filter(Boolean))];
