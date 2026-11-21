import { useEffect, useState, type ImgHTMLAttributes } from 'react';

/** An <img> that tries again (3 times, with a short pause) when the request fails, and shows nothing instead of the browser's broken-picture icon if it never loads. */
export default function RetryImg({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const [tries, setTries] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setTries(0); setFailed(false); }, [src]);
  if (failed) return null;
  const url = tries > 0 ? `${src}${src.includes('?') ? '&' : '?'}r=${tries}` : src;
  const onError = () => {
    if (tries >= 3) { setFailed(true); return; }
    window.setTimeout(() => setTries((n) => n + 1), 1200 * (tries + 1));
  };
  return <img key={tries} {...rest} src={url} onError={onError} />;
}
