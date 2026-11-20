# Deployment Guide

> Step-by-step instructions for deploying Profile View Counter to Cloudflare Workers.

---

## Prerequisites

- **[mise](https://mise.jdx.dev)**, which installs Bun and the other tools pinned in `mise.toml`
- **Cloudflare account** (the free plan works)
- **Wrangler** comes from `devDependencies`; no global install needed

---

## 1. Clone & Install

```bash
git clone https://github.com/tashfiqul-islam/profile-view-counter.git
cd profile-view-counter
mise install && mise run setup
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
      "database_id": "YOUR_DATABASE_ID",
    },
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "YOUR_KV_ID",
    },
  ],
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

### Check

```bash
bun run check         # typecheck, type-aware lint, format check, tests at 100 % coverage
bun run format        # fix formatting
```

---

## CI/CD

`ci.yml` runs the Quality gate on every PR and push. On `main` it then runs **Deploy**
(`wrangler d1 migrations apply DB --remote`, then `wrangler deploy`) and **Release** (tag + GitHub
Release) on the same commit. To deploy a fork from GitHub Actions:

1. Create a Cloudflare API token with the **Edit Cloudflare Workers** template plus **D1: Edit**.
2. In the repository settings, create an environment named `production` and add the secret
   `CLOUDFLARE_API_TOKEN` to it.
3. Add the repository variable `CLOUDFLARE_ACCOUNT_ID` (your account ID is not a secret).

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

---

## Custom Domain

To use a custom domain:

1. Go to Cloudflare Dashboard → Workers & Pages → Your Worker
2. Click "Triggers" → "Custom Domains"
3. Add your domain (must be on Cloudflare DNS)
