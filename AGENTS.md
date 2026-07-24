# AGENTS.md

Universal context for AI agents working with this repository.
For Claude Code-specific instructions, see [CLAUDE.md](CLAUDE.md).

## Project

**Profile View Counter** — A Cloudflare Workers API serving SVG badge images that track GitHub profile views. Atomic D1 counting, KV edge caching, Hono routing, Valibot validation.

**Live**: `https://profile-view-counter.tashfiq61.workers.dev`

## Quick Reference

| Action | Command |
|--------|---------|
| Install | `bun install` |
| Dev server | `bun run dev` |
| All tests | `bun run test` |
| Unit tests | `bun run test:unit` |
| Integration tests | `bun run test:integration` |
| Lint + format check | `bun run check` |
| Lint + format fix | `bun run fix` |
| Type check | `bun run typecheck` |
| Regen CF types | `bun run cf-typegen` |
| Deploy | `bun run deploy` |
| Commit | `bun run commit` |
| DB migrate (local) | `bun run db:migrate` |
| DB migrate (prod) | `bun run db:migrate:prod` |

## Stack

All versions managed in `package.json` — run `bun outdated` to check for updates.

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers (workerd) — see `compatibility_date` in `wrangler.jsonc` |
| Tooling | Bun — see `engines.bun` in `package.json` |
| Language | TypeScript 7 — `erasableSyntaxOnly`, `libReplacement`, strict |
| Router | Hono |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV (60s TTL) |
| Validation | Valibot |
| Lint/Format | Ultracite (Biome preset) |
| Unit tests | bun:test (built-in) |
| Integration tests | Vitest + `@cloudflare/vitest-pool-workers` |
| Deployment | Wrangler |
| CI/CD | GitHub Actions + Semantic Release |

## WHERE TO LOOK

| Task | File(s) |
|------|---------|
| Add new route | `src/routes/`, mount in `src/index.ts` |
| Change badge design | `src/badge/generator.ts` |
| Modify DB schema | `migrations/`, `src/services/counter.ts` |
| Change cache behavior | `src/services/cache.ts`, `src/routes/view-counter.ts` |
| Update validation | `src/schemas/query.ts` |
| Change security headers | `src/index.ts` (secureHeaders config) |
| Add new test | `test/badge-generator.test.ts` (unit) or `test/integration.test.ts` (integration) |
| Change CI pipeline | `.github/workflows/ci.yml` |
| Update wrangler config | `wrangler.jsonc`, then run `bun run cf-typegen` |
| Update dependencies | `renovate.json`, `package.json` |

## Source Map

```
src/
├── index.ts              # App entry: Hono, typed Variables, secureHeaders(DENY/CSP/HSTS), structured logging
├── routes/view-counter.ts # GET /api/view-counter — cache-first, SVG CSP header, error-safe waitUntil
├── badge/generator.ts    # SVG generation: escapeXml(), formatNumber(), responsive, accessible, system fonts
├── services/counter.ts   # D1 atomic INSERT ON CONFLICT RETURNING, structured error context
├── services/cache.ts     # KV get/set with TTL
└── schemas/query.ts      # Valibot: username 1-39 chars, GitHub format, specific error messages

test/
├── badge-generator.test.ts  # bun:test — pure SVG unit tests (formatNumber, escapeXml, generateModernBadge, querySchema)
└── integration.test.ts      # vitest — full Hono+D1+KV via workerd pool

Config:
├── wrangler.jsonc        # Workers config: D1, KV, smart placement, source maps, observability
├── biome.jsonc           # Extends ultracite/biome/core
├── vitest.config.ts      # Integration tests only, istanbul coverage, 100% threshold
├── bunfig.toml           # Bun 1.3+: isolated linker, text lockfile, globalStore, retry, test randomization
├── tsconfig.json         # TS7: erasableSyntaxOnly, libReplacement, strict, isolatedModules
├── lefthook.yml          # Pre-commit: format+typecheck+test, pre-push: full gate, post-merge: auto-install
└── .releaserc.json       # Semantic release: angular preset, release rules, bun.lock in assets
```

Note: `Env` interface is auto-generated globally by `wrangler types` in `worker-configuration.d.ts`. No manual types directory.

## Request Flow

```
Client GET /api/view-counter?username=X
  │
  ▼
Hono middleware (requestId → secureHeaders → cors → logger → timing)
  │
  ▼
Valibot validates username (1-39 chars, [a-zA-Z0-9-])
  │
  ▼
KV.get("badge:X") ── HIT ──► Return cached SVG (max-age=60)
  │
 MISS
  │
  ▼
D1: INSERT ON CONFLICT RETURNING views
  │
  ▼
generateModernBadge(count) → escapeXml() → SVG string
  │
  ├──► waitUntil(KV.put("badge:X", svg, ttl=60).catch(...))  [non-blocking, error-safe]
  │
  ▼
Return SVG (Cache-Control: no-cache, no-store, must-revalidate, CSP: default-src 'none')
```

## Database Schema

```sql
CREATE TABLE view_counts (
  username   TEXT PRIMARY KEY NOT NULL,
  views      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Migrations: `migrations/` directory, applied via `bun run db:migrate` (local) or `bun run db:migrate:prod` (remote).

## API Endpoints

| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/` | JSON | API info, available endpoints |
| GET | `/health` | `{ status: "ok", timestamp }` | Health check |
| GET | `/api/view-counter?username=X` | `image/svg+xml` | Badge with view count |
| GET | `/favicon.ico` | 204 | No content |
| * | `*` | `{ error: "Not Found" }` 404 | Catch-all |

