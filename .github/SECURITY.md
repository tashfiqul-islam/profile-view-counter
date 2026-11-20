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

| Asset or entry point     | Threat                                       | Control                                                                                            |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `username` query         | Injection into SQL or SVG                    | Valibot schema (GitHub login rules), `.bind()` parameters, `escapeXml()` on every SVG value        |
| SVG response             | Script execution where the badge is embedded | `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`, `nosniff`                |
| All responses            | Clickjacking, referrer leaks, downgrade      | `secureHeaders()`: `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, HSTS                   |
| Errors                   | Internal detail disclosure                   | Clients get `{ error }` only; details go to structured logs                                        |
| Counter                  | Inflation by repeated requests               | Accepted risk: counts are vanity metrics; no auth exists to tie a view to a person                 |
| `CLOUDFLARE_API_TOKEN`   | Theft via a compromised workflow step        | Only the **Deploy** job sees it, in the `production` environment, running wrangler only            |
| `main` branch            | Unreviewed or untested code reaching prod    | Ruleset: PR + passing Quality gate + squash only, no force push; deploy runs on the tested SHA     |
| Dependencies and actions | Supply-chain compromise                      | Frozen lockfile, 3-day minimum release age, SHA-pinned actions, Renovate, dependency review on PRs |
| Workflows                | Template injection, excessive permissions    | `permissions: {}` by default, zizmor (strictest persona) and actionlint in the gate                |

## Contact

Use [GitHub Security Advisories](https://github.com/tashfiqul-islam/profile-view-counter/security/advisories/new)
or reach [@tashfiqul-islam](https://github.com/tashfiqul-islam) directly.
