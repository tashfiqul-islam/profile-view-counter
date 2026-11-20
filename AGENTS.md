# AGENTS.md

Cloudflare Worker that serves the "PROFILE VISITORS" SVG badge for GitHub READMEs and counts a view
per request. Hono routes, Valibot validates (and lowercases) the `username` query, D1 stores the
counts. Live at `https://profile-view-counter.tashfiq61.workers.dev`.

`src/` runs on **workerd**, not Bun or Node: no `Bun.*`, `fs`, `process` or `require()` there. Bun
is the package manager and runs `scripts/`.

## Loop

| Step  | Command                             | Done when                                                              |
| ----- | ----------------------------------- | ---------------------------------------------------------------------- |
| Setup | `mise install && mise run setup`    | deps, `worker-configuration.d.ts`, `hk` hooks                          |
| Gate  | `bun run check`                     | green: types, lint, format, tests                                      |
| Try   | `bun run db:migrate && bun run dev` | `curl localhost:8787/api/view-counter?username=octocat` returns an SVG |

The **gate** is the definition of done for every change: typecheck → type-aware lint (zero
warnings) → format check → Worker tests in workerd at **100 % coverage** (Vitest) → script tests at
**100 %** (bun test). A change that drops coverage is unfinished; add the test through the
module's interface. `mise run lint-actions` and `mise run lint-docs` cover workflows and docs.

Tool versions live in `mise.toml`, deps in `package.json`, scripts in `package.json#scripts`,
bindings in `wrangler.jsonc`. Read those instead of trusting any copy of them.

## Map

Read [`src/README.md`](src/README.md) before changing the Worker: request flow, every module's
role, invariants and recipes. [`scripts/README.md`](scripts/README.md) covers repo tooling.
[`docs/API.md`](docs/API.md) is the public contract; [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
covers self-hosting. Keep them current when routes, modules or contracts change.

Tests sit next to their module as `*.test.ts`. `src/index.test.ts` drives the whole app through
`app.fetch()` against real D1 in workerd; `src/test-setup.ts` applies `migrations/` to each
test file's isolated database.

## Working agreement

- Run the gate after every source edit; report it red or green, never "should pass".
- Plan first, then ask, before changing workflows, CI, `wrangler.jsonc` or migrations.
- Ask before every commit and every push.

## Conventions

- Validate request input with a Valibot schema in `src/schemas/` and `vValidator` at the route.
- Escape every dynamic value that enters SVG with `escapeXml()`.
- Bind every SQL value with `.bind()`; never build SQL from strings.
- Non-blocking work goes through `c.executionCtx.waitUntil()` with a `.catch()` that logs.
- Errors reach clients as `{ error: string }` JSON (400 carries the first Valibot issue message);
  details go to `console.error(JSON.stringify({ level, requestId, error, request }))`.
- Derive types from data: `as const satisfies T` for config objects, `readonly` interfaces.
- Mock at the seam with `vi.spyOn()` on the binding (`env.DB`) or `console`; the
  `afterEach` in `src/index.test.ts` restores them.
- Document in TSDoc, enforced by oxlint: every export gets a one-line summary, then
  `@param name - …`, `@returns`, `@throws` where relevant. Types live in TypeScript, never in JSDoc
  braces.
- Disable a lint rule only inline, with a `-- reason`.

## Gotchas

- **`worker-configuration.d.ts` is generated** by `bun run cf-typegen` (gitignored). Rerun it after
  any `wrangler.jsonc` change; never edit it.
- **Worker tests run in workerd.** Import test helpers from `cloudflare:test` and `env`
  from `cloudflare:workers`; never import `bun:test` under `src/`. `scripts/` tests are the
  opposite: `bun:test`, run by `bun test`.
- **`bun run dev` needs `bun run db:migrate` first**, or the first request fails with
  `no such table: view_counts`.
- **Every GET is a view.** The badge is sent with `no-store` so GitHub's image proxy never caches
  it; `HEAD` is answered without counting. Usernames are lowercased by the schema, and the
  `view_counts` key has a `CHECK (username = lower(username))`.
- **`conventional-changelog-conventionalcommits` stays on v8.** v9+ templates break the writer
  bundled with semantic-release (empty release notes). Renovate holds it via `allowedVersions`.
- **Never write `[skip ci]` or `[skip actions]` in a commit message or PR body**, not even quoted:
  GitHub then skips every push workflow for the squash commit, including the deploy.
- **`main` is ruleset-protected.** Changes land only through squash-merged PRs with a passing
  **CI / Quality gate**; nothing (not even CI) commits to `main` directly.
- **`linker = "isolated"`**: an import missing from `package.json` fails immediately.
- **`bunfig.toml` enforces a 3-day `minimumReleaseAge`**; pick tool and action versions at least
  that old as well.
- **`CLAUDE.md` only imports this file** (`@AGENTS.md`), so it works on every OS without
  symlinks. Edit `AGENTS.md`.
- **`TEST_MIGRATIONS` type-checks in Worker code but exists only under Vitest** (`src/test-env.d.ts`
  augments the shared `Env`). Never read it outside tests.

## Commits & releases

Conventional commits, enforced by commitlint in the `commit-msg` hook: `type(scope): subject`,
types and scopes in `commitlint.config.ts`.

PRs are **squash-merged**, so the PR title becomes the commit semantic-release reads: give it the
`type(scope): subject` that should drive the version. `feat` → minor; `fix`, `perf`, `revert`,
`security`, `chore(deps)`, `chore(bun)` → patch; everything else releases nothing (`scripts/pr-labels.ts`
labels each PR with its release impact).

Each push to `main` runs **Quality gate → Deploy → Release** in one workflow on the same commit.
Release is tag-only: `semantic-release` creates `vX.Y.Z` and a GitHub Release with generated notes.
There is no version field and no changelog commit; `CHANGELOG.md` is the archive up to v2.2.2.

## CI

| Workflow       | Trigger                    | Jobs                                                                             |
| -------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `ci.yml`       | PR, push to `main`, manual | **Quality gate**, **Dependency review** (PRs), **Deploy** → **Release** (`main`) |
| `pr.yml`       | PR opened, edited, updated | **Conventional title** (commitlint, required), **Type and release labels**       |
| `renovate.yml` | `renovate.json` changes    | strict config validation (pinned Renovate CLI)                                   |

- **Secrets stay in one job.** Only **Deploy** sees `CLOUDFLARE_API_TOKEN`, inside the
  `production` environment; it runs `wrangler d1 migrations apply` and `wrangler deploy`, nothing
  else. Keep new secret use in that shape.
- **Required checks on `main`:** Quality gate, Conventional title, Dependency review.
- **PR feedback is native annotations.** The Quality gate runs one step per tool; tsc (via
  `.github/matchers/tsc.json`), oxlint (`--format github`), Vitest, actionlint and zizmor
  (`--format github`) annotate the diff with no bot and no write token.
- **Shared steps live in `.github/actions/setup`** (mise tools via `tools:`, Bun cache,
  `install: all | none`), loaded with the self-repository syntax `uses: $/…`; actionlint doesn't
  know that syntax yet, so `.github/actionlint.yaml` ignores that one message.
- Workflows start from `permissions: {}`; every grant carries a `# why` comment. Actions are pinned
  to full commit SHAs with a `# vX.Y.Z` comment; tools come from `mise.toml` via `jdx/mise-action`.
- Renovate automerges non-major updates through PRs once CI is green; the hk version in `hk.pkl` and
  the Renovate CLI pin follow via regex managers.
