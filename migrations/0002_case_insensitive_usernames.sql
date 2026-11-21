-- GitHub logins are case-insensitive: merge case variants into one lowercase row. The Worker
-- lowercases usernames before counting, so new rows are lowercase. There is deliberately no
-- CHECK constraint: the Worker version still serving during a deploy, or one rolled back to,
-- writes mixed-case keys and must keep working. Rebuilding the table also drops idx_views, which
-- no query used and which doubled the rows written by every increment.
CREATE TABLE view_counts_new (
    username TEXT PRIMARY KEY NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO view_counts_new (username, views, created_at, updated_at)
SELECT lower(username), SUM(views), MIN(created_at), MAX(updated_at)
FROM view_counts
GROUP BY lower(username);

DROP TABLE view_counts;

ALTER TABLE view_counts_new RENAME TO view_counts;
