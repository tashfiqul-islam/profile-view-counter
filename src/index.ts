import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { viewCounterRoute } from "./routes/view-counter";

interface Variables {
  readonly requestId: string;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", requestId());
app.use("*", logger());
app.use("*", timing());
app.use("*", cors({ allowMethods: ["GET", "HEAD"] }));
app.use(
  "*",
  secureHeaders({
    permissionsPolicy: {
      camera: false,
      fullscreen: false,
      geolocation: false,
      microphone: false,
    },
    referrerPolicy: "no-referrer",
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    xFrameOptions: "DENY",
    xXssProtection: "0",
  })
);

app.get("/favicon.ico", (c) =>
  c.body(null, 204, { "X-Content-Type-Options": "nosniff" })
);

app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

app.get("/", (c) =>
  c.json({
    documentation: "https://github.com/tashfiqul-islam/profile-view-counter",
    endpoints: {
      health: "/health",
      view_counter: "/api/view-counter?username=:username",
    },
    message: "Profile View Counter API is running 🚀",
  })
);

app.route("/api", viewCounterRoute);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((err, c) => {
  console.error(
    JSON.stringify({
      error: {
        message: err.message,
        name: err.name,
        stack: err.stack,
      },
      level: "error",
      request: {
        method: c.req.method,
        path: c.req.path,
      },
      requestId: c.get("requestId"),
    })
  );
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
