import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    /** Bindings that exist only under Vitest (see vitest.config.ts). */
    interface Env {
      /** Migrations read from ./migrations, applied by src/test-setup.ts. */
      readonly TEST_MIGRATIONS: D1Migration[];
    }
  }
}
