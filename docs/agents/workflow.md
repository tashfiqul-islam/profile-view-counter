# Workflow

Read when: committing, naming a branch or PR, reviewing a diff, or predicting what a merge releases.

## Rules

- Branch from `main` as `<type>/<topic>`, for example `feat/badge-themes`.
- Commit messages are conventional: `type(scope): subject`, types and scopes in
  `commitlint.config.ts`, header and body lines at most 100 characters. The hk `commit-msg` hook
  checks them; commits are signed.
- PRs are **squash-merged** and the squash commit takes the PR title, so the title is the release
  decision:

  | Title type                                                       | Release |
  | ---------------------------------------------------------------- | ------- |
  | `feat`                                                           | minor   |
  | `fix`, `perf`, `revert`, `security`, `chore(deps)`, `chore(bun)` | patch   |
  | `!` after the type, or a `BREAKING CHANGE:` footer in the body   | major   |
  | everything else (`docs`, `ci`, `build`, `test`, `refactor`, …)   | none    |

  The `release:` label that `pr.yml` sets shows the outcome before merge.

- Keep the literal strings `[skip ci]` and `[skip actions]` out of commit messages, PR titles and PR
  bodies, quoted or not: GitHub then skips every push workflow for the squash commit, deploy
  included. Refer to them as "skip markers".
- Split a large change into topic commits that each pass `bun run check`; the PR body carries a
  summary, evidence (commands and results), merge danger and a review guide.
- Every merge to `main` deploys, then tags `vX.Y.Z` with a GitHub Release when the title calls for
  one. Release notes come from the squash titles; `CHANGELOG.md` is an archive up to v2.2.2.

## Review

- Review the whole diff against the PR's stated intent, then read what every new test asserts: a
  test that cannot fail is a finding.
- Check docs and guides changed with the behaviour they describe.
- Items under "Reviewers: not findings here" in `AGENTS.md` are settled decisions.

## Enforced by

- `pr.yml` → **Conventional title** (commitlint on the title, every event) and **Type and release
  labels** (`scripts/pr-labels.ts`, which mirrors `.releaserc.json`).
- The `main` ruleset: PR required, squash only, signed commits, required checks.

## Read more

- [`scripts/README.md`](../../scripts/README.md): how labels mirror commit-analyzer.
- [`.github/CONTRIBUTING.md`](../../.github/CONTRIBUTING.md): the human version of this guide.
