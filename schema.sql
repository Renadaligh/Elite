-- Elite database (Cloudflare D1). Run once: npx wrangler d1 execute plato-db --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'update',
  title_en TEXT NOT NULL DEFAULT '', title_ar TEXT NOT NULL DEFAULT '',
  summary_en TEXT NOT NULL DEFAULT '', summary_ar TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '', link TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '', name_ar TEXT NOT NULL DEFAULT '',
  format_en TEXT NOT NULL DEFAULT '', format_ar TEXT NOT NULL DEFAULT '',
  prize_en TEXT NOT NULL DEFAULT '', prize_ar TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
  filled INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL DEFAULT 1,
  mode TEXT NOT NULL DEFAULT 'solo',
  register_url TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
  winner_en TEXT NOT NULL DEFAULT '', winner_ar TEXT NOT NULL DEFAULT '', winner_image TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL, tournament_name TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'solo',
  plato_id TEXT NOT NULL, team_name TEXT NOT NULL DEFAULT '', members TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'ar',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS reg_unique ON registrations (tournament_id, lower(plato_id));
