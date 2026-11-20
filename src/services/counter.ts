/**
 * Atomically adds one view for `username`, creating the row on first view.
 *
 * @param db - The `DB` D1 binding.
 * @param username - Validated GitHub username.
 * @returns The view count after the increment.
 * @throws Error when D1 returns no row, which the upsert's `RETURNING` should make impossible.
 */
export async function incrementViewCount(db: D1Database, username: string): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO view_counts (username, views, updated_at)
       VALUES (?1, 1, datetime('now'))
       ON CONFLICT(username) DO UPDATE SET
         views = views + 1,
         updated_at = datetime('now')
       RETURNING views`,
    )
    .bind(username)
    .first<{ readonly views: number }>();

  if (result === null) {
    throw new Error(`D1 increment returned no rows for username: ${username}`);
  }

  return result.views;
}
