# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < Latest | No       |

Only the latest release receives security updates.

## Reporting a Vulnerability

> [!CAUTION]
> **Do not open a public issue for security vulnerabilities.**

Report vulnerabilities via [GitHub Security Advisories](https://github.com/tashfiqul-islam/profile-view-counter/security/advisories/new).

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | 48 hours |
| Initial assessment | 1 week |
| Fix release (critical) | 2 weeks |
| Fix release (other) | 1 month |

Confirmed vulnerabilities are fixed as a patch release and credited in the changelog.

## Security Measures

### Runtime

- **`secureHeaders()` middleware** — HSTS (2-year + preload), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: no-referrer, Permissions-Policy (camera, fullscreen, geolocation, microphone disabled)
- **SVG Content-Security-Policy** — `default-src 'none'; style-src 'unsafe-inline'` prevents script injection in embedded SVGs
- **`escapeXml()`** — defensive XML escaping for all dynamic SVG content (defense in depth)
- **Input validation** via Valibot schema at the API boundary (username: 1-39 chars, alphanumeric + hyphens)
- **Parameterized SQL queries** via D1 `.bind()` — no string concatenation
- **Structured error logging** — `JSON.stringify({ level, requestId, error, request })` for traceability, generic messages returned to clients
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

## AI Agent Security Rules

When working with this codebase:

- Never print or paste secret values (tokens, API keys) in chat responses, commits, or shared logs
- Mirror CI env names exactly, but do not inline literal secret values in commands
- If a required secret is missing locally, stop and ask the user rather than inventing placeholder credentials
- Never commit local secret files; if documenting env setup, use placeholder-only examples
- When sharing command output, summarize and redact sensitive-looking values

## Contact

For security concerns, reach out via [GitHub Security Advisories](https://github.com/tashfiqul-islam/profile-view-counter/security/advisories/new) or contact [@tashfiqul-islam](https://github.com/tashfiqul-islam) directly.
