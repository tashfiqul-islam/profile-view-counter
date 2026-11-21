/**
 * Builds the README art in light and dark pairs: the cover (`assets/cover-*.svg`) and the request
 * path diagram (`assets/architecture-*.svg`). The style follows mdxcn figures: a dashed frame with
 * `+` corners and a `[ TITLE ]` on its top edge, monospace labels, one accent colour. The cover
 * shows real badges from the generator, so it changes when the badge does. Run
 * `bun run readme:art` after changing a theme, the badge layout or this file.
 *
 * @module
 */

import { type BadgeOptions, generateModernBadge } from "../src/badge/generator";
import { place } from "./badge-gallery";

/** Colour mode of a GitHub page. */
export type Mode = "light" | "dark";

/** Colours of one mode, matched to GitHub's light and dark Primer palettes. */
interface Ink {
  readonly bg: string;
  readonly dots: string;
  readonly frame: string;
  readonly corner: string;
  readonly ink: string;
  readonly muted: string;
  readonly accent: string;
  readonly node: string;
}

const INKS: Readonly<Record<Mode, Ink>> = {
  dark: {
    accent: "#58a6ff",
    bg: "#0d1117",
    corner: "#6e7681",
    dots: "#21262d",
    frame: "#30363d",
    ink: "#e6edf3",
    muted: "#9198a1",
    node: "#161b22",
  },
  light: {
    accent: "#0969da",
    bg: "#ffffff",
    corner: "#8c959f",
    dots: "#d8dee4",
    frame: "#d0d7de",
    ink: "#1f2328",
    muted: "#59636e",
    node: "#f6f8fa",
  },
};

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const MONO_ADVANCE = 0.6;

/** A frame's `[ TITLE ]` label and the corner `+` marks, in mdxcn's shape. */
function frame(
  ink: Ink,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
): string {
  const label = `[ ${title} ]`;
  const labelWidth = label.length * (13 * MONO_ADVANCE + 1.5) + 16;
  const corners = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
  ]
    .map(
      ([cx = 0, cy = 0]) =>
        `<path d="M${cx - 6} ${cy}h12M${cx} ${cy - 6}v12" stroke="${ink.corner}" stroke-width="1.5"/>`,
    )
    .join("");
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${ink.frame}" stroke-dasharray="6 6"/>`,
    corners,
    `<rect x="${x + 36}" y="${y - 13}" width="${labelWidth}" height="26" fill="${ink.bg}"/>`,
    `<text x="${x + 44}" y="${y + 5}" font-family="${MONO}" font-size="13" letter-spacing="1.5" fill="${ink.muted}">${label}</text>`,
  ].join("");
}

/** The SVG shell: background, dot grid, accessible title. */
function sheet(ink: Ink, width: number, height: number, title: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
<title>${title}</title>
<defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${ink.dots}"/></pattern></defs>
<rect width="${width}" height="${height}" fill="${ink.bg}"/>
<rect width="${width}" height="${height}" fill="url(#dots)"/>
${body}
</svg>
`;
}

/** Badges on the cover: count, styling, position. */
const COVER_BADGES: readonly { count: number; options: BadgeOptions; x: number }[] = [
  { count: 1_234_567, options: { theme: "aurora" }, x: 802 },
  { count: 32_700, options: {}, x: 762 },
  { count: 7, options: { theme: "paper" }, x: 822 },
  { count: 999, options: { theme: "contribution" }, x: 782 },
  { count: 4800, options: { color: "e11d48", labelColor: "0f172a" }, x: 812 },
];

/**
 * Renders the README cover.
 *
 * @param mode - GitHub colour mode the image is for.
 * @returns A standalone 1280 × 560 SVG document.
 */
export function coverSvg(mode: Mode): string {
  const ink = INKS[mode];
  const badges = COVER_BADGES.map(({ count, options, x }, i) =>
    place(generateModernBadge(count, options), x, 120 + i * 72, `${mode}${i}`, 1.5),
  ).join("");
  const body = [
    frame(ink, 40, 40, 1200, 480, "PROFILE VIEW COUNTER"),
    `<text x="96" y="152" font-family="${MONO}" font-size="13" letter-spacing="2" fill="${ink.accent}">CLOUDFLARE WORKER · SVG BADGE · GITHUB README</text>`,
    `<text x="92" y="238" font-family="${SANS}" font-size="72" font-weight="800" letter-spacing="-2" fill="${ink.ink}">Every view,</text>`,
    `<text x="92" y="318" font-family="${SANS}" font-size="72" font-weight="800" letter-spacing="-2" fill="${ink.accent}">counted.</text>`,
    `<text x="96" y="378" font-family="${SANS}" font-size="22" fill="${ink.muted}">A profile view counter for GitHub READMEs.</text>`,
    `<text x="96" y="410" font-family="${SANS}" font-size="22" fill="${ink.muted}">Six themes, your own colours, crisp at any size.</text>`,
    `<text x="96" y="468" font-family="${MONO}" font-size="13" letter-spacing="1" fill="${ink.muted}">28 px pill  ·  text pinned to fit  ·  100 % tested  ·  every view counts</text>`,
    badges,
  ].join("\n");
  return sheet(ink, 1280, 560, "Profile View Counter: every view, counted", body);
}

/** One box on the request path, with a monospace name and an annotation under it. */
function node(ink: Ink, x: number, y: number, width: number, name: string, note: string): string {
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="72" fill="${ink.node}" stroke="${ink.frame}"/>`,
    `<text x="${x + width / 2}" y="${y + 32}" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="600" fill="${ink.ink}">${name}</text>`,
    `<text x="${x + width / 2}" y="${y + 54}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${ink.muted}">${note}</text>`,
  ].join("");
}

