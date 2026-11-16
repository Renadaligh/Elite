import { readPerms } from './_admin';
import { emailOn } from './_auth';
import type { Env } from './_lib';

export const MAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** Sends one email through Resend (same setup as the sign-in link). Never throws: a mail problem must not break saving or reviewing. Not a route. */
export async function sendMail(env: Env, to: string[], subject: string, h: string, text: string, link: { href: string; label: string }) {
  if (!emailOn(env)) return;
  const list = to.filter((t) => MAIL.test(t));
  if (!list.length) return;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;background:#0b0b10;color:#fff;padding:32px;border-radius:14px;max-width:480px"><h2 style="margin:0 0 10px">${esc(h)}</h2><p style="color:#b8bdd0;line-height:1.7;white-space:pre-line">${esc(text)}</p><p><a href="${esc(link.href)}" style="display:inline-block;background:#3d7bff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">${esc(link.label)}</a></p></div>`;
  try {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM, to: list, subject, html }) });
  } catch { /* ignore */ }
}

/** Admins who hear about tournaments waiting for review: each admin account adds its own email in the dashboard (the main admin, or anyone allowed to edit tournaments). */
export async function adminEmails(env: Env): Promise<string[]> {
  try {
    const rows = (await env.DB.prepare("SELECT email, role, perms FROM admins WHERE disabled = 0 AND locked = 0 AND email != ''").all<{ email: string; role: string; perms: string }>()).results ?? [];
    return [...new Set(rows.filter((r) => r.role === 'owner' || readPerms(r.perms).tournaments?.includes('edit')).map((r) => r.email.trim()).filter((e) => MAIL.test(e)))];
  } catch { return []; } // column not added yet
}

/** Where an organiser's review results go: the address they gave for notifications, else their account's email. */
export async function organizerEmail(env: Env, userId: string): Promise<string> {
  try {
    const r = await env.DB.prepare('SELECT email, notify_email FROM users WHERE id = ?').bind(userId).first<{ email: string; notify_email: string }>();
    return (r?.notify_email || r?.email || '').trim();
  } catch {
    try { return ((await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>())?.email ?? '').trim(); } catch { return ''; }
  }
}
