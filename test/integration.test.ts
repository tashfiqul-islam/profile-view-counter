import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/index'
import type { Env } from '../src/types/env'

// Cast the global env to our fully typed Env interface
const testEnv = env as unknown as Env

describe('Integration Tests (Hono + D1 + KV)', () => {
  beforeAll(async () => {
    // Initialize test database schema
    // Use prepare().run() to avoid potential D1 mock issues with exec()
    await testEnv.DB.prepare(`
      CREATE TABLE IF NOT EXISTS view_counts (
        username TEXT PRIMARY KEY NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run()
  })

  it('GET / returns friendly JSON message', async () => {
    const req = new Request('http://localhost/')
    const ctx = createExecutionContext()
    const res = await app.fetch(req, testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('message', 'Profile View Counter API is running 🚀')
    expect(body).toHaveProperty('endpoints')
  })

  it('GET /health returns ok', async () => {
    const req = new Request('http://localhost/health')
    const ctx = createExecutionContext()
    const res = await app.fetch(req, testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('status', 'ok')
    expect(body).toHaveProperty('timestamp')
  })

  it('GET /favicon.ico returns 204', async () => {
    const req = new Request('http://localhost/favicon.ico')
    const ctx = createExecutionContext()
    const res = await app.fetch(req, testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(204)
  })

  it('GET /api/view-counter increments count, generates badge, and caches result', async () => {
    const username = 'integration-test'
    // 1. First Request (Miss)
    const req1 = new Request(`http://localhost/api/view-counter?username=${username}&style=modern`)
    const ctx1 = createExecutionContext()
    const res1 = await app.fetch(req1, testEnv, ctx1)
    await waitOnExecutionContext(ctx1)

    expect(res1.status).toBe(200)
    expect(res1.headers.get('X-Cache')).toBe('MISS')
    expect(await res1.text()).toContain('PROFILE VISITORS')

    // Verify DB increment
    const dbResult = await testEnv.DB.prepare('SELECT views FROM view_counts WHERE username = ?')
      .bind(username)
      .first<{ views: number }>()
    expect(dbResult?.views).toBe(1)

    // 2. Second Request (Hit)
    const req2 = new Request(`http://localhost/api/view-counter?username=${username}&style=modern`)
    const ctx2 = createExecutionContext()
    const res2 = await app.fetch(req2, testEnv, ctx2)
    await waitOnExecutionContext(ctx2)

    expect(res2.status).toBe(200)
    expect(res2.headers.get('X-Cache')).toBe('HIT') // Should be cached in KV
  })

  it('GET /api/view-counter validates query params', async () => {
    // Missing username
    const req = new Request('http://localhost/api/view-counter')
    const ctx = createExecutionContext()
    const res = await app.fetch(req, testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(400) // validation error
  })

  it('handles 404 for unknown routes', async () => {
    const req = new Request('http://localhost/unknown-route')
    const ctx = createExecutionContext()
    const res = await app.fetch(req, testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Not Found' })
  })

  it('handles 500 errors', async () => {
    // Mock the DB to throw an error
    const originalPrepare = testEnv.DB.prepare
    testEnv.DB.prepare = () => {
      throw new Error('Database failure')
    }

    try {
      const req = new Request('http://localhost/api/view-counter?username=error-test')
      const ctx = createExecutionContext()
      const res = await app.fetch(req, testEnv, ctx)
      await waitOnExecutionContext(ctx)

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body).toEqual({ error: 'Internal Server Error' })
    } finally {
      // Restore mock
      testEnv.DB.prepare = originalPrepare
    }
  })

  it('counter service handles missing result', async () => {
    // This tests the `result?.views ?? 1` line in counter.ts
    // We mock the DB to return null for the query
    const originalPrepare = testEnv.DB.prepare
    testEnv.DB.prepare = () =>
      ({
        bind: () => ({
          first: async () => null,
        }),
      }) as unknown as D1PreparedStatement

    try {
      const { incrementViewCount } = await import('../src/services/counter')
      const count = await incrementViewCount(testEnv.DB, 'test-k')
      expect(count).toBe(1)
    } finally {
      testEnv.DB.prepare = originalPrepare
    }
  })
})