/** An accent arrow between two points, with an optional label above it. */
function arrow(ink: Ink, d: string, label = "", lx = 0, ly = 0, both = false): string {
  const markers = `marker-end="url(#head)"${both ? ' marker-start="url(#head)"' : ""}`;
  const text = label
    ? `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${ink.muted}">${label}</text>`
    : "";
  return `<path d="${d}" fill="none" stroke="${ink.accent}" stroke-width="1.5" ${markers}/>${text}`;
}

/**
 * Renders the request path diagram: README, GitHub's image proxy, the Worker's three steps, D1.
 *
 * @param mode - GitHub colour mode the image is for.
 * @returns A standalone 1280 × 480 SVG document.
 */
export function architectureSvg(mode: Mode): string {
  const ink = INKS[mode];
  const head = `<defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${ink.accent}"/></marker></defs>`;
  const body = [
    head,
    frame(ink, 40, 40, 1200, 400, "REQUEST PATH"),
    node(ink, 84, 168, 156, "readme", "your profile page"),
    node(ink, 316, 168, 156, "github camo", "image proxy"),
    frame(ink, 600, 116, 600, 176, "CLOUDFLARE WORKER"),
    node(ink, 632, 168, 160, "validate", "valibot · lowercase"),
    node(ink, 820, 168, 160, "count", "insert … returning"),
    node(ink, 1008, 168, 160, "render", "pure svg · themes"),
    `<rect x="810" y="336" width="180" height="60" fill="${ink.node}" stroke="${ink.frame}"/>`,
    `<text x="900" y="362" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="600" fill="${ink.ink}">d1</text>`,
    `<text x="900" y="382" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${ink.muted}">view_counts</text>`,
    arrow(ink, "M242 204H314", "img", 278, 196, true),
    arrow(ink, "M474 204H630", "GET ?username=", 536, 194, true),
    `<text x="536" y="226" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${ink.muted}">svg · no-store</text>`,
    arrow(ink, "M794 204H818"),
    arrow(ink, "M982 204H1006"),
    arrow(ink, "M900 242V334", "", 0, 0, true),
    `<text x="96" y="412" font-family="${MONO}" font-size="12" fill="${ink.muted}">every GET counts · HEAD answers without counting · styling never changes the count</text>`,
  ].join("\n");
  return sheet(ink, 1280, 480, "Request path: README, GitHub image proxy, Worker, D1", body);
}

/** Every file this script writes, with its contents. */
export function readmeArt(): Readonly<Record<string, string>> {
  return {
    "assets/architecture-dark.svg": architectureSvg("dark"),
    "assets/architecture-light.svg": architectureSvg("light"),
    "assets/cover-dark.svg": coverSvg("dark"),
    "assets/cover-light.svg": coverSvg("light"),
  };
}

/**
 * Writes every README art file.
 *
 * @param write - File writer; defaults to `Bun.write`.
 * @returns Resolves once every file is written.
 */
export async function writeReadmeArt(
  write: (path: string, data: string) => Promise<unknown> = Bun.write,
): Promise<void> {
  await Promise.all(Object.entries(readmeArt()).map(([path, svg]) => write(path, svg)));
}

if (import.meta.main) await writeReadmeArt();
