import type { Env } from './_lib';

/** Posts one embed to the community's Discord channel (webhook). Never throws: a Discord problem must not break saving in the dashboard. Not a route. */
export async function discord(env: Env, request: Request, embed: { title: string; description?: string; path: string; image?: string; fields?: { name: string; value: string; inline?: boolean }[] }) {
  const hook = env.DISCORD_WEBHOOK_URL;
  if (!hook || !/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(hook)) return;
  const origin = new URL(request.url).origin;
  const abs = (u?: string) => (u ? (u.startsWith('/') ? origin + u : u) : undefined);
  const body = {
    username: 'Plato Elite',
    allowed_mentions: { parse: [] }, // text typed in the dashboard can never ping @everyone
    embeds: [{
      title: embed.title.slice(0, 250), description: embed.description?.slice(0, 600) || undefined, url: origin + embed.path,
      color: 0xd90f26, image: abs(embed.image) ? { url: abs(embed.image) } : undefined, fields: embed.fields?.slice(0, 5),
      footer: { text: 'plato-ar.com' }, timestamp: new Date().toISOString(),
    }],
  };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try { await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal }); } catch { /* ignore */ } finally { clearTimeout(t); }
}

/** Discord shows <t:…:f> in each reader's own time zone and language, so the date and time need no fixed zone. */
const fmtDate = (iso: string) => { const t = Date.parse(iso); return Number.isNaN(t) ? '' : `<t:${Math.floor(t / 1000)}:f>`; };

export const announceNews = (env: Env, request: Request, id: string, v: { title_ar: string; summary_ar: string; image: string }) =>
  discord(env, request, { title: `📰 ${v.title_ar}`, description: v.summary_ar, path: '/news', image: v.image });

export const announceTournament = (env: Env, request: Request, id: string, v: { name: { ar: string }; prize: { ar: string }; startsAt: string; total: number; mode: string; image: string }) =>
  discord(env, request, {
    title: `🏆 فتح باب التسجيل: ${v.name.ar}`, path: `/t/${id}`, image: v.image,
    description: 'سجّل الآن من صفحة البطولة في الموقع.',
    fields: [
      { name: 'الموعد', value: fmtDate(v.startsAt) || '—', inline: true },
      { name: 'المقاعد', value: v.total > 0 ? `${v.total} ${v.mode === 'team' ? 'فريق' : 'لاعب'}` : 'غير محدود', inline: true },
      ...(v.prize.ar ? [{ name: 'الجائزة', value: v.prize.ar.slice(0, 200), inline: true }] : []),
    ],
  });
