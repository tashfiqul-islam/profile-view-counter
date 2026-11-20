# CI and deploy

Read when: changing a workflow, the deploy, Renovate, a tool or action version, or debugging a
failed run.

## Rules

- **Pipeline**: `ci.yml` runs **Quality gate** on every PR and push; on `main` it then runs
  **Deploy** (`production` environment: `wrangler d1 migrations apply DB --remote`, then
  `wrangler deploy`) and **Release** (semantic-release, tag + GitHub Release, nothing committed to
  `main`) on the same commit. `pr.yml` checks the title and labels the release; `renovate.yml`
  validates `renovate.json` with a pinned Renovate CLI.
- **One step per tool** in the Quality gate, each speaking GitHub annotations (tsc via
  `.github/matchers/tsc.json`, `oxlint --format github`, actionlint's template, `zizmor --format
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
  managers. `conventional-changelog-conventionalcommits` stays below v9 (v9+ renders empty notes).
- **Debugging a failed run**: `gh run view <id> --log-failed`, reproduce locally with the same
  command, fix the cause.

## Enforced by

- `mise run lint-actions` (actionlint + zizmor) in the hk pre-commit hook and the Quality gate.
- Required checks on `main`: Quality gate, Conventional title, Dependency review.
