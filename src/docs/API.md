# API Reference

> Complete API documentation for Profile View Counter.

---

## Base URL

```
https://profile-view-counter.tashfiq61.workers.dev
```

---

## Endpoints

### `GET /`

Returns API information and available endpoints.

**Response**
```json
{
  "message": "Profile View Counter API is running 🚀",
  "version": "2.0.0",
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
| `username` | string | ✅ | GitHub username (1-39 chars, alphanumeric + hyphens) |

**Success Response (200)**

- **Content-Type**: `image/svg+xml`
- **Headers**:
  - `X-Cache`: `HIT` (served from cache) or `MISS` (freshly generated)
  - `Cache-Control`: `public, max-age=60` (cache hit) or `no-cache` (cache miss)

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Invalid or missing `username` parameter |
| 500 | Internal server error |

**Example**
```bash
curl "https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam"
```

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

Currently, no rate limiting is enforced. The KV cache provides natural protection by serving cached badges for 60 seconds.

---

## CORS

CORS is enabled for all origins (`*`), allowing the badge to be embedded anywhere.
