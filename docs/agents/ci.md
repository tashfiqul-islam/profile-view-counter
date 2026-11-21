# CI and deploy

Read when: changing a workflow, the deploy, Renovate, a tool or action version, or debugging a
failed run.

## Rules

- **Pipeline**: `ci.yml` runs **Quality gate** on every PR, every push to `main` and manual runs; on
  `main` it then runs **Deploy** (`production` environment: `bun run db:migrate:prod`, then
  `bun run deploy`) and **Release** (semantic-release, tag + GitHub Release, nothing committed to
  `main`) on the same commit. A manual run on `main` redeploys. Runs queue per ref and event, so a
  manual run never replaces a pending push run. `pr.yml` checks the title and labels the release; `renovate.yml`
  validates `renovate.json` with a pinned Renovate CLI.
- **One step per tool** in the Quality gate, each speaking GitHub annotations (tsc on both
  programs via `.github/matchers/tsc.json`, `oxlint --format github`, actionlint's template, `zizmor --format
  github`), each guarded by `if: ${{ !cancelled() && steps.setup.outcome == 'success' }}`. Keep the
  gate and `bun run check` in step.
- **Shared setup** is `.github/actions/setup` (mise tools via `tools:`, Bun cache, frozen install),
  loaded with the self-repository syntax `uses: $/.github/actions/setup`; `.github/actionlint.yaml`
  ignores the one message actionlint raises about it.
- **Versions**: tools in `mise.toml`, deps in `package.json` (exact pins), actions pinned to full
  SHAs with a `# vX.Y.Z` comment. Pick releases at least 3 days old (`bunfig.toml`
  `minimumReleaseAge`). `vitest`, `@vitest/coverage-istanbul` and `@cloudflare/vitest-plugin`
  move together; so do `wrangler` and the plugin (one miniflare build).
- **Renovate** automerges non-major updates through PRs once CI is green; majors wait on the
  dependency dashboard; the hk version in `hk.pkl` and the Renovate CLI pin follow via regex
  managers. Runtime dependencies commit as `chore(deps)` (patch release); dev dependencies as
  `chore(tooling)` and Bun as `chore(bun)` (no release). `conventional-changelog-conventionalcommits`
  stays below v9: v10 renders empty notes and v9 is unproven.
- **Security updates younger than 3 days** can fail Renovate's lockfile step, because `bun install`
  honours `minimumReleaseAge`; the PR then shows an artifact error, so merge it by hand once the
  release is 3 days old.
- **Repository settings** (ruleset, squash title and body, `production` environment, secret
  scanning) are owner-applied; the list is under operating requirements in
  [`.github/SECURITY.md`](../../.github/SECURITY.md).
- **Debugging a failed run**: `gh run view <id> --log-failed`, reproduce locally with the same
  command, fix the cause.

## Enforced by

- `mise run lint-actions` (actionlint + zizmor) in the hk pre-commit hook and the Quality gate.
- Required checks on `main` (ruleset): Quality gate, Conventional title, Dependency review.
