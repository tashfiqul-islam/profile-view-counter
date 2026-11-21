# API Reference

The public contract of the Profile View Counter Worker.

Base URL: `https://profile-view-counter.tashfiq61.workers.dev`

## Common headers

Every response carries these headers:

| Header                              | Value                                                     | Set by            |
| ----------------------------------- | --------------------------------------------------------- | ----------------- |
| `X-Request-Id`                      | UUID per request                                          | `requestId()`     |
| `Server-Timing`                     | request timing metrics                                    | `timing()`        |
| `Access-Control-Allow-Origin`       | `*`                                                       | `cors()`          |
| `Strict-Transport-Security`         | `max-age=63072000; includeSubDomains; preload`            | `secureHeaders()` |
| `X-Frame-Options`                   | `DENY`                                                    | `secureHeaders()` |
| `X-Content-Type-Options`            | `nosniff`                                                 | `secureHeaders()` |
| `Referrer-Policy`                   | `no-referrer`                                             | `secureHeaders()` |
| `Permissions-Policy`                | `camera=(), fullscreen=(), geolocation=(), microphone=()` | `secureHeaders()` |
| `Cross-Origin-Resource-Policy`      | `same-origin`                                             | `secureHeaders()` |
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

Returns the badge. On a cache miss it counts one view and renders a fresh SVG; repeat requests for
the same username within 60 seconds get the cached badge and are not counted.

| Parameter  | Type   | Required | Description                                          |
| ---------- | ------ | -------- | ---------------------------------------------------- |
| `username` | string | Yes      | GitHub username (1-39 chars, alphanumeric + hyphens) |

**200**: `Content-Type: image/svg+xml` with `Content-Security-Policy: default-src 'none';
style-src 'unsafe-inline'`, and

- `X-Cache: MISS` with `Cache-Control: no-cache, no-store, must-revalidate`, or
- `X-Cache: HIT` with `Cache-Control: public, max-age=60`.

| Status | Body                                                                      | When                                    |
| ------ | ------------------------------------------------------------------------- | --------------------------------------- |
| 400    | Valibot result: `{"success": false, "issues": [{"message": "...", ...}]}` | Invalid or missing `username` parameter |
| 500    | `{"error": "Internal Server Error"}`                                      | Server failure                          |

### Examples

```markdown
[![Profile Views](https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam)](https://github.com/tashfiqul-islam/profile-view-counter)
```

```sh
curl "https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam"
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

404 and 500 return JSON with an `error` field, for example `{ "error": "Not Found" }`. A 400 from
validation currently returns Valibot's result (above).

## Rate limiting

None. Counts are vanity metrics; see the threat model in [SECURITY.md](../.github/SECURITY.md).

## Embedding

`Access-Control-Allow-Origin: *` allows reading the badge from scripts on any origin. In GitHub
READMEs the badge loads through GitHub's image proxy (camo). Elsewhere, browsers apply
`Cross-Origin-Resource-Policy: same-origin` and block a direct cross-origin `<img>`.
