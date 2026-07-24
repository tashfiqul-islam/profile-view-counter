# API Reference

> Complete API documentation for Profile View Counter.

---

## Base URL

```
https://profile-view-counter.tashfiq61.workers.dev
```

---

## Common Headers

All responses include these security and observability headers (via `secureHeaders()` middleware):

| Header | Value | Description |
|--------|-------|-------------|
| `X-Request-Id` | UUID | Unique request identifier for tracing |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HSTS |
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `Referrer-Policy` | `no-referrer` | Referrer leakage prevention |
| `Permissions-Policy` | `camera=(), fullscreen=(), geolocation=(), microphone=()` | Feature restrictions |
| `Server-Timing` | varies | Request timing metrics |

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

Generates an SVG badge and increments the view count for the specified user.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | GitHub username (1-39 chars, alphanumeric + hyphens) |

**Success Response (200)**

- **Content-Type**: `image/svg+xml`
- **Additional Headers**:
  - `X-Cache`: `HIT` (served from cache) or `MISS` (freshly generated)
  - `Cache-Control`: `public, max-age=60` (cache hit) or `no-cache, no-store, must-revalidate` (cache miss)
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

| Status | Body | Description |
|--------|------|-------------|
| 400 | `{"error": "..."}` | Invalid or missing `username` parameter |
| 500 | `{"error": "Internal Server Error"}` | Server failure |

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

| Status | Message |
|--------|---------|
| 400 | Validation error details |
| 404 | `Not Found` |
| 500 | `Internal Server Error` |

---

## Rate Limiting

No rate limiting is enforced. The KV cache provides natural protection by serving cached badges for 60 seconds.

---

## CORS

CORS is enabled for all origins (`*`), allowing the badge to be embedded anywhere.
