import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
    }),
  ],
  test: {
    globals: true,
    include: ['test/integration.test.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        100: true,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/badge/**', '**/*.d.ts'],
    },
  },
})
