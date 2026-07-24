# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.
For universal AI agent context, see [AGENTS.md](AGENTS.md).

## Overview

Profile View Counter is a Cloudflare Workers API that serves SVG badge images showing GitHub profile view counts. Stack: Hono router, D1 (SQLite) for persistence, KV for edge caching, Valibot for validation, TypeScript throughout. Deployed globally via Wrangler. All versions in `package.json`.

**Critical constraint**: Source code in `src/` runs on Cloudflare's **workerd** runtime, NOT Bun. Bun APIs (`Bun.file`, `Bun.serve`, etc.) are unavailable at runtime. Bun is used only for tooling (package manager, test runner, scripts).

## Commands

```bash
bun run dev              # Local Workers dev server (D1 + KV emulated)
bun run test             # All tests: bun:test units + vitest integration
bun run test:unit        # Badge generator only (bun:test, ~25ms)
bun run test:integration # Hono + D1 + KV via workerd pool (vitest)
bun run check            # Lint + format check (ultracite)
bun run fix              # Auto-fix lint + format (ultracite)
bun run typecheck        # tsc --noEmit (TypeScript 7, strict mode)
bun run cf-typegen       # Regenerate worker-configuration.d.ts from wrangler.jsonc
bun run db:migrate       # Apply D1 migrations locally
bun run deploy           # Deploy to Cloudflare Workers
bun run commit           # Interactive conventional commit (czg)
```

### CI pipeline (what PR checks run)

```bash
bun run cf-typegen && bun run check && bun run typecheck && bun run test:unit && bun run test:integration
```

## Architecture

```
Request --> Hono (requestId, secureHeaders, cors, logger, timing) --> Valibot validation
  --> KV cache check
    HIT  --> Return cached SVG (public, max-age=60)
    MISS --> D1 atomic increment --> Generate SVG --> waitUntil(KV store) --> Return SVG
```

| Module | Responsibility |
|--------|----------------|
| `src/index.ts` | Hono app, typed `Variables` interface, middleware stack, error handler with structured logging |
| `src/routes/view-counter.ts` | Cache-first badge endpoint, SVG CSP header, error-safe `waitUntil()` |
| `src/badge/generator.ts` | Responsive SVG: `escapeXml()`, `formatNumber()`, system fonts, a11y |
| `src/services/counter.ts` | D1 `INSERT ON CONFLICT ... RETURNING` atomic increment |
| `src/services/cache.ts` | KV get/set with TTL |
| `src/schemas/query.ts` | Valibot schema with specific error messages |

## Key Patterns

### Cache-first with error-safe non-blocking write

```typescript
c.executionCtx.waitUntil(
  setCachedBadge(c.env.CACHE, cacheKey, svg, CACHE_TTL_SECONDS).catch(
    (err: unknown) =>
      console.error(JSON.stringify({
        level: "warn",
        error: "cache-write-failed",
        message: String(err),
        context: { cacheKey, username },
      }))
  )
);
```

### Atomic counter (no race conditions)

```sql
INSERT INTO view_counts (username, views, updated_at)
VALUES (?1, 1, datetime('now'))
ON CONFLICT(username) DO UPDATE SET views = views + 1, updated_at = datetime('now')
RETURNING views
```

### Typed constants with `as const satisfies`

```typescript
const SVG_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  "Content-Type": "image/svg+xml",
  "X-Content-Type-Options": "nosniff",
} as const satisfies SvgHeaders;
```

### XML escaping for SVG safety

```typescript
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

## Testing

Two runners, split by runtime requirement:

| Runner | File | Scope | Coverage |
|--------|------|-------|----------|
| `bun:test` | `test/badge-generator.test.ts` | Pure SVG generation + Valibot schemas (no Workers APIs) | `src/badge/**` |
| Vitest + `@cloudflare/vitest-pool-workers` | `test/integration.test.ts` | Full Hono app against real workerd | `src/**` minus `src/badge/**` |

- 100% coverage required across all metrics (enforced in `vitest.config.ts`)
- Integration tests use `createExecutionContext()` / `waitOnExecutionContext()` from `cloudflare:test`
- Never import `cloudflare:test` in bun:test files (module doesn't exist in Bun runtime)
- Test randomization enabled (`seed=42`) for flaky test detection

## TypeScript Configuration

- `erasableSyntaxOnly: true` — no enums, namespaces, or parameter properties (safe for type-stripping runtimes)
- `libReplacement: false` — TS7 lib control
- `rewriteRelativeImportExtensions: true` — rewrite `.ts` imports to `.js` in output
- `isolatedModules: true` — ensures each file can be independently transformed
- `useUnknownInCatchVariables: true` — catch variables typed as `unknown` by default
- `noUncheckedSideEffectImports: true` — validates side-effect imports resolve
- `allowUnreachableCode: false` + `allowUnusedLabels: false` — strict dead code detection
- `noErrorTruncation: true` — full error messages in diagnostics
- All strict flags enabled: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.

## Conventions

- Double quotes, semicolons — enforced by Ultracite (Biome preset)
- `export default app` is the only allowed default export (Workers entry point)
- Immutable data: `readonly` interfaces, `as const satisfies Type` for config objects
- All errors return `{ error: string }` JSON with appropriate HTTP status
- Structured error logging: `console.error(JSON.stringify({ level, requestId, error, request }))`
- Security: `secureHeaders()` with explicit DENY + CSP + HSTS, SVG responses get `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`
- XML escaping: `escapeXml()` for any dynamic content in SVG (defense in depth)
- Conventional commits enforced: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|types|security`
- Run `bun run cf-typegen` after any `wrangler.jsonc` change

## Bun Configuration

- `linker = "isolated"` — phantom deps fail immediately (stricter than hoisted)
- `saveTextLockfile = true` — text-based `bun.lock` for easier PR reviews
- `globalStore = true` — shares packages across projects, 7x faster reinstalls
- `retry = 1` — auto-retry flaky tests once
- `shell = "bun"` — cross-platform script consistency
- Do NOT set `bun = true` in `[run]` — it breaks workerd pool runner

## Gotchas

- `worker-configuration.d.ts` is auto-generated — never edit manually. It declares global `Env` interface via `Cloudflare.Env` namespace.
- Vitest config only includes `test/integration.test.ts` — badge tests excluded (run by bun:test)
- KV and D1 bindings in tests come from `cloudflare:test` `env`, cast via `as unknown as Env`
- The `coverage.exclude` in `vitest.config.ts` skips `src/badge/**` because bun:test covers it
- SVG uses 2x pixel dimensions with viewBox for retina + responsive scaling
- `placement.mode: "smart"` in `wrangler.jsonc` — Worker runs near D1 primary, not nearest edge
- `upload_source_maps: true` in `wrangler.jsonc` — source maps uploaded for production debugging
- `compatibility_date: "2026-07-24"` — `nodejs_compat` flag includes v2 behaviors automatically
