# API Reference

The public contract of the Profile View Counter Worker.

Base URL: `https://profile-view-counter.tashfiq61.workers.dev`

## Common headers

Every response carries these headers:

| Header                              | Value                                                     | Set by            |
| ----------------------------------- | --------------------------------------------------------- | ----------------- |
| `X-Request-Id`                      | UUID per request                                          | `requestId()`     |
| `Access-Control-Allow-Origin`       | `*`                                                       | `cors()`          |
| `Cross-Origin-Resource-Policy`      | `cross-origin`                                            | `secureHeaders()` |
| `Strict-Transport-Security`         | `max-age=63072000; includeSubDomains; preload`            | `secureHeaders()` |
| `X-Frame-Options`                   | `DENY`                                                    | `secureHeaders()` |
| `X-Content-Type-Options`            | `nosniff`                                                 | `secureHeaders()` |
| `Referrer-Policy`                   | `no-referrer`                                             | `secureHeaders()` |
| `Permissions-Policy`                | `camera=(), fullscreen=(), geolocation=(), microphone=()` | `secureHeaders()` |
| `Cross-Origin-Opener-Policy`        | `same-origin`                                             | `secureHeaders()` |
| `Origin-Agent-Cluster`              | `?1`                                                      | `secureHeaders()` |
| `X-DNS-Prefetch-Control`            | `off`                                                     | `secureHeaders()` |
| `X-Download-Options`                | `noopen`                                                  | `secureHeaders()` |
| `X-Permitted-Cross-Domain-Policies` | `none`                                                    | `secureHeaders()` |
| `X-XSS-Protection`                  | `0`                                                       | `secureHeaders()` |

## `GET /`

API information and the available endpoints.

```json
{
  "message": "Profile View Counter API is running 🚀",
  "endpoints": {
    "health": "/health",
    "view_counter": "/api/view-counter?username=:username"
  },
  "documentation": "https://github.com/tashfiqul-islam/profile-view-counter"
}
```

## `GET /health`

Health check for monitoring.

```json
{ "status": "ok", "timestamp": 1736405000000 }
```

## `GET /api/view-counter`

Counts one view and returns the badge with the new count. Usernames are case-insensitive
(`Octocat` and `octocat` share one counter). `HEAD` returns the same headers with an empty body
and counts nothing.

| Parameter     | Type   | Required | Description                                                                     |
| ------------- | ------ | -------- | ------------------------------------------------------------------------------- |
| `username`    | string | Yes      | GitHub username (1-39 chars, alphanumeric + hyphens), case-insensitive, once    |
| `theme`       | string | No       | `graphite` (default), `aurora`, `mono`, `paper`, `contribution` or `adaptive`   |
| `color`       | string | No       | Count background as 6-digit hex without `#`, e.g. `e11d48`; overrides the theme |
| `label_color` | string | No       | Label background as 6-digit hex without `#`; overrides the theme                |
| `base`        | number | No       | Views carried over from another counter, 0 to 1000000000; added to the badge    |

Styling parameters never affect the count. Text on a custom background is white or dark,
whichever contrasts more. `base` changes only what the badge shows: the badge reads stored views
plus `base`, and the database keeps the real views alone. It matches the `base` parameter of
komarev's GitHub Profile Views Counter, so switching keeps the same query.

**200**: `Content-Type: image/svg+xml`, `Cache-Control: max-age=0, no-cache, no-store,
must-revalidate` (so GitHub's image proxy fetches, and counts, every view) and
`Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`.

| Status | Body                                  | When                                                         |
| ------ | ------------------------------------- | ------------------------------------------------------------ |
| 400    | `{"error": "<the rule that failed>"}` | A missing, repeated or invalid `username`, styling or `base` |
| 500    | `{"error": "Internal Server Error"}`  | Server failure                                               |

Validation reports the username first. Messages include `Username is required`,
`Username must be a single value`, `Username must be 1-39 characters`,
`theme must be one of: graphite, aurora, mono, paper, contribution, adaptive` and
`color must be a 6-digit hex colour like 0969da` and
`base must be a whole number from 0 to 1000000000`.

### Examples

```markdown
[![Profile Views](https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam&theme=aurora)](https://github.com/tashfiqul-islam/profile-view-counter)
```

```sh
curl "https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam&color=e11d48"
```

```html
<img
  src="https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam"
  alt="Profile Views"
/>
```

## `GET /favicon.ico`

`204 No Content`.

## Errors

Every error is JSON with an `error` field, for example `{ "error": "Not Found" }`:

| Status | `error`                            |
| ------ | ---------------------------------- |
| 400    | The failed validation rule (above) |
| 404    | `Not Found`                        |
| 500    | `Internal Server Error`            |

## Rate limiting

None. Counts are vanity metrics and the badge is unauthenticated, so repeated requests raise the
count; see the threat model in [SECURITY.md](../.github/SECURITY.md).

## Embedding

The badge loads anywhere: in GitHub READMEs through GitHub's image proxy (camo), and directly on
any other site, because responses send `Cross-Origin-Resource-Policy: cross-origin` and
`Access-Control-Allow-Origin: *`.
