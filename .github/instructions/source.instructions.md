---
applyTo: "src/**/*.ts"
---

# Source Code Instructions

This code runs on Cloudflare's **workerd** runtime (NOT Node.js/Bun).

## Available APIs

- Web standard APIs (fetch, Request, Response, URL, crypto, etc.)
- Cloudflare bindings: `D1Database`, `KVNamespace`, `ExecutionContext`
- Hono framework: `Context`, `Hono`, middleware

## Unavailable APIs

- No `fs`, `path`, `os`, `child_process`, `process`
- No Bun APIs (`Bun.file`, `Bun.serve`, `Bun.env`)
- No `require()` — ESM only

## Patterns

- Named exports only (exception: `export default app` in `index.ts`)
- Use `c.executionCtx.waitUntil()` for non-blocking async work
- All errors: `{ error: string }` JSON response
- Validate input with Valibot schemas at route boundaries
- Use `as const satisfies T` for typed config objects
- SVG responses must include `X-Content-Type-Options: nosniff`
