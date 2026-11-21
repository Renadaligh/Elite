/** Shrink a picture in the browser: longest side ≤ maxDim, re-encoded as WebP. GIFs, non-images, failures and results that are not smaller come back as the original file. */
export async function shrinkImage(file: Blob, maxDim = 1400, quality = 0.82): Promise<Blob> {
  if (file.type === 'image/gif' || !file.type.startsWith('image/')) return file;
  const work = async (): Promise<Blob> => {
    try {
      const bmp = await createImageBitmap(file);
      const r = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(bmp.width * r)); c.height = Math.max(1, Math.round(bmp.height * r));
      c.getContext('2d')?.drawImage(bmp, 0, 0, c.width, c.height);
      bmp.close?.();
      const out = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/webp', quality));
      return out && out.type === 'image/webp' && out.size < file.size ? out : file;
    } catch { return file; }
  };
  // A phone that stalls must not hang the upload: after 10 s send the original.
  return Promise.race([work(), new Promise<Blob>((res) => window.setTimeout(() => res(file), 10000))]);
}
