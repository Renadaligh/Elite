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
  tier TEXT NOT NULL DEFAULT 'regular',
  register_url TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
  winner_en TEXT NOT NULL DEFAULT '', winner_ar TEXT NOT NULL DEFAULT '', winner_members TEXT NOT NULL DEFAULT '',
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
-- Games managed from the dashboard. A row overrides a built-in game with the same id (empty text = keep the default),
-- or adds a custom game (custom = 1). hidden = 1 hides the game from the site.
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  genre TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '', name_ar TEXT NOT NULL DEFAULT '',
  tagline_en TEXT NOT NULL DEFAULT '', tagline_ar TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  hidden INTEGER NOT NULL DEFAULT 0,
  custom INTEGER NOT NULL DEFAULT 0,
  tournament_only INTEGER NOT NULL DEFAULT 0,
  details TEXT NOT NULL DEFAULT ''
);
-- Existing database? Add the tournament tier once:
--   ALTER TABLE tournaments ADD COLUMN tier TEXT NOT NULL DEFAULT 'regular';
--   ALTER TABLE games ADD COLUMN tournament_only INTEGER NOT NULL DEFAULT 0;
--   ALTER TABLE games ADD COLUMN details TEXT NOT NULL DEFAULT '';
--   ALTER TABLE tournaments ADD COLUMN winner_members TEXT NOT NULL DEFAULT '';
