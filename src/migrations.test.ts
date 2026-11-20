import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const db: D1Database = env.DB;

/** Runs every statement of one migration file, as wrangler does. */
async function apply(name: string): Promise<void> {
  const migration = env.TEST_MIGRATIONS.find((m) => m.name === name);
  if (migration === undefined) throw new Error(`missing migration ${name}`);
  await db.batch(migration.queries.map((query) => db.prepare(query)));
}

describe("0002_case_insensitive_usernames", () => {
  it("merges case variants into one lowercase row and drops the unused index", async () => {
    // Rebuild the pre-0002 state inside this test file's isolated database.
    await db.exec("DROP TABLE IF EXISTS view_counts");
    await apply("0001_init.sql");
    await db.batch([
      db
        .prepare(
          "INSERT INTO view_counts (username, views, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        )
        .bind("Octocat", 10, "2025-01-01 00:00:00", "2026-01-01 00:00:00"),
      db
        .prepare(
          "INSERT INTO view_counts (username, views, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        )
        .bind("octocat", 5, "2024-06-01 00:00:00", "2026-03-01 00:00:00"),
      db
        .prepare(
          "INSERT INTO view_counts (username, views, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        )
        .bind("solo", 7, "2025-05-05 00:00:00", "2025-05-06 00:00:00"),
    ]);

    await apply("0002_case_insensitive_usernames.sql");

    const { results } = await db
      .prepare("SELECT username, views, created_at, updated_at FROM view_counts ORDER BY username")
      .all();
    expect(results).toEqual([
      {
        username: "octocat",
        views: 15,
        created_at: "2024-06-01 00:00:00",
        updated_at: "2026-03-01 00:00:00",
      },
      {
        username: "solo",
        views: 7,
        created_at: "2025-05-05 00:00:00",
        updated_at: "2025-05-06 00:00:00",
      },
    ]);
    const indexes = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_views'")
      .all();
    expect(indexes.results).toEqual([]);
  });

  it("rejects a mixed-case key afterwards", async () => {
    await expect(
      db.prepare("INSERT INTO view_counts (username, views) VALUES ('Upper', 1)").run(),
    ).rejects.toThrow(/CHECK constraint failed/);
  });
});
