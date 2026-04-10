# Contributing

Thanks for your interest in contributing to **Profile View Counter**!

## Getting Started

```bash
git clone https://github.com/tashfiqul-islam/profile-view-counter.git
cd profile-view-counter
bun install
```

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make changes** and verify:
   ```bash
   bun run cf-typegen    # Regenerate types after wrangler.jsonc changes
   bun run check         # Lint + format check
   bun run typecheck     # TypeScript strict mode
   bun run test          # Unit + integration tests (100% coverage required)
   ```

3. **Auto-fix** formatting issues:
   ```bash
   bun run fix
   ```

4. **Commit** using conventional commits:
   ```bash
   bun run commit
   ```

5. **Push** and open a PR against `main`.

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/). Enforced by commitlint via lefthook pre-commit hook.

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI/CD changes |
| `chore` | Maintenance tasks |
| `revert` | Reverting a previous commit |
| `types` | Type definition changes |
| `security` | Security fixes or hardening |

**Format:** `<type>(<optional scope>): <description>`

**Examples:**
```
feat(badge): add dark mode theme
fix(cache): handle KV timeout gracefully
docs: update API reference
```

## Code Standards

- **TypeScript 6** strict mode with `erasableSyntaxOnly`
- **Double quotes, semicolons** (Ultracite / Biome)
- **Readonly interfaces**, `as const satisfies Type` for config objects
- **100% test coverage** across all metrics
- **No `.js` files** in the project

## Testing

Two test runners, split by runtime:

- **`bun:test`** for pure functions (no Workers runtime dependency)
- **Vitest + `@cloudflare/vitest-pool-workers`** for integration tests against workerd

```bash
bun run test:unit         # Badge generator (bun:test)
bun run test:integration  # Hono + D1 + KV (vitest + workerd)
bun run test              # Both
```

## Git Hooks (Lefthook)

| Hook | What it does |
|------|-------------|
| **pre-commit** | Format, typecheck, fast unit tests |
| **commit-msg** | Commitlint validation |
| **pre-push** | Full typecheck + all tests + lint check |
| **post-merge** | Auto-install if lockfile changed |

## Release Process

Releases are fully automated via [semantic-release](https://semantic-release.gitbook.io/). When a PR merges to `main`:

1. Commits are analyzed for version bump (major/minor/patch)
2. `CHANGELOG.md` is updated
3. `package.json` version is bumped
4. GitHub release is created with SLSA provenance
5. Worker is deployed to Cloudflare

**You do not need to manually version or tag.**

## Reporting Issues

Open an issue at [github.com/tashfiqul-islam/profile-view-counter/issues](https://github.com/tashfiqul-islam/profile-view-counter/issues).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
