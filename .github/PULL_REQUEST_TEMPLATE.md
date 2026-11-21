## Why

<!-- The problem or goal, in a sentence or two. -->

## What changed

<!-- The behaviour a reviewer should check. -->

## Checklist

- [ ] Title is `type(scope): subject`; it becomes the squash commit that decides the release
- [ ] `bun run check` is green (types, lint, format, 100 % coverage)
- [ ] Docs updated where behaviour, routes or contracts changed (`docs/API.md`, `src/README.md`)
- [ ] New migrations are additive (`migrations/000N_*.sql`), never edits to applied ones

Closes #
