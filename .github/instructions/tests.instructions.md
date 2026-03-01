---
applyTo: "test/**/*.ts"
---

# Test Instructions

## Two Runners — Never Mix

| Runner | File | Import From |
|--------|------|-------------|
| bun:test | `badge-generator.test.ts` | `import { describe, expect, test } from 'bun:test'` |
| Vitest | `integration.test.ts` | Globals enabled (no import needed) |

## Critical Rules

- `badge-generator.test.ts` uses `bun:test` — never import `cloudflare:test` or vitest here
- `integration.test.ts` uses Vitest with `@cloudflare/vitest-pool-workers` — never import `bun:test` here
- Integration test env: `import { env } from 'cloudflare:test'` then cast `env as unknown as Env`
- Mock pattern: override method on env binding, restore in `finally` block
- 100% line + function coverage required
