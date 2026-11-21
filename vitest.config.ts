import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** A path next to this file, so the config works from any working directory. */
const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// The real migrations, applied to each test file's isolated D1 by src/test-setup.ts.
const migrations = await readD1Migrations(here("./migrations"));

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      wrangler: { configPath: here("./wrangler.jsonc") },
    }),
  ],
  test: {
    coverage: {
      exclude: ["src/**/*.test.ts", "src/test-setup.ts", "src/**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "istanbul",
      reporter: ["text"],
      thresholds: { 100: true },
    },
    include: ["src/**/*.test.ts"],
    sequence: { shuffle: true },
    setupFiles: ["./src/test-setup.ts"],
  },
});
