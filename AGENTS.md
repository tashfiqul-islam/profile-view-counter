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

All versions managed in `package.json` — run `bun outdated` to check for updates.

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers (workerd) — see `compatibility_date` in `wrangler.jsonc` |
| Tooling | Bun — see `engines.bun` in `package.json` |
| Language | TypeScript — `erasableSyntaxOnly`, `libReplacement`, strict |
| Router | Hono |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV (60s TTL) |
| Validation | Valibot |
| Lint/Format | Ultracite (Biome preset) |
| Unit tests | bun:test (built-in) |
| Integration tests | Vitest + `@cloudflare/vitest-pool-workers` |
| Deployment | Wrangler |
| CI/CD | GitHub Actions + Semantic Release |

## Source Map

```
src/
├── index.ts              # App entry: Hono, middleware (requestId, secureHeaders, cors, logger, timing), error handlers
├── routes/view-counter.ts # GET /api/view-counter — cache-first badge endpoint, error-safe waitUntil
├── badge/generator.ts    # SVG generation: responsive, accessible, themed, readonly interfaces
├── services/counter.ts   # D1 atomic INSERT ON CONFLICT RETURNING
├── services/cache.ts     # KV get/set with TTL
└── schemas/query.ts      # Valibot: username 1-39 chars, GitHub format, description metadata

test/
├── badge-generator.test.ts  # bun:test — pure SVG unit tests
└── integration.test.ts      # vitest — full Hono+D1+KV via workerd pool

Config:
├── wrangler.jsonc        # Workers config: D1, KV, smart placement, source maps, observability
├── biome.jsonc           # Extends ultracite/biome/core
├── vitest.config.ts      # Integration tests only, istanbul coverage, 100% threshold
├── bunfig.toml           # Bun 1.3+: isolated linker, text lockfile, test randomization
├── tsconfig.json         # TS6: erasableSyntaxOnly, libReplacement, strict
├── lefthook.yml          # Pre-commit: format+typecheck+test, pre-push: full gate, post-merge: auto-install
└── .releaserc.js         # Semantic release: angular preset, release rules, bun.lock in assets
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
generateModernBadge(count) → SVG string
  │
  ├──► waitUntil(KV.put("badge:X", svg, ttl=60).catch(...))  [non-blocking, error-safe]
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

- **Formatting**: Double quotes, semicolons (Ultracite 7.4 / Biome preset)
- **Imports**: Named exports only; sole exception: `export default app` (Workers entry)
- **Types**: `readonly` interfaces, `as const satisfies T` for config, strict TypeScript 6, Valibot with `description()` metadata at boundaries
- **Errors**: Always `{ error: string }` JSON, structured logging with stack traces
- **Security**: `secureHeaders()` middleware + `X-Content-Type-Options: nosniff` on SVG, CORS `*` for badge embedding
- **Commits**: Conventional commits (`feat|fix|docs|refactor|test|ci|chore|perf|build|revert|types|security`)
- **Coverage**: 100% lines, functions, statements, branches enforced in CI

## Testing Rules

- Unit tests (`bun:test`): For pure functions with no Workers runtime dependency
- Integration tests (Vitest + pool-workers): For anything touching D1, KV, or the Hono app
- Never import `cloudflare:test` in bun:test files — the module doesn't exist in Bun
- Never import `bun:test` in vitest files — the module doesn't exist in workerd
- Test env bindings: `env` from `cloudflare:test`, cast as `unknown as Env` (global `Env` from worker-configuration.d.ts)
- Mock pattern: Override method on `testEnv.DB` or `testEnv.CACHE`, restore in `finally` block
- Test randomization: `seed=42` in bunfig.toml for reproducible order

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
- Set `bun = true` in `bunfig.toml` `[run]` section — breaks workerd pool runner
- Create manual `src/types/env.ts` — `Env` is auto-generated globally by wrangler
