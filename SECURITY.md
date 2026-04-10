# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < Latest | No       |

Only the latest release receives security updates.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please report vulnerabilities via [GitHub Security Advisories](https://github.com/tashfiqul-islam/profile-view-counter/security/advisories/new).

You will receive a response within 48 hours. If confirmed, a fix will be released as a patch and credited in the changelog.

## Security Measures

This project implements the following security practices:

### Runtime

- **`secureHeaders()` middleware** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP
- **`X-Content-Type-Options: nosniff`** on all SVG responses
- **Input validation** via Valibot schema at the API boundary (username: 1-39 chars, alphanumeric + hyphens)
- **Parameterized SQL queries** via D1 `.bind()` — no string concatenation
- **Structured error logging** — internal details logged server-side, generic messages returned to clients
- **No secrets in source code** — Cloudflare credentials managed via GitHub Secrets and Wrangler

### CI/CD

- **GitHub Actions SHA-pinned** — all action references use commit SHA, not mutable tags
- **Least-privilege permissions** — each workflow declares minimum required permissions
- **SLSA provenance attestation** on releases
- **Renovate vulnerability alerts** with auto-merge enabled
- **Isolated package linker** (`linker = "isolated"` in bunfig.toml) — phantom dependencies fail immediately

### Dependencies

- Automated dependency updates via Renovate with 3-day minimum release age
- Major updates require manual dashboard approval
- Vulnerability alerts auto-merge at any time

## Scope

This project is a public API that serves SVG badge images. It:

- **Does not** handle authentication or user accounts
- **Does not** store PII (only GitHub usernames, which are public)
- **Does not** process payments or sensitive data
- **Does** accept user input (the `username` query parameter) which is validated at the boundary

## Contact

For security concerns, reach out via [GitHub Security Advisories](https://github.com/tashfiqul-islam/profile-view-counter/security/advisories/new) or contact [@tashfiqul-islam](https://github.com/tashfiqul-islam) directly.
