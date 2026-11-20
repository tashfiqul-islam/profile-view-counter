# Worker

Read when: adding or changing a route, middleware, validation, an error response, a binding, the
D1 schema or a migration.

## Rules

- **Counting semantics.** Every `GET /api/view-counter` is one view. `HEAD` gets the badge headers
  with an empty body and is not counted. The badge is sent with
  `Cache-Control: max-age=0, no-cache, no-store, must-revalidate` so GitHub's image proxy fetches
  (and counts) every README view; keep it uncacheable.
- **Usernames are case-insensitive.** `querySchema` lowercases the validated value; the `view_counts`
  key has `CHECK (username = lower(username))`. Keep the regex for GitHub logins (1–39 chars,
  alphanumeric and inner hyphens; legacy logins with double hyphens stay valid).
- **The only write** is `incrementViewCount()`: one atomic
  `INSERT … ON CONFLICT DO UPDATE … RETURNING views`. Keep it a single statement.
- **Styling** (`theme`, `color`, `label_color`) is optional, validated in `querySchema`, and only
  reaches the badge renderer; the counter key is the username alone.
- **Validation** lives in a Valibot schema in `src/schemas/` and runs through `vValidator` at the
  route with the hook that returns `400 { error: <first issue message> }`.
- **Errors** reach clients as `{ error: string }` (400, 404, 500); details go to
  `console.error(JSON.stringify({ level, requestId, error, request }))` from `app.onError`.
- **Middleware** order in `src/index.ts`: `requestId()` → `cors()` (GET, HEAD) → `secureHeaders()`.
- **Runtime**: web-standard APIs and bindings only; `compatibility_date` in `wrangler.jsonc` governs
  behaviour. Background work goes through `c.executionCtx.waitUntil()` with a `.catch()` that logs.
- **Types**: `Env` comes from `bun run cf-typegen` (`worker-configuration.d.ts`, generated and
  gitignored); rerun it after any `wrangler.jsonc` change. `TEST_MIGRATIONS` type-checks
  everywhere but exists only under Vitest.

## Recipes

- **New route**: add `src/routes/<name>.ts` exporting a `Hono<{ Bindings: Env }>`, mount it in
  `src/index.ts`, cover it in `src/index.test.ts` through `fetchApp()`, document it in
  [`docs/API.md`](../API.md).
- **Schema change**: add `migrations/000N_<name>.sql`, run `bun run db:migrate`, add a migration
  test. Deploy applies it remotely before the new code goes live; a migration that rewrites data
  needs a `wrangler d1 export` backup first and an owner's go-ahead.
- **New binding**: add it to `wrangler.jsonc`, run `bun run cf-typegen`, use `c.env.<NAME>`.

## Enforced by

- `src/index.test.ts` (headers, counting, case folding, HEAD, error bodies) and
  `src/migrations.test.ts` (merge, index drop, `CHECK`).
- `tsc` with every strict flag; oxlint type-aware rules (floating promises, misused promises).

## Read more

- [`src/README.md`](../../src/README.md): request flow and module roles.
- [`docs/API.md`](../API.md): the public contract.
