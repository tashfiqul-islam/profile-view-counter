# Deployment Guide

> Step-by-step instructions for deploying Profile View Counter to Cloudflare Workers.

---

## Prerequisites

- **Bun** installed (see `engines.bun` in `package.json` for minimum version)
- **Cloudflare Account** (free tier works)
- **Wrangler CLI** (included in devDependencies)

---

## 1. Clone & Install

```bash
git clone https://github.com/tashfiqul-islam/profile-view-counter.git
cd profile-view-counter
bun install
```

> [!NOTE]
> `bunfig.toml` uses `linker = "isolated"` — phantom dependencies fail immediately, ensuring reproducible builds.

---

## 2. Authenticate with Cloudflare

```bash
bunx wrangler login
```

This opens a browser window for OAuth authentication.

---

## 3. Create Resources

### Create D1 Database

```bash
bunx wrangler d1 create profile-views
```

Copy the `database_id` from the output.

### Create KV Namespace

```bash
bunx wrangler kv namespace create CACHE
```

Copy the `id` from the output.

---

## 4. Configure Wrangler

Update `wrangler.jsonc` with your resource IDs:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "profile-views",
      "database_id": "YOUR_DATABASE_ID"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "YOUR_KV_ID"
    }
  ]
}
```

After editing, regenerate types:

```bash
bun run cf-typegen
```

---

## 5. Run Migrations

Apply the database schema to production:

```bash
bun run db:migrate:prod
```

---

## 6. Deploy

```bash
bun run deploy
```

Your API will be available at:
```
https://profile-view-counter.<YOUR_SUBDOMAIN>.workers.dev
```

> [!TIP]
> Source maps are automatically uploaded (`upload_source_maps: true`) for production error debugging.

---

## Local Development

### Start Dev Server

```bash
bun run dev
```

This runs a local Cloudflare Workers environment with:
- D1 emulated locally
- KV emulated locally
- Hot reload on file changes

### Run Tests

```bash
bun run test              # Run all tests (unit + integration)
bun run test:unit         # Badge generator tests (bun:test, ~25ms)
bun run test:integration  # Worker integration tests (vitest + workerd pool)
```

### Lint, Format & Type Check

```bash
bun run check         # Lint + format check (ultracite / biome)
bun run fix           # Auto-fix lint & format
bun run typecheck     # TypeScript 7 type checking (tsc --noEmit)
```

---

## CI/CD

The project includes GitHub Actions workflows for:

- **CI** (`ci.yml`): Runs on every push/PR — `cf-typegen`, `check`, `typecheck`, `test:unit`, `test:integration`
- **Deploy** (`deploy.yml`): Deploys to Cloudflare Workers after CI succeeds on `master`/`main`
- **Release** (`release.yml`): Automated semantic versioning & changelog on push to `master`/`main`
- **Renovate Validate** (`renovate-validate.yml`): Validates `renovate.json` on changes
- **Renovate**: Automated dependency updates with auto-merge for minor/patch, dashboard approval for major

---

## Troubleshooting

### "DB not found" Error

Ensure `database_id` in `wrangler.jsonc` matches the output from `wrangler d1 create`.

### "KV not found" Error

Ensure `id` in `kv_namespaces` matches the output from `wrangler kv namespace create`.

### Migrations Fail

Run migrations locally first to verify:
```bash
bun run db:migrate
```

### Integration Tests Timeout

Ensure no stale `workerd` processes are running. Kill them and retry:
```bash
taskkill /f /im workerd.exe  # Windows
pkill workerd                # macOS/Linux
```

> [!CAUTION]
> Verify `bun = true` is NOT set in `bunfig.toml` `[run]` section — it breaks the workerd pool runner.

---

## Custom Domain

To use a custom domain:

1. Go to Cloudflare Dashboard → Workers & Pages → Your Worker
2. Click "Triggers" → "Custom Domains"
3. Add your domain (must be on Cloudflare DNS)
