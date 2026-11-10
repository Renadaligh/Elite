import { emailOn, hex, sameOrigin, sha256 } from '../../_auth';
import { body, json, str, type Ctx } from '../../_lib';

const MAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const T = {
  ar: { subject: 'رابط الدخول إلى أداة تنظيم البطولات', h: 'أهلاً بك في أداة تنظيم البطولات', p: 'اضغط الزر لتسجيل الدخول. الرابط صالح 15 دقيقة ويعمل مرة واحدة.', b: 'تسجيل الدخول', x: 'إذا لم تطلب هذا الرابط تجاهل الرسالة.', dir: 'rtl' },
  en: { subject: 'Your sign-in link for the Bracket Tool', h: 'Welcome to the Bracket Tool', p: 'Press the button to sign in. The link is valid for 15 minutes and works once.', b: 'Sign in', x: 'If you did not ask for this link, ignore this email.', dir: 'ltr' },
} as const;

/** Passwordless sign-in: we email a one-time link (needs RESEND_API_KEY + MAIL_FROM). */
export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  if (!emailOn(env)) return json({ error: 'unavailable' }, 400);
  const b = await body(request);
  const email = str(b.email, 120).toLowerCase();
  if (!MAIL.test(email)) return json({ error: 'invalid' }, 400);
  const t = T[b.lang === 'en' ? 'en' : 'ar'];
  const now = Date.now();
  // One link per address per minute (stops the form being used to spam someone's inbox).
  const recent = await env.DB.prepare('SELECT 1 AS x FROM login_links WHERE email = ? AND created_at > ?').bind(email, now - 60000).first();
  if (recent) return json({ ok: true });
  await env.DB.prepare('DELETE FROM login_links WHERE expires_at < ?').bind(now).run();
  const token = hex(24);
  await env.DB.prepare('INSERT INTO login_links (token_hash, email, created_at, expires_at) VALUES (?,?,?,?)').bind(await sha256(token), email, now, now + 15 * 60000).run();
  const link = `${new URL(request.url).origin}/api/auth/verify?t=${token}`;
  const html = `<div dir="${t.dir}" style="font-family:Arial,sans-serif;background:#0b0b10;color:#fff;padding:32px;border-radius:14px;max-width:460px"><h2 style="margin:0 0 10px">${t.h}</h2><p style="color:#b8bdd0">${t.p}</p><p><a href="${link}" style="display:inline-block;background:#ff3347;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${t.b}</a></p><p style="color:#6c7088;font-size:12px">${t.x}</p></div>`;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM, to: [email], subject: t.subject, html }) });
  if (!r.ok) return json({ error: 'send' }, 502);
  return json({ ok: true });
};
