/**
 * Builds `assets/badge-themes.svg`, the README's theme gallery: every built-in theme and two
 * custom-colour examples, each on GitHub's light and dark backgrounds, with the query that
 * produces it. Run `bun scripts/badge-gallery.ts` after changing a theme or the badge layout.
 *
 * @module
 */

import {
  type BadgeOptions,
  generateModernBadge,
  THEME_NAMES,
  type ThemeName,
} from "../src/badge/generator";

/** One gallery row. */
export interface GalleryRow {
  /** Row title. */
  readonly title: string;
  /** One-line description. */
  readonly note: string;
  /** Query string that produces this look, after `username=…`. */
  readonly query: string;
  /** Options passed to the generator. */
  readonly options: BadgeOptions;
}

const NOTES: Readonly<Record<ThemeName, string>> = {
  adaptive: "light label when the viewer prefers light",
  aurora: "near-black + blue→violet gradient",
  contribution: "GitHub ink + contribution green",
  graphite: "default · GitHub ink + GitHub blue",
  mono: "one graphite tone, divider, blue count",
  paper: "white label, hairline edge, blue count",
};

/** The rows the gallery shows, in order. */
export const GALLERY_ROWS: readonly GalleryRow[] = [
  ...THEME_NAMES.map((theme) => ({
    note: NOTES[theme],
    options: { theme },
    query: theme === "graphite" ? "" : `&theme=${theme}`,
    title: theme,
  })),
  {
    note: "any hex for count and label; text colour picked by contrast",
    options: { color: "e11d48", labelColor: "0f172a" },
    query: "&color=e11d48&label_color=0f172a",
    title: "custom",
  },
  {
    note: "a pale colour gets dark text automatically",
    options: { color: "fde047" },
    query: "&color=fde047",
    title: "custom",
  },
];

const COUNTS = [7, 32_700, 1_234_567] as const;
const PAD = 24;
const HALF = 330;
const ROW = 130;

/** Rounds to 0.1 px, as the badge generator does, so no float noise reaches the SVG. */
const round = (value: number): number => Math.round(value * 10) / 10;

/** Width attribute of an SVG document. */
const widthOf = (svg: string): number => Number(/width="([\d.]+)"/.exec(svg)?.[1]);

/**
 * Places a badge inside a larger SVG, renaming its ids so nested badges cannot share gradients.
 *
 * @param svg - A badge from `generateModernBadge()`.
 * @param x - Left edge in the host SVG.
 * @param y - Top edge in the host SVG.
 * @param id - Suffix that makes this copy's ids unique.
 * @param scale - Size multiplier; 1 keeps the badge at 28 px.
 * @returns A nested `<svg>` element.
 */
export function place(svg: string, x: number, y: number, id: string, scale = 1): string {
  const own = svg
    .replaceAll("pvc-sheen", `pvc-sheen-${id}`)
    .replaceAll("pvc-accent", `pvc-accent-${id}`);
  const open = own.slice(0, own.indexOf(">"));
  const body = own.slice(own.indexOf(">") + 1, own.lastIndexOf("</svg>"));
  return `<svg x="${x}" y="${y}" width="${round(widthOf(own) * scale)}" height="${28 * scale}" ${open.slice(open.indexOf("viewBox"))}>${body}</svg>`;
}

/**
 * Renders the gallery sheet.
 *
 * @param rows - Rows to show; defaults to {@link GALLERY_ROWS}.
 * @returns A standalone SVG document.
 */
export function gallerySvg(rows: readonly GalleryRow[] = GALLERY_ROWS): string {
  const parts: string[] = [];
  let y = 8;
  for (const [index, row] of rows.entries()) {
    const query = row.query.replaceAll("&", "&amp;") || "(no parameters)";
    parts.push(
      `<text x="${PAD}" y="${y + 20}" font-size="14" font-weight="700" fill="#1f2328">${row.title}</text>`,
      `<text x="${PAD + 110}" y="${y + 20}" font-size="12" fill="#59636e">${row.note}</text>`,
      `<text x="${PAD + 2 * HALF - 12}" y="${y + 20}" font-size="11" text-anchor="end" fill="#59636e" font-family="ui-monospace, Consolas, monospace">${query}</text>`,
      `<rect x="${PAD}" y="${y + 30}" width="${HALF - 8}" height="48" rx="10" fill="#ffffff" stroke="#d0d7de"/>`,
      `<rect x="${PAD + HALF}" y="${y + 30}" width="${HALF - 8}" height="48" rx="10" fill="#0d1117" stroke="#30363d"/>`,
    );
    const sample = generateModernBadge(32_700, row.options);
    parts.push(
      place(sample, PAD + 14, y + 40, `${index}l`),
      place(sample, PAD + HALF + 14, y + 40, `${index}d`),
    );
    let x = PAD;
    for (const count of COUNTS) {
      const badge = generateModernBadge(count, row.options);
      parts.push(place(badge, x, y + 88, `${index}c${count}`));
      x = round(x + widthOf(badge) + 12);
    }
    y += ROW;
  }
  const width = PAD * 2 + 2 * HALF - 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}" role="img" aria-label="Badge themes" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"><rect width="100%" height="100%" fill="#f6f8fa"/>${parts.join("")}</svg>\n`;
}

if (import.meta.main) await Bun.write("assets/badge-themes.svg", gallerySvg());
