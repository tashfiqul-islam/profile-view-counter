# Security Policy

Only the deployed Worker and the latest release are supported.

## Reporting a vulnerability

> [!CAUTION]
> Do not open a public issue for a vulnerability.

Report it through
[GitHub Security Advisories](https://github.com/tashfiqul-islam/profile-view-counter/security/advisories/new).
Expect an acknowledgement within 48 hours and an assessment within a week; confirmed issues ship as
a patch release.

## Threat model

The Worker is a public, unauthenticated endpoint that renders an SVG and increments a counter. It
stores GitHub usernames (public) and view counts, nothing else.

| Asset or entry point     | Threat                                       | Control                                                                                                                            |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Query string             | Injection into SQL or SVG                    | Valibot schema (username, theme picklist, hex colours), `.bind()`, `escapeXml()` on SVG text, colours re-validated by the renderer |
| SVG response             | Script execution where the badge is embedded | `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`, `nosniff`                                                |
| All responses            | Clickjacking, referrer leaks, downgrade      | `secureHeaders()`: `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, HSTS; CORP `cross-origin` on purpose (a public badge)  |
| Errors                   | Internal detail disclosure                   | Clients get `{ error }` only; details go to structured logs                                                                        |
| Counter                  | Inflation by repeated requests               | Accepted risk: counts are vanity metrics; no auth exists to tie a view to a person                                                 |
| `CLOUDFLARE_API_TOKEN`   | Theft via a compromised workflow step        | Lives in the `production` environment; only the **Deploy** job reads it, running wrangler only                                     |
| `main` branch            | Unreviewed or untested code reaching prod    | Ruleset: PR, required checks, squash only, no force push; deploy runs on the tested commit                                         |
| Dependencies and actions | Supply-chain compromise                      | Frozen lockfile, 3-day minimum release age, SHA-pinned actions, Renovate, dependency review on PRs                                 |
| Workflows                | Template injection, excessive permissions    | `permissions: {}` by default, zizmor (strictest persona) and actionlint in the gate                                                |

## Operating requirements

The controls above assume these repository settings, applied by the owner (they are not in the
code, so check them after any settings change):

- A ruleset on `main`: pull request required, squash merge only, linear history, signed commits,
  no force push or deletion, required checks **Quality gate**, **Conventional title** and
  **Dependency review**, no bypass actors.
- Squash commits use the PR title as the header and the PR body as the message; merge commits and
  rebase merges are off; branches are deleted on merge; auto-merge is allowed for Renovate.
- `CLOUDFLARE_API_TOKEN` is a secret of the `production` environment (deployments from `main`
  only), with no repository-level copy. `CLOUDFLARE_ACCOUNT_ID` is a repository variable.
- Secret scanning with push protection, private vulnerability reporting and Dependabot alerts are
  on.

## Contact

Use [GitHub Security Advisories](https://github.com/tashfiqul-islam/profile-view-counter/security/advisories/new)
or reach [@tashfiqul-islam](https://github.com/tashfiqul-islam) directly.
