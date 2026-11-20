import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// The real migrations, applied to each test file's isolated D1 by src/test-setup.ts.
const migrations = await readD1Migrations("./migrations");

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      wrangler: { configPath: "./wrangler.jsonc" },
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
