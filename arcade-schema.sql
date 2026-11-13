-- Plato Bounce (hero arcade): weekly leaderboard. Run once on the live database.
CREATE TABLE IF NOT EXISTS arcade_scores (
  week INTEGER NOT NULL, name_key TEXT NOT NULL, name TEXT NOT NULL,
  score INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  PRIMARY KEY (week, name_key)
);
CREATE INDEX IF NOT EXISTS arcade_rank ON arcade_scores (week, score DESC);
CREATE TABLE IF NOT EXISTS arcade_hits (ip_hash TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS arcade_hits_ip ON arcade_hits (ip_hash, at);
