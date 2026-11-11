/** Detect the real image type from the first bytes (never trust the browser's Content-Type). Not a route. */
export function sniff(b: Uint8Array): { ext: string; type: string } | null {
  const at = (i: number, s: string) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0));
  if (b[0] === 0x89 && at(1, 'PNG')) return { ext: 'png', type: 'image/png' };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (at(0, 'RIFF') && at(8, 'WEBP')) return { ext: 'webp', type: 'image/webp' };
  if (at(0, 'GIF8')) return { ext: 'gif', type: 'image/gif' };
  return null;
}

/** MP4 (ISO base media) or WebM (Matroska/EBML) by the first bytes. */
export function sniffVideo(b: Uint8Array): { ext: string; type: string } | null {
  if (b.length > 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return { ext: 'mp4', type: 'video/mp4' };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { ext: 'webm', type: 'video/webm' };
  return null;
}
