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

## Invariants

- Every dynamic value in the SVG passes through `escapeXml()`.
- The count only changes through `incrementViewCount()`; its SQL is the only write.
- The badge is 28 px tall and sized 1:1 to its `viewBox`; it scales as a vector, so no 2× sizing.
- Layout widths come from `textWidth()` (Arial Bold metrics plus tracking) and each `<text>` is
  pinned to that width with `textLength` + `lengthAdjust="spacing"`: whatever font the viewer has,
  text fills exactly its slot, never overflows, and stays centred. Keep both in sync when changing
  sizes or the label.
- The font stack is system fonts only: GitHub's image proxy strips `@import`. No filters or
  external references: they render differently across viewers.

## Recipes

- **New route:** add `routes/<name>.ts` exporting a `Hono<{ Bindings: Env }>`, mount it in
  `index.ts`, cover it in `index.test.ts` through `app.fetch()`, document it in `docs/API.md`.
- **Schema change:** add `migrations/000N_<name>.sql` (never edit an applied one), run
  `bun run db:migrate`; tests pick it up automatically. Deploy applies it remotely before the new
  code goes live.
- **New binding:** add it to `wrangler.jsonc`, run `bun run cf-typegen`, then use `c.env.<NAME>`.
