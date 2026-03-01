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

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Cloudflare Workers (workerd) | compat 2026-01-01 |
| Tooling | Bun | 1.3.10 |
| Router | Hono | 4.12 |
| Database | Cloudflare D1 (SQLite) | — |
| Cache | Cloudflare KV | 60s TTL |
| Validation | Valibot | 1.2 |
| Lint/Format | Ultracite (Biome preset) | 7.2 |
| Unit tests | bun:test | built-in |
| Integration tests | Vitest + pool-workers | 3.2 |
| CI/CD | GitHub Actions + Semantic Release | — |

## Source Map

```
src/
├── index.ts              # App entry: Hono, middleware, error handlers
├── routes/view-counter.ts # GET /api/view-counter — cache-first badge endpoint
├── badge/generator.ts    # SVG generation: responsive, accessible, themed
├── services/counter.ts   # D1 atomic INSERT ON CONFLICT RETURNING
├── services/cache.ts     # KV get/set with TTL
├── schemas/query.ts      # Valibot: username 1-39 chars, GitHub format
└── types/env.ts          # { DB: D1Database, CACHE: KVNamespace }

test/
├── badge-generator.test.ts  # bun:test — pure SVG unit tests
└── integration.test.ts      # vitest — full Hono+D1+KV via workerd pool

Config:
├── wrangler.jsonc        # Workers config: D1, KV, smart placement
├── biome.jsonc           # Extends ultracite/biome/core
├── vitest.config.ts      # Integration tests only, istanbul coverage
├── bunfig.toml           # Bun config: exact installs, test coverage
├── tsconfig.json         # Strict, ESNext, Preserve modules
├── lefthook.yml          # Pre-commit: ultracite, commit-msg: commitlint
└── .releaserc.json       # Semantic release: changelog, git, github
```

## Request Flow

```
Client GET /api/view-counter?username=X
  │
  ▼
Hono middleware (cors → logger → timing)
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
generateModernBadge(count) → SVG string
  │
  ├──► waitUntil(KV.put("badge:X", svg, ttl=60))  [non-blocking]
  │
  ▼
Return SVG (Cache-Control: no-cache, no-store, must-revalidate)
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

## Conventions

- **Formatting**: Single quotes, no semicolons, trailing commas (Ultracite/Biome)
- **Imports**: Named exports only; sole exception: `export default app` (Workers entry)
- **Types**: `as const satisfies T` for config, strict TypeScript, Valibot at boundaries
- **Errors**: Always `{ error: string }` JSON, structured logging with stack traces
- **Security**: `X-Content-Type-Options: nosniff` on SVG, CORS `*` for badge embedding
- **Commits**: Conventional commits (`feat|fix|docs|refactor|test|ci|chore|perf|build|revert|types`)
- **Coverage**: 100% lines + functions enforced in CI

## Testing Rules

- Unit tests (`bun:test`): For pure functions with no Workers runtime dependency
- Integration tests (Vitest): For anything touching D1, KV, or the Hono app
- Never import `cloudflare:test` in bun:test files — the module doesn't exist in Bun
- Never import `bun:test` in vitest files — the module doesn't exist in workerd
- Test env bindings: `env` from `cloudflare:test`, cast as `unknown as Env`
- Mock pattern: Override method on `testEnv.DB`, restore in `finally` block

## CI Pipeline

```
checkout → setup-bun → cache → install → cf-typegen → check → typecheck → test:unit → test:integration
```

Semantic Release runs on push to `master`/`main` (separate workflow).

## Do Not

- Edit `worker-configuration.d.ts` — auto-generated by `bun run cf-typegen`
- Use Bun APIs in `src/` — workerd runtime doesn't have them
- Add `biome-ignore` comments — override rules in `biome.jsonc` instead
- Skip `bun run cf-typegen` after changing `wrangler.jsonc`
- Hardcode version numbers — managed by semantic-release
