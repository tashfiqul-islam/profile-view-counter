---
applyTo: "test/**/*.ts"
---

# Test Instructions

## Two Runners — Never Mix

| Runner | File | Import From |
|--------|------|-------------|
| bun:test | `badge-generator.test.ts` | `import { describe, expect, it } from 'bun:test'` |
| Vitest | `integration.test.ts` | `import { describe, expect, it, beforeAll } from 'vitest'` + globals |

## Critical Rules

- `badge-generator.test.ts` uses `bun:test` — never import `cloudflare:test` or vitest here
- `integration.test.ts` uses Vitest with `@cloudflare/vitest-pool-workers` — never import `bun:test` here
- Integration test env: `import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'` then cast `env as unknown as Env`
- Mock pattern: override method on env binding, restore in `finally` block
- 100% line + function + branch coverage required

## Coverage Split

| Runner | Covers |
|--------|--------|
| bun:test | `src/badge/**` + `src/schemas/**` (formatNumber, escapeXml, generateModernBadge, querySchema) |
| vitest | `src/**` minus `src/badge/**` (index, routes, services, schemas) |
