# Architecture Overview

> Technical deep-dive into the Profile View Counter system design.

---

## High-Level Flow

```mermaid
flowchart LR
    A[User's README] -->|"&lt;img src=...&gt;"| B[Cloudflare Edge]
    B --> C{KV Cache}
    C -->|HIT| D[Return Cached SVG]
    C -->|MISS| E[D1 Database]
    E -->|Atomic Increment| F[Generate SVG]
    F -->|waitUntil| G[Store in KV]
    G --> D
    D --> A
```

## Request Sequence

```mermaid
sequenceDiagram
    participant U as User's README
    participant H as Hono App
    participant KV as Cloudflare KV
    participant D1 as D1 Database
    participant G as Badge Generator

    U->>H: GET /api/view-counter?username=xxx
    H->>H: Validate with Valibot
    H->>KV: Check cache (badge:xxx)
    alt Cache HIT
        KV-->>H: Return cached SVG
    else Cache MISS
        H->>D1: INSERT ON CONFLICT RETURNING
        D1-->>H: Updated view count
        H->>G: Generate SVG
        G-->>H: SVG string
        H--)KV: waitUntil(Store with 60s TTL)
    end
    H-->>U: SVG Response
```

---

## Project Structure

```
src/
├── index.ts              # Hono app entry point, middleware, routes
├── routes/
│   └── view-counter.ts   # /api/view-counter route handler
├── badge/
│   └── generator.ts      # SVG badge generation logic
├── services/
│   ├── counter.ts        # D1 database operations
│   └── cache.ts          # KV cache operations
├── schemas/
│   └── query.ts          # Valibot validation schemas
├── types/
│   └── env.ts            # TypeScript type definitions
└── docs/
    ├── API.md            # API reference
    ├── ARCHITECTURE.md   # This file
    └── DEPLOYMENT.md     # Deployment guide
```

---

## Core Components

### 1. Entry Point (`index.ts`)

The Hono application configures:
- **Middleware**: `logger()`, `timing()`, `cors()`
- **Routes**: `/`, `/health`, `/favicon.ico`, `/api/*`
- **Error Handlers**: 404 and 500

```typescript
const app = new Hono<{ Bindings: Env }>()
export default app
```

### 2. Route Handler (`routes/view-counter.ts`)

Implements the cache-first pattern:

1. Validate query params with Valibot
2. Check KV cache for existing badge
3. If cache miss: increment D1 count, generate SVG, non-blocking cache write via `waitUntil()`
4. Return SVG with security headers (`X-Content-Type-Options: nosniff`)

### 3. Counter Service (`services/counter.ts`)

Uses atomic `INSERT ON CONFLICT` with `RETURNING`:

```sql
INSERT INTO view_counts (username, views, updated_at)
VALUES (?1, 1, datetime('now'))
ON CONFLICT(username) DO UPDATE SET
  views = views + 1,
  updated_at = datetime('now')
RETURNING views
```

### 4. Badge Generator (`badge/generator.ts`)

Creates a responsive SVG badge with:
- 3D capsule design with rounded corners
- GitHub logo in a circular frame
- Dynamic view count formatting (K, M, B)
- Responsive sizing via `viewBox` + `preserveAspectRatio="xMinYMid meet"`
- Accessibility attributes (`role`, `aria-labelledby`, `<title>`, `<desc>`)

---

## Data Flow

| Step | Component | Action |
|------|-----------|--------|
| 1 | Hono Middleware | Log request, add timing headers, set CORS |
| 2 | Valibot Validator | Validate `username` query parameter |
| 3 | Cache Service | Check KV for cached badge |
| 4 | Counter Service | Atomic increment in D1 (if cache miss) |
| 5 | Badge Generator | Create SVG string |
| 6 | Cache Service | Non-blocking KV store via `waitUntil()` with 60s TTL |
| 7 | Response | Return SVG with security + cache headers |

---

## Storage

### Cloudflare D1 (SQLite)

**Table: `view_counts`**

| Column | Type | Description |
|--------|------|-------------|
| `username` | TEXT (PK) | GitHub username |
| `views` | INTEGER | Total view count |
| `created_at` | TEXT | First view timestamp |
| `updated_at` | TEXT | Last view timestamp |

### Cloudflare KV

**Key Format**: `badge:{username}`
**Value**: SVG string
**TTL**: 60 seconds

---

## Tooling

| Tool | Purpose |
|------|---------|
| **Bun 1.3.10** | Package manager, script runner, unit test runner (`bun:test`) |
| **Ultracite 7.2.4** | Opinionated Biome preset layer for linting & formatting |
| **Biome 2.4.4** | Underlying engine for Ultracite (lint + format) |
| **Vitest 3.2** | Integration test runner with `@cloudflare/vitest-pool-workers` |
| **TypeScript 5.9** | Strict type checking with `verbatimModuleSyntax` |
| **Wrangler 4.69** | Cloudflare Workers CLI, type generation, local dev |
| **Lefthook** | Git hooks (pre-commit: ultracite fix, commit-msg: commitlint) |
| **Semantic Release** | Automated versioning & changelog from conventional commits |

## Testing Architecture

Tests are split across two runners to maximize performance:

| Runner | Files | Scope |
|--------|-------|-------|
| `bun test` | `test/badge-generator.test.ts` | Unit tests for pure SVG generation (no Workers runtime) |
| `bunx vitest run` | `test/integration.test.ts` | Integration tests via `@cloudflare/vitest-pool-workers` (workerd runtime) |

Both runners contribute to 100% code coverage across all `src/` files.

## Performance Optimizations

- **Smart Placement**: `placement.mode: "smart"` in `wrangler.jsonc` runs the Worker closer to the D1 primary, reducing query latency
- **Non-blocking cache writes**: `waitUntil()` sends the response immediately while KV write completes in the background
- **Edge caching**: KV serves cached badges for 60s, avoiding D1 queries on repeat views
- **Observability**: Built-in Cloudflare observability enabled for structured error logging
