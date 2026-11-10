/** Detect the real image type from the first bytes (never trust the browser's Content-Type). Not a route. */
export function sniff(b: Uint8Array): { ext: string; type: string } | null {
  const at = (i: number, s: string) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0));
  if (b[0] === 0x89 && at(1, 'PNG')) return { ext: 'png', type: 'image/png' };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (at(0, 'RIFF') && at(8, 'WEBP')) return { ext: 'webp', type: 'image/webp' };
  if (at(0, 'GIF8')) return { ext: 'gif', type: 'image/gif' };
  return null;
}
