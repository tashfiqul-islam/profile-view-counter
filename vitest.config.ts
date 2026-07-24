import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
  test: {
    coverage: {
      exclude: ["src/badge/**", "**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      thresholds: {
        100: true,
      },
    },
    globals: true,
    hookTimeout: 10_000,
    include: ["test/integration.test.ts"],
    retry: 1,
    testTimeout: 10_000,
  },
});
