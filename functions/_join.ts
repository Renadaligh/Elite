import { str, validId, validIds, type Ctx } from './_lib';

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

/** The number of registered people the registration page shows: everybody, not only those who used this link. A tournament run by the site admins: the counter of its card on the site (link + site form + what the admin typed);
 *  an organiser's bracket: link sign-ups + sign-ups through the site's own form. Never lower than the link's own count. */
export async function joinShownCount(env: Ctx['env'], id: string, viaLink: number): Promise<number> {
  try {
    const t = await env.DB.prepare('SELECT filled FROM tournaments WHERE id = ?').bind(id).first<{ filled: number }>();
    if (t) return Math.max(viaLink, Number(t.filled) || 0);
  } catch { /* table missing */ }
  try {
    const n = (await env.DB.prepare('SELECT COUNT(*) AS n FROM registrations WHERE tournament_id = ?').bind(`u-${id}`).first<{ n: number }>())?.n ?? 0;
    return viaLink + n;
  } catch { return viaLink; }
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

/* ---- the display name of a registrant, changed by the organiser / admin. It lives in the registrant's own row (column `rname` of registrations / bracket_signups,
 *      added by itself the first time one is renamed); the registered Plato ID / team name is never touched. ---- */
export const cleanName = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 80) : '');
const nk = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const tableOf = (src: AnsSrc) => (src === 'r' ? 'registrations' : 'bracket_signups');
const scopeCol = (src: AnsSrc) => (src === 'r' ? 'tournament_id' : 'bracket_id');

async function ensureNameCol(env: Ctx['env'], src: AnsSrc): Promise<void> {
  try { await env.DB.prepare(`SELECT rname FROM ${tableOf(src)} LIMIT 1`).first(); }
  catch { await env.DB.prepare(`ALTER TABLE ${tableOf(src)} ADD COLUMN rname TEXT NOT NULL DEFAULT ''`).run(); }
}

/** row id → display name, for the lists. `scope` = the bracket id (link sign-ups) or the tournament id (site registrations); null = every row. Empty when nobody was ever renamed. */
export async function namesMap(env: Ctx['env'], scope: string | null, src: AnsSrc): Promise<Record<number, string>> {
  const out: Record<number, string> = {};
  try {
    const q = scope === null
      ? env.DB.prepare(`SELECT id, rname FROM ${tableOf(src)} WHERE rname <> '' LIMIT 20000`)
      : env.DB.prepare(`SELECT id, rname FROM ${tableOf(src)} WHERE ${scopeCol(src)} = ? AND rname <> '' LIMIT 5000`).bind(scope);
    for (const r of (await q.all<{ id: number; rname: string }>()).results ?? []) out[r.id] = r.rname;
  } catch { /* column not added yet: nobody was renamed */ }
  return out;
}
export const withNames = <T extends { id: number }>(rows: T[], names: Record<number, string>): (T & { rname?: string })[] => rows.map((r) => (names[r.id] ? { ...r, rname: names[r.id] } : r));

async function putName(env: Ctx['env'], src: AnsSrc, id: number, scope: string, name: string): Promise<void> {
  await ensureNameCol(env, src);
  await env.DB.prepare(`UPDATE ${tableOf(src)} SET rname = ? WHERE id = ? AND ${scopeCol(src)} = ?`).bind(name, id, scope).run();
}

/** Renames one registrant for good: the new name becomes the registered one (the Plato ID of a solo player, the team name of a team), the old one is gone, and every answer
 *  the person gave in the form stays. Body: { name, src: 'j'|'r', rid } for a row in the list, or { name, from } for "the registrant now shown as <from>" (a name changed in the bracket itself).
 *  `bracketId` holds the registration-link sign-ups, `regTid` the site-form registrations. */
