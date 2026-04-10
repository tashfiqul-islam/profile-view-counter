import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { generateModernBadge } from "../badge/generator";
import { querySchema } from "../schemas/query";
import { getCachedBadge, setCachedBadge } from "../services/cache";
import { incrementViewCount } from "../services/counter";

interface SvgHeaders {
  readonly "Content-Type": string;
  readonly "X-Content-Type-Options": string;
}

const CACHE_TTL_SECONDS = 60;

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml",
  "X-Content-Type-Options": "nosniff",
} as const satisfies SvgHeaders;

export const viewCounterRoute = new Hono<{ Bindings: Env }>();

viewCounterRoute.get(
  "/view-counter",
  vValidator("query", querySchema),
  async (c) => {
    const { username } = c.req.valid("query");
    const cacheKey = `badge:${username}`;

    const cached = await getCachedBadge(c.env.CACHE, cacheKey);
    if (cached !== null) {
      return c.body(cached, 200, {
        ...SVG_HEADERS,
        "Cache-Control": "public, max-age=60",
        "X-Cache": "HIT",
      });
    }

    const count = await incrementViewCount(c.env.DB, username);
    const svg = generateModernBadge(count);

    c.executionCtx.waitUntil(
      setCachedBadge(c.env.CACHE, cacheKey, svg, CACHE_TTL_SECONDS).catch(
        (err: unknown) =>
          console.error(
            JSON.stringify({
              error: "cache-write-failed",
              message: String(err),
            })
          )
      )
    );

    return c.body(svg, 200, {
      ...SVG_HEADERS,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Cache": "MISS",
    });
  }
);
