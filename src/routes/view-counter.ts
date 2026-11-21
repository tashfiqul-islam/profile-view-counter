import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { generateModernBadge } from "../badge/generator";
import { querySchema } from "../schemas/query";
import { incrementViewCount } from "../services/counter";

interface SvgHeaders {
  readonly "Cache-Control": string;
  readonly "Content-Security-Policy": string;
  readonly "Content-Type": string;
  readonly "X-Content-Type-Options": string;
}

const SVG_HEADERS = {
  // Every README view must reach the Worker to be counted, so neither GitHub's image proxy nor
  // any other cache may keep the badge.
  "Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  "Content-Type": "image/svg+xml",
  "X-Content-Type-Options": "nosniff",
} as const satisfies SvgHeaders;

/**
 * `GET /view-counter` (mounted under `/api`): counts one view per `GET` and returns the badge in the
 * requested theme or colours, plus any `base` carried over from another counter; `HEAD` gets the same headers without counting.
 */
export const viewCounterRoute = new Hono<{ Bindings: Env }>();

viewCounterRoute.get(
  "/view-counter",
  vValidator("query", querySchema, (result, c) => {
    if (!result.success) return c.json({ error: result.issues[0].message }, 400);
    return undefined;
  }),
  async (c) => {
    // HEAD comes from link checkers and crawlers, not readers: answer it without counting.
    if (c.req.method === "HEAD") return c.body(null, 200, SVG_HEADERS);

    const { base = 0, color, label_color: labelColor, theme, username } = c.req.valid("query");
    const views = await incrementViewCount(c.env.DB, username);
    // The badge shows views carried over from another counter; the database keeps only real ones.
    const svg = generateModernBadge(views + base, { color, labelColor, theme });
    return c.body(svg, 200, SVG_HEADERS);
  },
);
