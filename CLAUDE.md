# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Overview

Profile View Counter is a Cloudflare Workers API that serves SVG badge images showing GitHub profile view counts. Stack: Hono router, D1 (SQLite) for persistence, KV for edge caching, Valibot for validation, TypeScript throughout. Deployed globally via Wrangler.

**Critical constraint**: Source code in `src/` runs on Cloudflare's **workerd** runtime, NOT Bun. Bun APIs (`Bun.file`, `Bun.serve`, etc.) are unavailable at runtime. Bun is used only for tooling (package manager, test runner, scripts).

## Commands

```bash
bun run dev              # Local Workers dev server (D1 + KV emulated)
bun run test             # All tests: bun:test units + vitest integration
bun run test:unit        # Badge generator only (bun:test, ~25ms)
bun run test:integration # Hono + D1 + KV via workerd pool (vitest)
bun run check            # Lint + format check (ultracite)
bun run fix              # Auto-fix lint + format (ultracite)
bun run typecheck        # tsc --noEmit (strict mode)
bun run cf-typegen       # Regenerate worker-configuration.d.ts from wrangler.jsonc
bun run deploy           # Deploy to Cloudflare Workers
bun run commit           # Interactive conventional commit (cz-git)
```

### CI pipeline (what PR checks run)

```bash
bun run cf-typegen && bun run check && bun run typecheck && bun run test:unit && bun run test:integration
```

## Architecture

```
Request --> Hono (cors, logger, timing) --> Valibot validation
  --> KV cache check
    HIT  --> Return cached SVG (public, max-age=60)
    MISS --> D1 atomic increment --> Generate SVG --> waitUntil(KV store) --> Return SVG
```

| Module | Responsibility |
|--------|----------------|
| `src/index.ts` | Hono app, middleware stack, error handler, route mounting |
| `src/routes/view-counter.ts` | Cache-first badge endpoint, `waitUntil()` for non-blocking KV writes |
| `src/badge/generator.ts` | Responsive SVG with viewBox, WCAG a11y (`<title>`, `<desc>`) |
| `src/services/counter.ts` | D1 `INSERT ON CONFLICT ... RETURNING` atomic increment |
| `src/services/cache.ts` | KV get/set with TTL |
| `src/schemas/query.ts` | Valibot schema for `username` param (1-39 chars, GitHub format) |
| `src/types/env.ts` | Cloudflare bindings interface (`DB: D1Database`, `CACHE: KVNamespace`) |

## Key Patterns

### Cache-first with non-blocking write

```typescript
// Always respond first, cache asynchronously
c.executionCtx.waitUntil(setCachedBadge(c.env.CACHE, cacheKey, svg, 60))
return c.body(svg, 200, { ...SVG_HEADERS, 'X-Cache': 'MISS' })
```

### Atomic counter (no race conditions)

```sql
INSERT INTO view_counts (username, views, updated_at)
VALUES (?1, 1, datetime('now'))
ON CONFLICT(username) DO UPDATE SET views = views + 1, updated_at = datetime('now')
RETURNING views
```

### Typed constants with `satisfies`

```typescript
const THEME = { labelBg: '#444444', countBg: '#007ec6' } as const satisfies BadgeTheme
```

## Testing

Two runners, split by runtime requirement:

| Runner | File | Scope | Coverage |
|--------|------|-------|----------|
| `bun:test` | `test/badge-generator.test.ts` | Pure SVG generation (no Workers APIs) | `src/badge/**` |
| Vitest + `@cloudflare/vitest-pool-workers` | `test/integration.test.ts` | Full Hono app against real workerd | `src/**` minus `src/badge/**` |

- 100% line + function coverage required (enforced in both `bunfig.toml` and `vitest.config.ts`)
- Integration tests use `createExecutionContext()` / `waitOnExecutionContext()` from `cloudflare:test`
- Never import `cloudflare:test` in bun:test files (module doesn't exist in Bun runtime)

## Conventions

- Single quotes, no semicolons, trailing commas — enforced by Ultracite (Biome preset)
- `export default app` is the only allowed default export (Workers entry point)
- Immutable data: `as const satisfies Type` for config objects, never mutate
- All errors return `{ error: string }` JSON with appropriate HTTP status
- Structured error logging: `console.error(JSON.stringify({ error, message, stack }))`
- Security header `X-Content-Type-Options: nosniff` on all SVG responses
- Conventional commits enforced: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|types`
- Run `bun run cf-typegen` after any `wrangler.jsonc` change

## Gotchas

- `worker-configuration.d.ts` is auto-generated — never edit manually
- Vitest config only includes `test/integration.test.ts` — badge tests excluded (run by bun:test)
- KV and D1 bindings in tests come from `cloudflare:test` `env`, cast via `as unknown as Env`
- The `coverage.exclude` in `vitest.config.ts` skips `src/badge/**` because bun:test covers it
- SVG uses 2x pixel dimensions with viewBox for retina + responsive scaling
- `placement.mode: "smart"` in `wrangler.jsonc` — Worker runs near D1 primary, not nearest edge
