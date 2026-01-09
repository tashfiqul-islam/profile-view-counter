-- Profile view counts table
CREATE TABLE IF NOT EXISTS view_counts (
    username TEXT PRIMARY KEY NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_views ON view_counts(views DESC);
