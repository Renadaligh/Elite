import type { Ctx } from './_lib';

/** Registration link of a bracket (#/join/<id>): settings live in `bracket_join`, the sign-ups in `bracket_signups`. */
export interface JoinRow { bracket_id: string; user_id: string; enabled: number; mode: string; cap: number; closes_at: number; closed: number }

export async function joinRow(env: Ctx['env'], id: string): Promise<JoinRow | null> {
  try { return await env.DB.prepare('SELECT bracket_id, user_id, enabled, mode, cap, closes_at, closed FROM bracket_join WHERE bracket_id = ?').bind(id).first<JoinRow>(); } catch { return null; }
}

/** Why sign-ups are not accepted right now ('' = open). Manual close, the optional closing time and the optional cap all count. */
export function joinReason(r: JoinRow, count: number, now = Date.now()): '' | 'closed' | 'full' {
  if (r.closed || (r.closes_at > 0 && now >= r.closes_at)) return 'closed';
  if (r.cap > 0 && count >= r.cap) return 'full';
  return '';
}

/** Title + bracket data of the thing a registration link belongs to: an organiser's bracket, or a tournament the site admins run (same id space, the bracket wins). */
export async function bracketOf(env: Ctx['env'], id: string): Promise<{ title: string; data: string } | null> {
  const b = await env.DB.prepare('SELECT title, data FROM user_brackets WHERE id = ?').bind(id).first<{ title: string; data: string }>().catch(() => null);
  if (b) return b;
  const t = await env.DB.prepare('SELECT name_ar, name_en, bracket FROM tournaments WHERE id = ?').bind(id).first<{ name_ar: string; name_en: string; bracket: string }>().catch(() => null);
  return t ? { title: t.name_ar || t.name_en, data: t.bracket || '{}' } : null;
}

export async function joinCount(env: Ctx['env'], id: string): Promise<number> {
  try { return (await env.DB.prepare('SELECT COUNT(*) AS n FROM bracket_signups WHERE bracket_id = ?').bind(id).first<{ n: number }>())?.n ?? 0; } catch { return 0; }
}

