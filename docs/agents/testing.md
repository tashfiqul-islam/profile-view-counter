# Testing

Read when: writing or changing tests, fixing a bug, chasing a flaky run, or touching a test runner
or coverage setting.

## Rules

- Two runners, split by runtime, chosen by configuration:
  - `src/**/*.test.ts` run in **workerd** on Vitest with `@cloudflare/vitest-plugin`
    (`bun run test:worker`). Import helpers from `cloudflare:test`, `env` from `cloudflare:workers`,
    test APIs from `vitest`.
  - `scripts/**/*.test.ts` run on `bun test` (`bun run test:scripts`), importing from `bun:test`.
- Coverage is 100 % and stays there: Vitest enforces statements, branches, functions and lines over
  all of `src/` (istanbul); Bun enforces lines, functions and statements over `scripts/` only (plural `coverageThreshold`
  keys; Bun ignores singular ones and measures no branches). A change
  that drops coverage is unfinished: add the test through the module's interface.
- Tests sit next to their module. `src/index.test.ts` drives the whole app through `app.fetch()`
  with `createExecutionContext()` / `waitOnExecutionContext()`; `fetchApp()`, `viewsOf()` and
  `totalViews()` there are the shared helpers.
- Each test file gets an isolated D1 with the real `migrations/` applied by `src/test-setup.ts`.
  Rows persist across tests within a file and order is shuffled, so assert on your own username or
  on before/after deltas.
- Mock only at a seam with `vi.spyOn()` (`env.DB`, a statement prototype, `console`); the
  `afterEach` in `src/index.test.ts` restores every spy.
- Assert behaviour with independent expected values: exact bodies, exact headers, exact rows. A
  test that restates the implementation, or cannot fail, is a defect.
- Determinism: Vitest shuffles (`sequence.shuffle`), Bun randomizes; neither pins a seed. No
  retries, no sleeps, no network.
- Bugs: reproduce the failure as a test first (it goes red on the bug), then fix; the red test stays
  as the regression test.
- A migration gets its own test that rebuilds the earlier schema, seeds rows and applies the new
  file (see `src/migrations.test.ts`).

## Enforced by

- `vitest.config.ts` (`thresholds: { 100: true }`, `include`, `setupFiles`) and `bunfig.toml`
  (`[test] root = "scripts"`, `coverageThreshold`).
- oxlint's `vitest` plugin with `vitest/no-conditional-expect`: every `expect` runs on every path.