type SRow = { id: number; mode: string; plato_id: string; team_name: string; members?: string; rname?: string };
export async function applyRename(env: Ctx['env'], bracketId: string, regTid: string, b: Record<string, unknown>): Promise<{ ok: boolean; status: number; error?: string }> {
  const name = cleanName(b.name);
  try {
    const none = { results: [] as SRow[] };
    const sj = ((await env.DB.prepare('SELECT id, mode, plato_id, team_name, members FROM bracket_signups WHERE bracket_id = ? LIMIT 5000').bind(bracketId).all<SRow>().catch(() => none)).results ?? []);
    const sr = ((await env.DB.prepare('SELECT id, mode, plato_id, team_name, members FROM registrations WHERE tournament_id = ? LIMIT 5000').bind(regTid).all<SRow>().catch(() => none)).results ?? []);
    const jn = await namesMap(env, bracketId, 'j'), rn = await namesMap(env, regTid, 'r');
    const shown = (r: SRow, own?: string) => nk(own || (r.mode === 'team' ? r.team_name : r.plato_id));
    let src: AnsSrc | '' = '', row: SRow | undefined, scope = '';
    if (b.rid !== undefined) {
      src = b.src === 'r' ? 'r' : b.src === 'j' ? 'j' : '';
      const rid = Number(b.rid);
      if (!src || !Number.isInteger(rid)) return { ok: false, status: 400, error: 'invalid' };
      scope = src === 'j' ? bracketId : regTid;
      row = (src === 'j' ? sj : sr).find((r) => r.id === rid);
      if (!row) return { ok: false, status: 404, error: 'not_found' };
    } else {
      const from = nk(cleanName(b.from));
      if (!from || !name) return { ok: true, status: 200 }; // nothing to match
      row = sj.find((r) => shown(r, jn[r.id]) === from);
      if (row) { src = 'j'; scope = bracketId; }
      else { row = sr.find((r) => shown(r, rn[r.id]) === from); if (row) { src = 'r'; scope = regTid; } }
      if (!row || !src) return { ok: true, status: 200 };
    }
    const nm = str(b.name, 80).replace(/\s+/g, ' ');
    if (!nm) return { ok: false, status: 400, error: 'required' };
    const me = row, mySrc = src;
    const key = (v: string) => v.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
    const isMe = (x: { r: SRow & { members?: string }; s: string }) => x.s === mySrc && x.r.id === me.id;
    const rows = [...sj.map((r) => ({ r, s: 'j' })), ...sr.map((r) => ({ r, s: 'r' }))] as { r: SRow & { members?: string }; s: string }[];
    if (me.mode === 'team') {
      // a team is its list of IDs (shown as "a | b | c"): the typed name is read back as that list, with the registration form's rules
      const ids = nm.split(/[|\n,،;]+/).map((v) => v.trim()).filter(Boolean);
      if (ids.length < 2) return { ok: false, status: 400, error: 'required' };
      if (!ids.every(validId)) return { ok: false, status: 400, error: 'bad_id' };
      if (new Set(ids.map(key)).size !== ids.length) return { ok: false, status: 400, error: 'duplicate_members' };
      for (const x of rows) {
        if (isMe(x)) continue;
        const theirs = [x.r.plato_id, ...(x.r.members ?? '').split(/[\n,،;]+/)].map(key);
        if (ids.some((i) => theirs.includes(key(i)))) return { ok: false, status: 409, error: 'duplicate' };
      }
      const tn = ids.join(' | ').slice(0, 80);
      await env.DB.prepare(`UPDATE ${tableOf(src)} SET plato_id = ?, team_name = ?, members = ? WHERE id = ? AND ${scopeCol(src)} = ?`).bind(ids[0], tn, ids.slice(1).join(', '), me.id, scope).run();
      await env.DB.prepare(`UPDATE ${tableOf(src)} SET rname = '' WHERE id = ?`).bind(me.id).run().catch(() => undefined);
      return { ok: true, status: 200 };
    } else {
      // a solo player: the name IS the Plato ID, so it follows the ID rule, and nobody else (captain or member included) may hold it
      if (!validId(nm)) return { ok: false, status: 400, error: 'bad_id' };
      for (const x of rows) {
        if (isMe(x)) continue;
        if (key(x.r.plato_id) === key(nm) || (x.r.members ?? '').split(/[\n,،;]+/).map(key).includes(key(nm))) return { ok: false, status: 409, error: 'duplicate' };
      }
    }
    await env.DB.prepare(`UPDATE ${tableOf(src)} SET ${me.mode === 'team' ? 'team_name' : 'plato_id'} = ? WHERE id = ? AND ${scopeCol(src)} = ?`).bind(nm, me.id, scope).run();
    await env.DB.prepare(`UPDATE ${tableOf(src)} SET rname = '' WHERE id = ?`).bind(me.id).run().catch(() => undefined); // an older display name is now the real one
    return { ok: true, status: 200 };
  } catch { return { ok: false, status: 500, error: 'migrate' }; }
}