/** Optional description of the registration page. Own query: works before the `description` column exists. */
export async function joinDescPair(env: Ctx['env'], id: string): Promise<{ ar: string; en: string }> {
  try { return unpackDesc((await env.DB.prepare('SELECT description FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ description: string }>())?.description ?? ''); } catch { return { ar: '', en: '' }; }
}
export const joinDesc = async (env: Ctx['env'], id: string): Promise<string> => (await joinDescPair(env, id)).ar;

/** The description is plain text (organisers: one version), or {"ar":…,"en":…} when the site admins wrote one version per language (same column, no migration). */
export function unpackDesc(raw: string): { ar: string; en: string } {
  const t = (raw ?? '').trim();
  if (t.startsWith('{')) {
    try { const o = JSON.parse(t) as { ar?: unknown; en?: unknown }; if (o && typeof o === 'object') return { ar: typeof o.ar === 'string' ? o.ar : '', en: typeof o.en === 'string' ? o.en : '' }; } catch { /* plain text that starts with { */ }
  }
  return { ar: t, en: '' };
}
export const packDesc = (ar: string, en: string): string => (en.trim() ? JSON.stringify({ ar: ar.trim(), en: en.trim() }) : ar.trim());

/** Optional message the organiser shows after someone registers (own query: works before the `done_msg` column exists). */
export async function joinDoneMsgPair(env: Ctx['env'], id: string): Promise<{ ar: string; en: string }> {
  try { return unpackDesc((await env.DB.prepare('SELECT done_msg FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ done_msg: string }>())?.done_msg ?? ''); } catch { return { ar: '', en: '' }; }
}
export const joinDoneMsg = async (env: Ctx['env'], id: string): Promise<string> => (await joinDoneMsgPair(env, id)).ar;

/** Optional English title of the registration page (own query, works before the `title_en` column exists). */
export async function joinTitleEn(env: Ctx['env'], id: string): Promise<string> {
  try {
    const b = await env.DB.prepare('SELECT data FROM user_brackets WHERE id = ?').bind(id).first<{ data: string }>();
    if (b) { const v = (JSON.parse(b.data) as { titleEn?: unknown }).titleEn; if (typeof v === 'string' && v.trim()) return v.trim(); }
  } catch { /* fall back to legacy registration title */ }
  try { const v = (await env.DB.prepare('SELECT title_en FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ title_en: string }>())?.title_en ?? ''; if (v) return v; } catch { /* column not there yet */ }
  // an English name the admin added to the published tournament (differs from the Arabic one the organiser typed)
  try { const t = await env.DB.prepare('SELECT name_en, name_ar FROM tournaments WHERE id IN (?, ?) ORDER BY id DESC LIMIT 1').bind(`u-${id}`, id).first<{ name_en: string; name_ar: string }>(); if (t && t.name_en && t.name_en !== t.name_ar) return t.name_en; } catch { /* no tournament */ }
  return '';
}

/** Cover picture + start date of the registration page. Separate query so the page keeps working before the two columns are added (see schema.sql). */
export async function joinExtra(env: Ctx['env'], id: string): Promise<{ cover: string; startsAt: string }> {
  try { const r = await env.DB.prepare('SELECT cover, starts_at FROM bracket_join WHERE bracket_id = ?').bind(id).first<{ cover: string; starts_at: string }>(); return { cover: r?.cover ?? '', startsAt: r?.starts_at ?? '' }; } catch { return { cover: '', startsAt: '' }; }
}

/* ───────── Questions of the registration page (organiser's own form) ─────────
 * Two NEW tables, created the first time an organiser saves a form (CREATE TABLE IF NOT EXISTS), so no manual migration and no existing table changes.
 * Reads never create anything and fall back to "no questions", so the registration page keeps working exactly as before when the tables are missing. */
export interface FormQ { id: string; t: string; k: 'short' | 'para' | 'choice' | 'multi'; r: boolean; o: string[] }
export interface RegForm { hue: number | null; qs: FormQ[]; idl?: string }
export const NO_FORM: RegForm = { hue: null, qs: [] };
const MAX_Q = 20, MAX_OPT = 20;
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

/** Keeps only what we know, with limits. null = not an object at all. */
export function cleanForm(raw: unknown): RegForm | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = raw as { hue?: unknown; qs?: unknown; idl?: unknown };
  const hue = typeof x.hue === 'number' && Number.isFinite(x.hue) ? ((Math.round(x.hue) % 360) + 360) % 360 : null;
  const qs: FormQ[] = [];
  const seen = new Set<string>();
  for (const q of Array.isArray(x.qs) ? x.qs.slice(0, MAX_Q) : []) {
    const o = q as Record<string, unknown>;
    const id = typeof o.id === 'string' && /^[a-z0-9]{1,8}$/.test(o.id) && !seen.has(o.id) ? o.id : '';
    const t = clip(o.t, 120);
    const k = o.k === 'para' || o.k === 'choice' || o.k === 'multi' ? o.k : 'short';
    if (!id || !t) continue;
    seen.add(id);
    const opts = k === 'choice' || k === 'multi' ? [...new Set((Array.isArray(o.o) ? o.o : []).map((s) => clip(s, 80)).filter(Boolean))].slice(0, MAX_OPT) : [];
    if ((k === 'choice' || k === 'multi') && opts.length < 2) continue;
    qs.push({ id, t, k, r: o.r === true, o: opts });
  }
  const idl = clip(x.idl, 60);
  return idl ? { hue, qs, idl } : { hue, qs };
}

async function ensureForm(env: Ctx['env']): Promise<void> {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS bracket_form (bracket_id TEXT PRIMARY KEY, form TEXT NOT NULL DEFAULT \'\')').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS bracket_answers (src TEXT NOT NULL DEFAULT \'j\', signup_id INTEGER NOT NULL, bracket_id TEXT NOT NULL, answers TEXT NOT NULL DEFAULT \'\', PRIMARY KEY (src, signup_id))').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS bracket_answers_b ON bracket_answers (bracket_id)').run();
}

export async function joinForm(env: Ctx['env'], id: string): Promise<RegForm> {
  try {
    const r = await env.DB.prepare('SELECT form FROM bracket_form WHERE bracket_id = ?').bind(id).first<{ form: string }>();
    return (r?.form ? cleanForm(JSON.parse(r.form)) : null) ?? NO_FORM;
  } catch { return NO_FORM; }
}

export async function saveForm(env: Ctx['env'], id: string, form: RegForm): Promise<void> {
  await ensureForm(env);
  await env.DB.prepare('INSERT INTO bracket_form (bracket_id, form) VALUES (?, ?) ON CONFLICT(bracket_id) DO UPDATE SET form = excluded.form').bind(id, JSON.stringify(form)).run();
}

export type Answers = Record<string, string | string[]>;

/** Checks what a player sent against the organiser's questions. Unknown questions and options are dropped; a missing required answer fails with that question's id. */
export function checkAnswers(form: RegForm, raw: unknown): { ok: true; answers: Answers } | { ok: false; q: string } {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const answers: Answers = {};
  for (const q of form.qs) {
    const v = src[q.id];
    if (q.k === 'short' || q.k === 'para') {
      const s = typeof v === 'string' ? (q.k === 'short' ? v.replace(/\s+/g, ' ') : v.replace(/\r\n/g, '\n')).trim().slice(0, q.k === 'short' ? 200 : 1000) : '';
      if (s) answers[q.id] = s; else if (q.r) return { ok: false, q: q.id };
    } else if (q.k === 'choice') {
      const s = typeof v === 'string' && q.o.includes(v) ? v : '';
      if (s) answers[q.id] = s; else if (q.r) return { ok: false, q: q.id };
    } else {
      const a = [...new Set(Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && q.o.includes(s)) : [])];
      if (a.length) answers[q.id] = a; else if (q.r) return { ok: false, q: q.id };
    }
  }
  return { ok: true, answers };
}

/** src: 'j' = signed up through the registration link (bracket_signups), 'r' = through the site's own form (registrations) */
export type AnsSrc = 'j' | 'r';
export async function saveAnswers(env: Ctx['env'], src: AnsSrc, signupId: number, bracketId: string, answers: Answers): Promise<void> {
  if (!Object.keys(answers).length) return;
  try {
    await ensureForm(env);
    await env.DB.prepare('INSERT OR REPLACE INTO bracket_answers (src, signup_id, bracket_id, answers) VALUES (?, ?, ?, ?)').bind(src, signupId, bracketId, JSON.stringify(answers)).run();
  } catch { /* the sign-up itself is already saved; answers are a bonus */ }
}

/** signup id → answers, for the organiser's list. Empty when the table does not exist. */
export async function answersMap(env: Ctx['env'], bracketId: string, src: AnsSrc = 'j'): Promise<Record<number, Answers>> {
  const out: Record<number, Answers> = {};
  try {
    const { results } = await env.DB.prepare('SELECT signup_id, answers FROM bracket_answers WHERE src = ? AND bracket_id = ? LIMIT 5000').bind(src, bracketId).all<{ signup_id: number; answers: string }>();
    for (const r of results ?? []) { try { out[r.signup_id] = JSON.parse(r.answers) as Answers; } catch { /* skip */ } }
  } catch { /* no table yet */ }
  return out;
}

export async function deleteAnswers(env: Ctx['env'], src: AnsSrc, signupId: number): Promise<void> {
  await env.DB.prepare('DELETE FROM bracket_answers WHERE src = ? AND signup_id = ?').bind(src, signupId).run().catch(() => undefined);
}

/** Answers written out with the question titles: [{q:'Level', a:'Pro'}], in the organiser's question order (for lists and exports that have no form at hand). */
export function qaPairs(form: RegForm, answers: Answers | undefined): { q: string; a: string }[] {
  if (!answers) return [];
  return form.qs.filter((q) => answers[q.id] !== undefined).map((q) => ({ q: q.t, a: [answers[q.id]].flat().join('، ') }));
}
