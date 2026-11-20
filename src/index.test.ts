import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "./index";

const testEnv: Env = env;

afterEach(() => {
  vi.restoreAllMocks();
});

/** Sends one request through the whole app and waits for its background work. */
async function fetchApp(path: string, method = "GET"): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await app.fetch(new Request(`http://localhost${path}`, { method }), testEnv, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

/** Stored views for an exact username key, or `undefined` when no row exists. */
async function viewsOf(username: string): Promise<number | undefined> {
  const row = await testEnv.DB.prepare("SELECT views FROM view_counts WHERE username = ?")
    .bind(username)
    .first<{ views: number }>();
  return row?.views;
}

/** Sum of all stored views. */
async function totalViews(): Promise<number> {
  const row = await testEnv.DB.prepare(
    "SELECT COALESCE(SUM(views), 0) AS total FROM view_counts",
  ).first<{ total: number }>();
  return row?.total ?? Number.NaN;
}

describe("Integration Tests (Hono + D1)", () => {
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
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
  });

  describe("GET /api/view-counter", () => {
    it("counts every view and shows the new count", async () => {
      const first = await fetchApp("/api/view-counter?username=every-view");
      const second = await fetchApp("/api/view-counter?username=every-view");

      expect(first.status).toBe(200);
      expect(await first.text()).toContain("<title>Profile visitors: 1</title>");
      expect(await second.text()).toContain("<title>Profile visitors: 2</title>");
      expect(await viewsOf("every-view")).toBe(2);
    });

    it("tells caches and GitHub's image proxy not to store the badge", async () => {
      const res = await fetchApp("/api/view-counter?username=no-store");

      expect(res.headers.get("Cache-Control")).toBe(
        "max-age=0, no-cache, no-store, must-revalidate",
      );
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("treats usernames case-insensitively, like GitHub", async () => {
      await fetchApp("/api/view-counter?username=MixedCase");
      await fetchApp("/api/view-counter?username=mixedcase");
      const res = await fetchApp("/api/view-counter?username=MIXEDCASE");

      expect(await res.text()).toContain("<title>Profile visitors: 3</title>");
      expect(await viewsOf("mixedcase")).toBe(3);
      expect(await viewsOf("MixedCase")).toBeUndefined();
    });

    it("answers HEAD with the badge headers without counting a view", async () => {
      const res = await fetchApp("/api/view-counter?username=head-check", "HEAD");

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
      expect(await res.text()).toBe("");
      expect(await viewsOf("head-check")).toBeUndefined();
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

    it.each([
      ["", "Username is required"],
      ["?username=", "Username is required"],
      [
        "?username=-starts-with-dash",
        "Username must be alphanumeric with hyphens, starting and ending with a letter or number",
      ],
      [`?username=${"a".repeat(40)}`, "Username must be 1-39 characters"],
    ])("rejects %j with 400 { error } and counts nothing", async (query, error) => {
      const before = await totalViews();
      const res = await fetchApp(`/api/view-counter${query}`);

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error });
      expect(await totalViews()).toBe(before);
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
    it("returns Access-Control-Allow-Origin on API endpoints", async () => {
      const req = new Request("http://localhost/health");
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

    it("SVG response is valid XML", async () => {
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
