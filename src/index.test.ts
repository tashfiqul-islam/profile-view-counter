import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "./index";

const testEnv: Env = env;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Integration Tests (Hono + D1 + KV)", () => {
  describe("GET /", () => {
    it("returns API info with all required fields", async () => {
      const req = new Request("http://localhost/");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("message", "Profile View Counter API is running 🚀");
      expect(body).toHaveProperty("endpoints");
      expect(body).toHaveProperty("documentation");
    });
  });

  describe("GET /health", () => {
    it("returns ok status with numeric timestamp", async () => {
      const req = new Request("http://localhost/health");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(200);
      const body = await res.json<{ readonly status: string; readonly timestamp: number }>();
      expect(body.status).toBe("ok");
      expect(body.timestamp).toBeGreaterThan(0);
    });
  });

  describe("GET /favicon.ico", () => {
    it("returns 204 with empty body", async () => {
      const req = new Request("http://localhost/favicon.ico");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(204);
      expect(await res.text()).toBe("");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
  });

  describe("GET /api/view-counter", () => {
    it("increments count, generates badge, and caches result", async () => {
      const username = "integration-test";

      const req1 = new Request(`http://localhost/api/view-counter?username=${username}`);
      const ctx1 = createExecutionContext();
      const res1 = await app.fetch(req1, testEnv, ctx1);
      await waitOnExecutionContext(ctx1);

      expect(res1.status).toBe(200);
      expect(res1.headers.get("X-Cache")).toBe("MISS");
      expect(res1.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(await res1.text()).toContain("PROFILE VISITORS");

      const dbResult = await testEnv.DB.prepare("SELECT views FROM view_counts WHERE username = ?")
        .bind(username)
        .first<{ views: number }>();
      expect(dbResult?.views).toBe(1);

      const req2 = new Request(`http://localhost/api/view-counter?username=${username}`);
      const ctx2 = createExecutionContext();
      const res2 = await app.fetch(req2, testEnv, ctx2);
      await waitOnExecutionContext(ctx2);

      expect(res2.status).toBe(200);
      expect(res2.headers.get("X-Cache")).toBe("HIT");
      expect(res2.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("returns SVG with Content-Security-Policy header", async () => {
      const req = new Request("http://localhost/api/view-counter?username=csp-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Security-Policy")).toBe(
        "default-src 'none'; style-src 'unsafe-inline'",
      );
    });

    it("returns response with X-Request-Id header", async () => {
      const req = new Request("http://localhost/api/view-counter?username=requestid-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Request-Id")).toBeTruthy();
    });

    it("validates missing username returns 400", async () => {
      const req = new Request("http://localhost/api/view-counter");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(400);
    });

    it("validates invalid username format returns 400", async () => {
      const req = new Request("http://localhost/api/view-counter?username=-starts-with-dash");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(400);
    });

    it("validates too-long username returns 400", async () => {
      const longUsername = "a".repeat(40);
      const req = new Request(`http://localhost/api/view-counter?username=${longUsername}`);
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(400);
    });

    it("increments multiple rapid requests correctly", async () => {
      const username = "rapid-test";
      const count = 5;

      const results = await Promise.all(
        Array.from({ length: count }, (_, i) => {
          const req = new Request(`http://localhost/api/view-counter?username=${username}&_=${i}`);
          const ctx = createExecutionContext();
          return (async () => {
            const res = await app.fetch(req, testEnv, ctx);
            await waitOnExecutionContext(ctx);
            return res;
          })();
        }),
      );

      expect(results.every((r) => r.status === 200)).toBe(true);

      const dbResult = await testEnv.DB.prepare("SELECT views FROM view_counts WHERE username = ?")
        .bind(username)
        .first<{ views: number }>();
      expect(dbResult?.views).toBe(count);
    });

    it("returns correct Content-Type for SVG", async () => {
      const req = new Request("http://localhost/api/view-counter?username=content-type-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    });

    it("returns X-Cache HIT on second request for same user", async () => {
      const username = "cache-hit-test";

      const req1 = new Request(`http://localhost/api/view-counter?username=${username}`);
      const ctx1 = createExecutionContext();
      await app.fetch(req1, testEnv, ctx1);
      await waitOnExecutionContext(ctx1);

      const req2 = new Request(`http://localhost/api/view-counter?username=${username}`);
      const ctx2 = createExecutionContext();
      const res2 = await app.fetch(req2, testEnv, ctx2);
      await waitOnExecutionContext(ctx2);

      expect(res2.headers.get("X-Cache")).toBe("HIT");
    });
  });

  describe("Error handling", () => {
    it("handles 404 for unknown routes", async () => {
      const req = new Request("http://localhost/unknown-route");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "Not Found" });
    });

    it("handles 500 errors with structured logging", async () => {
      vi.spyOn(testEnv.DB, "prepare").mockImplementation(() => {
        throw new Error("Database failure");
      });
      const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

      const req = new Request("http://localhost/api/view-counter?username=error-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Internal Server Error" });
      expect(log).toHaveBeenCalledWith(expect.stringContaining('"message":"Database failure"'));
    });

    it("handles KV cache write failure gracefully", async () => {
      vi.spyOn(testEnv.CACHE, "put").mockRejectedValue(new Error("KV write failed"));
      const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

      const req = new Request("http://localhost/api/view-counter?username=cache-fail-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Cache")).toBe("MISS");
      expect(log).toHaveBeenCalledWith(expect.stringContaining('"error":"cache-write-failed"'));
    });

    it("counter service throws on null D1 result", async () => {
      // Every D1 statement shares one prototype, so this also covers the statement `bind()` returns.
      const statement: D1PreparedStatement = Object.getPrototypeOf(testEnv.DB.prepare("SELECT 1"));
      vi.spyOn(statement, "first").mockResolvedValue(null);
      const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

      const req = new Request("http://localhost/api/view-counter?username=null-result-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Internal Server Error" });
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining("D1 increment returned no rows for username: null-result-test"),
      );
    });
  });

  describe("Security headers", () => {
    const routes = ["/", "/health", "/favicon.ico"];

    for (const route of routes) {
      it(`${route} returns X-Frame-Options DENY`, async () => {
        const req = new Request(`http://localhost${route}`);
        const ctx = createExecutionContext();
        const res = await app.fetch(req, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      });

      it(`${route} returns Referrer-Policy no-referrer`, async () => {
        const req = new Request(`http://localhost${route}`);
        const ctx = createExecutionContext();
        const res = await app.fetch(req, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
      });

      it(`${route} returns Strict-Transport-Security`, async () => {
        const req = new Request(`http://localhost${route}`);
        const ctx = createExecutionContext();
        const res = await app.fetch(req, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
      });

      it(`${route} returns X-Content-Type-Options nosniff`, async () => {
        const req = new Request(`http://localhost${route}`);
        const ctx = createExecutionContext();
        const res = await app.fetch(req, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      });
    }
  });

  describe("CORS", () => {
    it("returns Access-Control-Allow-Origin on the badge endpoint", async () => {
      const req = new Request("http://localhost/api/view-counter?username=cors-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("Response contracts", () => {
    it("GET / returns InfoResponse shape", async () => {
      const req = new Request("http://localhost/");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      const body = await res.json<Record<string, unknown>>();
      expect(body).toMatchObject({
        documentation: expect.any(String),
        endpoints: expect.any(Object),
        message: expect.any(String),
      });
    });

    it("GET /health returns HealthResponse shape", async () => {
      const req = new Request("http://localhost/health");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      const body = await res.json<Record<string, unknown>>();
      expect(body).toMatchObject({
        status: "ok",
        timestamp: expect.any(Number),
      });
    });

    it("error responses return { error: string } shape", async () => {
      const req = new Request("http://localhost/nope");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      const body = await res.json<Record<string, unknown>>();
      expect(body).toEqual({ error: expect.any(String) });
    });

    it("SVG response is a standalone SVG document", async () => {
      const req = new Request("http://localhost/api/view-counter?username=xml-test");
      const ctx = createExecutionContext();
      const res = await app.fetch(req, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      const text = await res.text();
      expect(text).toContain("<svg");
      expect(text).toContain("</svg>");
      expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
  });
});
