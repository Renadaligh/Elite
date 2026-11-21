import type { ReactNode } from 'react';

/** Turns links typed in the organiser's message into clickable ones (http/https, www. and a few well-known short domains only; everything else stays plain text). */
const LINK = /((?:https?:\/\/|www\.|(?:discord\.gg|discord\.com|twitter\.com|x\.com|youtube\.com|youtu\.be|twitch\.tv|instagram\.com|tiktok\.com|t\.me|wa\.me|forms\.gle)\/)[^\s<>"'،؛]+)/gi;
export function linkify(text: string): ReactNode[] {
  return text.split(LINK).map((part, i) => {
    if (i % 2 === 0) return part;
    const m = part.match(/^(.*?)([.,;:!?)\]]*)$/);
    const url = m ? m[1] : part, tail = m ? m[2] : '';
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return <span key={i}><a href={href} target="_blank" rel="noopener noreferrer nofollow" dir="ltr" style={{ color: 'var(--link-on)', textDecoration: 'underline', wordBreak: 'break-all' }}>{url}</a>{tail}</span>;
  });
}