/** Answers written out with the question titles: [{q:'Level', a:'Pro'}], in the organiser's question order (for lists and exports that have no form at hand). */
export function qaPairs(form: RegForm, answers: Answers | undefined): { q: string; a: string }[] {
  if (!answers) return [];
  return form.qs.filter((q) => answers[q.id] !== undefined).map((q) => ({ q: q.t, a: [answers[q.id]].flat().join('، ') }));
}

/** Replaces the person behind a registration with somebody else, cleanly: the new ID (or team) goes into the same row, the old ID, members, display name and answers are dropped.
 *  Body: { op: 'replace', src: 'j'|'r', rid, platoId, teamName?, members? }. The checks are the ones of a new registration, minus the row being replaced. */
export async function applyReplace(env: Ctx['env'], bracketId: string, regTid: string, b: Record<string, unknown>): Promise<{ ok: boolean; status: number; error?: string; name?: string }> {
  const src = b.src === 'r' ? 'r' : b.src === 'j' ? 'j' : '';
  const rid = Number(b.rid);
  if (!src || !Number.isInteger(rid)) return { ok: false, status: 400, error: 'invalid' };
  const keep = b.op === 'edit'; // edit: the same registration with other IDs (answers stay); replace: somebody else (answers go). Both follow the registration form's rules exactly
  const scope = src === 'j' ? bracketId : regTid;
  const key = (v: string) => v.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const idsOf = (v: string) => v.split(/[\n,،;]+/).map(key).filter(Boolean);
  try {
    const row = await env.DB.prepare(`SELECT id, mode FROM ${tableOf(src)} WHERE id = ? AND ${scopeCol(src)} = ?`).bind(rid, scope).first<{ id: number; mode: string }>();
    if (!row) return { ok: false, status: 404, error: 'not_found' };
    const team = row.mode === 'team';
    const plato = str(b.platoId, 80), members = team ? str(b.members, 600) : '';
    let teamName = team ? str(b.teamName, 80) : '';
    if (!plato || (team && !members)) return { ok: false, status: 400, error: 'required' };
    if (!validId(plato) || (team && !validIds(members))) return { ok: false, status: 400, error: 'bad_id' };
    if (team && !teamName) teamName = [plato, ...members.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)].join(' | ').slice(0, 80);
    const mine = [key(plato), ...(team ? idsOf(members) : [])];
    if (new Set(mine).size !== mine.length) return { ok: false, status: 400, error: 'duplicate_members' };
    // everybody else already registered here (site form + registration link), except the row being replaced
    const others = [
      ...((await env.DB.prepare('SELECT id, mode, plato_id, team_name, members FROM registrations WHERE tournament_id = ? LIMIT 5000').bind(regTid).all<{ id: number; mode: string; plato_id: string; team_name: string; members: string }>().catch(() => ({ results: [] }))).results ?? []).filter((r) => !(src === 'r' && r.id === rid)),
      ...((await env.DB.prepare('SELECT id, mode, plato_id, team_name, members FROM bracket_signups WHERE bracket_id = ? LIMIT 5000').bind(bracketId).all<{ id: number; mode: string; plato_id: string; team_name: string; members: string }>().catch(() => ({ results: [] }))).results ?? []).filter((r) => !(src === 'j' && r.id === rid)),
    ];
    const used = new Set<string>();
    for (const r of others) { used.add(key(r.plato_id)); idsOf(r.members ?? '').forEach((m) => used.add(m)); }
    if (team && others.some((r) => r.mode === 'team' && key(r.team_name) === key(teamName))) return { ok: false, status: 409, error: 'duplicate_team' };
    if (mine.some((m) => used.has(m))) return { ok: false, status: 409, error: 'duplicate' };
    await env.DB.prepare(`UPDATE ${tableOf(src)} SET plato_id = ?, team_name = ?, members = ? WHERE id = ? AND ${scopeCol(src)} = ?`).bind(plato, teamName, members, rid, scope).run();
    await env.DB.prepare(`UPDATE ${tableOf(src)} SET rname = '' WHERE id = ?`).bind(rid).run().catch(() => undefined); // only when a display name was ever added
    if (!keep) await deleteAnswers(env, src, rid);
    return { ok: true, status: 200, name: team ? teamName : plato };
  } catch { return { ok: false, status: 500, error: 'migrate' }; }
}
