# `scripts/`

Repository tooling that runs on Bun, outside the Worker.

| Script                           | Runs in                       | Tested by                                  |
| -------------------------------- | ----------------------------- | ------------------------------------------ |
| [`pr-labels.ts`](pr-labels.ts)   | `pr.yml` → **labels** job     | [`pr-labels.test.ts`](pr-labels.test.ts)   |
| [`agent-docs.ts`](agent-docs.ts) | `bun run check`, Quality gate | [`agent-docs.test.ts`](agent-docs.test.ts) |

## `pr-labels.ts`

Turns a PR title into two managed labels: `type: <type>` and `release: major | minor | patch |
none`. PRs are squash-merged, so the title is the commit semantic-release will read and the body is
its message; the release label applies `.releaserc.json`'s own `releaseRules` with a faithful port
of commit-analyzer's algorithm: matching rules apply in order, a later `release: false` overrides
earlier matches, `major` ends the scan, and if no custom rule matches the plugin's defaults apply. A
`!` or a `BREAKING CHANGE:` footer means major. The label therefore cannot disagree with the
release job, and `pr-labels.test.ts` pins each of those semantics against the real config, so a
rule change that would silence releases fails the gate.

`labelsFor(title, body)` is the pure core; the CLI reads `PR_TITLE` / `PR_BODY` and prints
`type=…` / `release=…` for `$GITHUB_OUTPUT`. The workflow then replaces any stale `type:` or
`release:` label, so editing a title relabels the PR.

## `agent-docs.ts`

Keeps `AGENTS.md` a router: it stays at most 8,192 bytes, each guide in `docs/agents/` at most
6,144 bytes, every guide opens with `# Title` and `Read when: …`, and every guide is linked from
`AGENTS.md`. `checkAgentDocs()` is the pure core; the CLI reads the files and exits 1 on a
violation.

```sh
bun test scripts/
PR_TITLE='fix(badge): crisp edges' bun scripts/pr-labels.ts
```
