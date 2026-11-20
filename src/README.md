# `src/`

The Worker. Everything here runs on workerd and is bundled by wrangler from `index.ts`.

## Request flow

```text
GET /api/view-counter?username=X
  │
  ├─ middleware (index.ts): requestId → logger → timing → cors (GET, HEAD) → secureHeaders
  ├─ vValidator("query", querySchema)          400 Valibot issues JSON on bad input
  ├─ KV get "badge:X" ── HIT ──► cached SVG, Cache-Control: public, max-age=60, X-Cache: HIT
  │                              (the view is not counted)
  └─ MISS
       ├─ D1 upsert, RETURNING views            atomic, no read-modify-write race
       ├─ generateModernBadge(views)
       ├─ waitUntil(KV put, 60 s TTL)            failure logged, never fails the request
       └─ SVG, Cache-Control: no-cache, no-store, must-revalidate, X-Cache: MISS
```

Every SVG response also carries `Content-Security-Policy: default-src 'none'; style-src
'unsafe-inline'` and `X-Content-Type-Options: nosniff`. Unknown routes return `404 { error }`;
thrown errors return `500 { error: "Internal Server Error" }` and log structured JSON.

## Modules

| File                     | Role                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `index.ts`               | Hono app: middleware, `/`, `/health`, `/favicon.ico`, 404 and error handler  |
| `routes/view-counter.ts` | `GET /api/view-counter`: cache check, count, render, cache write             |
| `schemas/query.ts`       | Valibot schema for the `username` query (GitHub login rules, 1–39 chars)     |
| `services/counter.ts`    | `incrementViewCount()`: D1 `INSERT … ON CONFLICT DO UPDATE … RETURNING`      |
| `services/cache.ts`      | `getCachedBadge()` / `setCachedBadge()`: KV text get/put with TTL            |
| `badge/generator.ts`     | Pure SVG rendering: `formatNumber()`, `escapeXml()`, `generateModernBadge()` |
| `test-setup.ts`          | Vitest setup: applies `migrations/` to each test file's isolated D1          |
| `test-env.d.ts`          | Types for the test-only `TEST_MIGRATIONS` binding                            |

`badge/generator.ts` and `schemas/query.ts` are pure: no bindings, no I/O. Keep new rendering and
parsing logic there and test it directly; keep bindings in `services/` and wire them in routes.

## Invariants

- Every dynamic value in the SVG passes through `escapeXml()`.
- The count only changes through `incrementViewCount()`; its SQL is the only write.
- SVG dimensions are 2× the `viewBox` for retina displays; the `viewBox` is the logical size.
- The font stack is system fonts only: GitHub's image proxy strips `@import`.

## Recipes

- **New route:** add `routes/<name>.ts` exporting a `Hono<{ Bindings: Env }>`, mount it in
  `index.ts`, cover it in `index.test.ts` through `app.fetch()`, document it in `docs/API.md`.
- **Schema change:** add `migrations/000N_<name>.sql` (never edit an applied one), run
  `bun run db:migrate`; tests pick it up automatically. Deploy applies it remotely before the new
  code goes live.
- **New binding:** add it to `wrangler.jsonc`, run `bun run cf-typegen`, then use `c.env.<NAME>`.