## Code Style

- **Formatting**: Double quotes, semicolons (Ultracite / Biome preset)
- **Imports**: Named exports only; sole exception: `export default app` (Workers entry)
- **Types**: `readonly` interfaces, `as const satisfies T` for config, strict TypeScript 7, Valibot with `description()` metadata at boundaries
- **Errors**: Always `{ error: string }` JSON, structured logging with `level`, `requestId`, `error`, `request` context
- **SVG security**: `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`, `escapeXml()` for all dynamic content
- **Commits**: Conventional commits (`feat|fix|docs|refactor|test|ci|chore|perf|build|revert|types|security`)
- **Coverage**: 100% lines, functions, statements, branches enforced in CI

## Testing Standards

Two runners, split by runtime requirement:

| Runner | File | Scope | Coverage |
|--------|------|-------|----------|
| `bun:test` | `test/badge-generator.test.ts` | Pure SVG generation (no Workers APIs) | `src/badge/**` |
| Vitest + `@cloudflare/vitest-pool-workers` | `test/integration.test.ts` | Full Hono app against real workerd | `src/**` minus `src/badge/**` |

- 100% coverage required across all metrics (enforced in `vitest.config.ts`)
- Integration tests use `createExecutionContext()` / `waitOnExecutionContext()` from `cloudflare:test`
- Test randomization enabled (`seed=42`) for flaky test detection
- Mock pattern: Override method on `testEnv.DB` or `testEnv.CACHE`, restore in `finally` block

## Anti-Patterns

These are explicitly forbidden:

- **`cloudflare:test` in bun:test files** → the module doesn't exist in Bun runtime
- **`bun:test` in vitest files** → the module doesn't exist in workerd runtime
- **Bun APIs in `src/`** → workerd runtime doesn't have them (`Bun.file`, `Bun.serve`, etc.)
- **Manual `worker-configuration.d.ts` edits** → auto-generated by `bun run cf-typegen`
- **Manual `src/types/env.ts`** → `Env` is auto-generated globally by wrangler
- **`biome-ignore` comments** → override rules in `biome.jsonc` instead
- **`bun = true` in `[run]`** → breaks workerd pool runner
- **Hardcoded version numbers** → managed by semantic-release
- **Enum / namespace / parameter properties** → `erasableSyntaxOnly` bans them
- **Floating promises** → always `await` or use `waitUntil()`
- **SQL string concatenation** → use D1 `.bind()` parameterized queries
- **SVG without `escapeXml()`** → XSS risk if user input ever enters SVG

## Security

### Code-Level Rules

- `secureHeaders()` with explicit DENY + CSP + HSTS on all responses
- SVG responses get `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`
- `escapeXml()` for any dynamic content in SVG generation (defense in depth)
- Valibot validation at API boundary — reject invalid input before processing
- Parameterized SQL via D1 `.bind()` — zero string concatenation
- Structured error logging — generic messages to clients, full details server-side

### AI Agent Rules

- Never print or paste secret values (tokens, API keys) in chat responses, commits, or shared logs
- Mirror CI env names exactly, but do not inline literal secret values in commands
- If a required secret is missing locally, stop and ask the user rather than inventing placeholder credentials
- Never commit local secret files; if documenting env setup, use placeholder-only examples
- When sharing command output, summarize and redact sensitive-looking values

## Gotchas

### `worker-configuration.d.ts` is auto-generated
- **Context**: Declares global `Env` interface via `Cloudflare.Env` namespace
- **Problem**: Editing it manually gets overwritten by `bun run cf-typegen`
- **Solution**: Edit `wrangler.jsonc` bindings, then run `bun run cf-typegen`

### Vitest config excludes badge tests
- **Context**: `vitest.config.ts` includes only `test/integration.test.ts`
- **Problem**: Badge tests are run by `bun:test`, not vitest
- **Solution**: `coverage.exclude: ["src/badge/**"]` in vitest.config.ts — bun:test covers it

### KV and D1 bindings in tests
- **Context**: Test env bindings come from `cloudflare:test`
- **Problem**: `env` type is `Cloudflare.Env`, not your project's `Env`
- **Solution**: Cast via `env as unknown as Env`

### `bun run dev` requires local migration
- **Context**: Local D1 database starts empty
- **Problem**: `no such table: view_counts` error on first request
- **Solution**: Run `bun run db:migrate` before `bun run dev`

### SVG uses 2x pixel dimensions
- **Context**: `width` and `height` are `viewBox * 2` for retina displays
- **Problem**: Appears larger than expected if viewBox is misread
- **Solution**: viewBox defines logical size, `* 2` is physical pixels for DPR

### Smart Placement runs near D1, not nearest edge
- **Context**: `placement.mode: "smart"` in wrangler.jsonc
- **Problem**: Worker may not be at the geographically nearest edge
- **Solution**: This is intentional — D1 latency optimization takes priority

## CI Pipeline

```
checkout → setup-bun → cache → install → cf-typegen → check → typecheck → test:unit → test:integration
```

Semantic Release runs on push to `master`/`main` (separate workflow).

## Context Efficiency

- Grep first to find relevant line numbers, then read targeted ranges
- Never re-read the same section of a file without code changes in between
- Run `bun run check` and `bun run typecheck` together: `bun run check && bun run typecheck`
- Capture test output once, then analyze — don't re-run without changes
