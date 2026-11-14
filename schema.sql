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
  winner_en TEXT NOT NULL DEFAULT '', winner_ar TEXT NOT NULL DEFAULT '', winner_members TEXT NOT NULL DEFAULT '', image_pos TEXT NOT NULL DEFAULT '', bracket TEXT NOT NULL DEFAULT '', stream_url TEXT NOT NULL DEFAULT '', stream_live INTEGER NOT NULL DEFAULT 0,
  owner_id TEXT NOT NULL DEFAULT '', bracket_id TEXT NOT NULL DEFAULT '',
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
--   ALTER TABLE tournaments ADD COLUMN image_pos TEXT NOT NULL DEFAULT '';
--   ALTER TABLE tournaments ADD COLUMN bracket TEXT NOT NULL DEFAULT '';
--   ALTER TABLE tournaments ADD COLUMN stream_url TEXT NOT NULL DEFAULT '';
--   ALTER TABLE tournaments ADD COLUMN stream_live INTEGER NOT NULL DEFAULT 0;
--   Community tournaments (listed by bracket-tool users): run these two, one at a time.
--   ALTER TABLE tournaments ADD COLUMN owner_id TEXT NOT NULL DEFAULT '';
--   ALTER TABLE tournaments ADD COLUMN bracket_id TEXT NOT NULL DEFAULT '';

-- Visitor accounts + the public bracket tool (Discord / Google sign-in). New installs get these from this file;
-- existing databases: run each CREATE below once in the D1 console (one statement at a time).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, provider TEXT NOT NULL, provider_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', avatar TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_provider ON users (provider, provider_id);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS user_brackets (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  share INTEGER NOT NULL DEFAULT 0, live INTEGER NOT NULL DEFAULT 0, stream_url TEXT NOT NULL DEFAULT ''
);
-- Existing databases (user_brackets already created): run these two, one at a time.
--   ALTER TABLE user_brackets ADD COLUMN share INTEGER NOT NULL DEFAULT 0;
--   ALTER TABLE user_brackets ADD COLUMN live INTEGER NOT NULL DEFAULT 0;   -- (= "stream is on now")
--   ALTER TABLE user_brackets ADD COLUMN stream_url TEXT NOT NULL DEFAULT '';
-- Email sign-in links (one-time, 15 minutes):
CREATE TABLE IF NOT EXISTS login_links (
  token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS user_brackets_user ON user_brackets (user_id, updated_at);

-- Admin accounts (the owner row is created automatically at the first owner login)
CREATE TABLE IF NOT EXISTS admins (
  username TEXT PRIMARY KEY,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  perms TEXT NOT NULL DEFAULT '{}',
  must_change INTEGER NOT NULL DEFAULT 1,
  temp_expires INTEGER NOT NULL DEFAULT 0,
  disabled INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT 0,
  last_login INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  recovery INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(username);

-- Admin audit log: append-only (the app only ever INSERTs; there is no update/delete route). Kept forever. No IP addresses.
CREATE TABLE IF NOT EXISTS admin_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_admin_log_at ON admin_log(at);
-- Optional hard lock at database level (run each as ONE statement): rows can then never be changed even by mistake.
-- CREATE TRIGGER IF NOT EXISTS admin_log_no_update BEFORE UPDATE ON admin_log BEGIN SELECT RAISE(ABORT, 'append-only'); END;
-- CREATE TRIGGER IF NOT EXISTS admin_log_no_delete BEFORE DELETE ON admin_log BEGIN SELECT RAISE(ABORT, 'append-only'); END;
