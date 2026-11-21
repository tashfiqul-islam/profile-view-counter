import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Each test file gets isolated storage; give it the same schema production has.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
