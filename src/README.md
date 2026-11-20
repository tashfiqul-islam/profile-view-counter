# `src/`

The Worker. Everything here runs on workerd and is bundled by wrangler from `index.ts`.

## Request flow

```text
GET /api/view-counter?username=X
  │
  ├─ middleware (index.ts): requestId → cors (GET, HEAD) → secureHeaders
  ├─ vValidator("query", querySchema)          400 { error: <first issue> }; lowercases the username
  ├─ HEAD ──► badge headers, empty body, not counted
  └─ GET
       ├─ D1 upsert, RETURNING views            atomic, no read-modify-write race
       ├─ generateModernBadge(views)
       └─ SVG, Cache-Control: max-age=0, no-cache, no-store, must-revalidate
```

`no-store` keeps GitHub's image proxy from caching the badge, so every README view reaches the
Worker and counts. Every SVG response also carries `Content-Security-Policy: default-src 'none';
style-src 'unsafe-inline'` and `X-Content-Type-Options: nosniff`. Unknown routes return
`404 { error }`; thrown errors return `500 { error: "Internal Server Error" }` and log structured
JSON.

## Modules

| File                     | Role                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `index.ts`               | Hono app: middleware, `/`, `/health`, `/favicon.ico`, 404 and error handler  |
| `routes/view-counter.ts` | `GET /api/view-counter`: validate, count, render; `HEAD` without counting    |
| `schemas/query.ts`       | Valibot schema for `username` (GitHub login rules, 1–39 chars), lowercased   |
| `services/counter.ts`    | `incrementViewCount()`: D1 `INSERT … ON CONFLICT DO UPDATE … RETURNING`      |
| `badge/generator.ts`     | Pure SVG rendering: `formatNumber()`, `escapeXml()`, `generateModernBadge()` |
| `test-setup.ts`          | Vitest setup: applies `migrations/` to each test file's isolated D1          |
| `test-env.d.ts`          | Types for the test-only `TEST_MIGRATIONS` binding                            |

`badge/generator.ts` and `schemas/query.ts` are pure: no bindings, no I/O. Keep new rendering and
parsing logic there and test it directly; keep bindings in `services/` and wire them in routes.

Rules for changing this code live in the agent guides: [Worker](../docs/agents/worker.md) and [Badge](../docs/agents/badge.md).
