/** Turns a Twitch / YouTube / Kick link into a safe embed URL (null when the link isn't one of those). */
export function streamEmbed(url: string | undefined, host = typeof location !== 'undefined' ? location.hostname : ''): string | null {
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const h = u.hostname.replace(/^www\.|^m\./, '');
  const seg = u.pathname.split('/').filter(Boolean);
  if (h === 'twitch.tv' && seg[0] && /^\w{1,40}$/.test(seg[0])) return `https://player.twitch.tv/?channel=${seg[0]}&parent=${encodeURIComponent(host)}&muted=false`;
  if (h === 'kick.com' && seg[0] && /^[\w-]{1,40}$/.test(seg[0])) return `https://player.kick.com/${seg[0]}`;
  let id = '';
  if (h === 'youtu.be') id = seg[0] ?? '';
  else if (h === 'youtube.com') id = u.searchParams.get('v') || (['live', 'embed', 'shorts'].includes(seg[0]) ? seg[1] ?? '' : '');
  return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
