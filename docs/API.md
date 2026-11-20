# API Reference

> Complete API documentation for Profile View Counter.

---

## Base URL

```
https://profile-view-counter.tashfiq61.workers.dev
```

---

## Common Headers

All responses include these headers (`requestId()` and `secureHeaders()` middleware):

| Header                      | Value                                                     | Description                           |
| --------------------------- | --------------------------------------------------------- | ------------------------------------- |
| `X-Request-Id`              | UUID                                                      | Unique request identifier for tracing |
| `X-Content-Type-Options`    | `nosniff`                                                 | MIME sniffing prevention              |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`            | HSTS                                  |
| `X-Frame-Options`           | `DENY`                                                    | Clickjacking prevention               |
| `Referrer-Policy`           | `no-referrer`                                             | Referrer leakage prevention           |
| `Permissions-Policy`        | `camera=(), fullscreen=(), geolocation=(), microphone=()` | Feature restrictions                  |

---

## Endpoints

### `GET /`

Returns API information and available endpoints.

**Response**

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

---

### `GET /health`

Health check endpoint for monitoring.

**Response**

```json
{
  "status": "ok",
  "timestamp": 1736405000000
}
```

---

### `GET /api/view-counter`

Counts one view for the user and returns the badge with the new count. Usernames are case-insensitive (`Octocat` and `octocat` share one counter). `HEAD` returns the same headers with an empty body and does not count.

**Query Parameters**

| Parameter  | Type   | Required | Description                                                            |
| ---------- | ------ | -------- | ---------------------------------------------------------------------- |
| `username` | string | Yes      | GitHub username (1-39 chars, alphanumeric + hyphens), case-insensitive |

**Success Response (200)**

- **Content-Type**: `image/svg+xml`
- **Additional Headers**:
  - `Cache-Control`: `max-age=0, no-cache, no-store, must-revalidate`, so GitHub's image proxy fetches (and counts) every view
  - `Content-Security-Policy`: `default-src 'none'; style-src 'unsafe-inline'`

**Examples**

```sh
# Markdown badge
[![Profile Views](https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam)](https://github.com/tashfiqul-islam/profile-view-counter)

# curl
curl "https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam"

# HTML
<img src="https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam" alt="Profile Views" />
```

**Error Responses**

| Status | Body                                                          | Description                             |
| ------ | ------------------------------------------------------------- | --------------------------------------- |
| 400    | `{"error": "Username is required"}` (or the rule that failed) | Invalid or missing `username` parameter |
| 500    | `{"error": "Internal Server Error"}`                          | Server failure                          |

---

### `GET /favicon.ico`

Returns 204 No Content.

---

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Not Found"
}
```

| Status | Message                                                             |
| ------ | ------------------------------------------------------------------- |
| 400    | The failed validation rule, e.g. `Username must be 1-39 characters` |
| 404    | `Not Found`                                                         |
| 500    | `Internal Server Error`                                             |

---

## Rate Limiting

No rate limiting is enforced. Counts are vanity metrics and the badge is unauthenticated, so repeated requests do raise the count; see the threat model in [SECURITY.md](../.github/SECURITY.md).

---

## CORS

CORS is enabled for all origins (`*`), allowing the badge to be embedded anywhere.
