# Badge

Read when: changing how the badge looks, its size, colours, themes, label, typography or number
format.

## Rules

- `src/badge/generator.ts` is pure: a count and options in, an SVG string out. Keep bindings and
  I/O out of it.
- **Themes**: `THEMES` holds one `Palette` per name in `THEME_NAMES`; `graphite` is the default.
  `?color=` / `?label_color=` override a theme's backgrounds through `resolvePalette()`, and
  `readableText()` picks white or ink text by WCAG contrast. Theme names and hex rules are
  validated in `src/schemas/query.ts`; the route passes only validated values through.
- **New theme**: add the name to `THEME_NAMES`, its palette to `THEMES` and a note to
  `scripts/badge-gallery.ts`, run `bun run badge:gallery`, then update the lists in `README.md` and
  `docs/API.md`.
- **Size**: a 28 px pill (the shields `for-the-badge` height), `width`/`height` equal to the
  `viewBox`, radius 14. It scales as a vector; 2× pixel sizing is unnecessary.
- **Text fit**: layout widths come from `textWidth()` (Arial Bold advances plus tracking), and each
  `<text>` carries `textLength` with `lengthAdjust="spacing"`, so whatever font the viewer has,
  text fills exactly its slot and stays centred. When you change a font size, tracking, label or
  padding, keep `textWidth()`, the layout and the tests in step.
- **Layout**: GitHub mark (14 px) and label on the left segment, count centred in the right segment,
  11 px padding, minimum count segment 36 px; the badge widens only as the count needs.
- **Numbers**: `formatNumber()` is `Intl` compact notation with one decimal (`999`, `1.2K`, `1M`,
  `1.5B`, `1T`).
- **Self-contained**: system font stack, no filters, no `<image>`, no external references, no ids
  that must be unique across documents (GitHub's image proxy strips `@import` and renderers differ
  on filters).
- **Accessible**: `role="img"`, `aria-label` and `<title>` read "Profile visitors: <count>"; the
  icon is `aria-hidden`.
- **Safety**: every dynamic value passes through `escapeXml()`.
- **Look before shipping**: render the changed badge to PNG at several counts (for example
  `0`, `999`, `32.7K`, `1.2M`, `1.5B`) on light `#ffffff` and dark `#0d1117` backgrounds, and in a
  wide (Verdana) and a serif font, then view the images. When the design changes, regenerate
  `assets/badge-32.7k.svg` with `generateModernBadge(32_700)`, the gallery with
  `bun run badge:gallery` and the README art with `bun run readme:art`.

## Enforced by

- `src/badge/generator.test.ts`: 1:1 sizing, pinned text widths, centring, growth with the count,
  screen-reader name, no external references, no `NaN`.
