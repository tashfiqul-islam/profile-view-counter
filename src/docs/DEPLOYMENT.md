# Deployment Guide

> Step-by-step instructions for deploying Profile View Counter to Cloudflare Workers.

---

## Prerequisites

- **Bun** v1.2+ installed
- **Cloudflare Account** (free tier works)
- **Wrangler CLI** (included in devDependencies)

---

## 1. Clone & Install

```bash
git clone https://github.com/tashfiqul-islam/profile-view-counter.git
cd profile-view-counter
bun install
```

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
      "database_id": "YOUR_DATABASE_ID" // <-- Replace
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "YOUR_KV_ID" // <-- Replace
    }
  ]
}
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
bun run test --coverage
```

---

## CI/CD

The project includes GitHub Actions workflows for:

- **CI**: Runs on every push/PR (lint, typecheck, test)
- **Renovate**: Automated dependency updates
- **Semantic Release**: Automated versioning and changelog

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

---

## Custom Domain

To use a custom domain:

1. Go to Cloudflare Dashboard → Workers & Pages → Your Worker
2. Click "Triggers" → "Custom Domains"
3. Add your domain (must be on Cloudflare DNS)
