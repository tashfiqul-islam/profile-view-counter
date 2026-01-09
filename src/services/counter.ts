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
    .first<{ views: number }>()

  return result?.views ?? 1
}
