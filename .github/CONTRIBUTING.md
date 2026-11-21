# Contributing

Thanks for your interest in **Profile View Counter**!

## Setup

Install [mise](https://mise.jdx.dev), then:

```sh
git clone https://github.com/tashfiqul-islam/profile-view-counter.git
cd profile-view-counter
mise install         # Bun, Node and the lint tools, at the versions in mise.toml
mise run setup       # bun install, worker types from wrangler.jsonc, hk git hooks
```

## Workflow

1. Branch from `main`: `git switch -c feat/your-change`.
2. Make the change with its tests next to the code (`src/**/*.test.ts`).
3. Run the gate: `bun run check` (typecheck, type-aware lint, format check, tests at 100 %
   coverage). `bun run format` fixes formatting; `mise run lint-actions` checks workflow edits.
4. Commit with a conventional message, e.g. `fix(badge): align count on 1-digit values`. The hk
   `commit-msg` hook runs commitlint; types and scopes are in `commitlint.config.ts`.
5. Open a PR against `main`. Its **title** must also be conventional: PRs are squash-merged, so the
   title is the commit that decides the release.

## Releases

Merging to `main` deploys the Worker and, when the title calls for it, tags `vX.Y.Z` with a GitHub
Release. A `!` after the type or a `BREAKING CHANGE:` note in the PR body releases a major version;
`feat` a minor; `fix`, `perf`, `revert`, `security` and `chore(deps)` (runtime dependencies) a
patch; other types, including dev-dependency bumps, release nothing. The PR's `release:` label shows the outcome
before you merge. Never write `[skip ci]` or `[skip actions]` in a commit message or PR body.

## Reporting issues

Open an issue at
[github.com/tashfiqul-islam/profile-view-counter/issues](https://github.com/tashfiqul-islam/profile-view-counter/issues).
For vulnerabilities, follow [SECURITY.md](SECURITY.md).

By contributing, you agree that your contributions are licensed under the [MIT License](../LICENSE).
