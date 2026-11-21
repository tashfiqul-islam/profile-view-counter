/**
 * Builds the README art in light and dark pairs: the cover (`assets/cover-*.svg`), the request path
 * diagram (`assets/architecture-*.svg`) and the sample badge (`assets/badge-32.7k.svg`). The style
 * follows mdxcn figures: dashed frames with `+` corners and a `[ TITLE ]` on the top edge,
 * monospace labels, tabular numbers and one accent colour per GitHub mode. The cover shows real
 * badges from the generator, so it changes when the badge does. Run `bun run readme:art` after
 * changing a theme, the badge layout or this file.
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
  readonly faint: string;
  readonly accent: string;
  readonly node: string;
  readonly glow: number;
}

const INKS: Readonly<Record<Mode, Ink>> = {
  dark: {
    accent: "#58a6ff",
    bg: "#0d1117",
    corner: "#6e7681",
    dots: "#1f242c",
    faint: "#6e7681",
    frame: "#30363d",
    glow: 0.16,
    ink: "#f0f6fc",
    muted: "#9198a1",
    node: "#151b23",
  },
  light: {
    accent: "#0969da",
    bg: "#ffffff",
    corner: "#8c959f",
    dots: "#dfe4ea",
    faint: "#8c959f",
    frame: "#d0d7de",
    glow: 0.1,
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

const round = (value: number): number => Math.round(value * 10) / 10;

/** Width a `[ LABEL ]` takes on a frame edge, in px, with breathing room on both sides. */
const labelWidth = (label: string): number => label.length * (13 * MONO_ADVANCE + 1.5) + 16;

/** One text run in the art. */
interface Text {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly fill: string;
  readonly size: number;
  readonly font?: "sans" | "mono";
  readonly weight?: number;
  readonly anchor?: "start" | "middle" | "end";
  readonly tracking?: number;
}

/** Renders one `<text>` element. */
function text(t: Text): string {
  const family = t.font === "sans" ? SANS : MONO;
  const attrs = [
    `x="${t.x}"`,
    `y="${t.y}"`,
    `font-family="${family}"`,
    `font-size="${t.size}"`,
    t.weight === undefined ? "" : `font-weight="${t.weight}"`,
    t.anchor === undefined || t.anchor === "start" ? "" : `text-anchor="${t.anchor}"`,
    t.tracking === undefined ? "" : `letter-spacing="${t.tracking}"`,
    `fill="${t.fill}"`,
  ].filter(Boolean);
  return `<text ${attrs.join(" ")}>${t.text}</text>`;
}

/** A dashed mdxcn frame: corner `+` marks, a `[ TITLE ]` on the left of the top edge, optional note on the right. */
interface Frame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly note?: string;
}

/** Renders a frame. */
function frame(ink: Ink, f: Frame): string {
  const title = `[ ${f.title} ]`;
  const note = f.note === undefined ? undefined : `[ ${f.note} ]`;
  const right = f.x + f.width;
  const bottom = f.y + f.height;
  // The top edge breaks around each label instead of painting a background behind it, so the
  // glow and dot grid show through.
  const gaps: [number, number][] = [[f.x + 36, f.x + 36 + labelWidth(title)]];
  if (note !== undefined) gaps.push([right - 36 - labelWidth(note), right - 36]);
  let top = `M${f.x} ${f.y}`;
  for (const [from, to] of gaps) top += `H${round(from)}M${round(to)} ${f.y}`;
  const edges = `${top}H${right}V${bottom}H${f.x}V${f.y}`;
  const parts = [
    `<path d="${edges}" fill="none" stroke="${ink.frame}" stroke-dasharray="6 6"/>`,
    ...[
      [f.x, f.y],
      [right, f.y],
      [f.x, bottom],
      [right, bottom],
    ].map(
      ([cx = 0, cy = 0]) =>
        `<path d="M${cx - 6} ${cy}h12M${cx} ${cy - 6}v12" stroke="${ink.corner}" stroke-width="1.5"/>`,
    ),
    text({ fill: ink.muted, size: 13, text: title, tracking: 1.5, x: f.x + 44, y: f.y + 5 }),
  ];
  if (note !== undefined) {
    parts.push(
      text({
        anchor: "end",
        fill: ink.faint,
        size: 13,
        text: note,
        tracking: 1.5,
        x: right - 44,
        y: f.y + 5,
      }),
    );
  }
  return parts.join("");
}

/** The SVG shell: background, dot grid, an accent glow, accessible title. */
function sheet(
  ink: Ink,
  size: { readonly width: number; readonly height: number },
  glow: { readonly cx: number; readonly cy: number; readonly r: number },
  title: string,
  body: string,
): string {
  const { width, height } = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
<title>${title}</title>
<defs>
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${ink.dots}"/></pattern>
<radialGradient id="glow"><stop offset="0" stop-color="${ink.accent}" stop-opacity="${ink.glow}"/><stop offset="1" stop-color="${ink.accent}" stop-opacity="0"/></radialGradient>
<marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${ink.accent}"/></marker>
</defs>
<rect width="${width}" height="${height}" fill="${ink.bg}"/>
<rect width="${width}" height="${height}" fill="url(#dots)"/>
<circle cx="${glow.cx}" cy="${glow.cy}" r="${glow.r}" fill="url(#glow)"/>
${body}
</svg>
`;
}

/** Badges in the cover's `[ THEMES ]` panel: count, styling, name shown beside it. */
const COVER_BADGES: readonly { count: number; options: BadgeOptions; name: string }[] = [
  { count: 32_700, name: "graphite", options: {} },
  { count: 1_234_567, name: "aurora", options: { theme: "aurora" } },
  { count: 999, name: "mono", options: { theme: "mono" } },
  { count: 7, name: "paper", options: { theme: "paper" } },
  { count: 128_000, name: "contribution", options: { theme: "contribution" } },
  { count: 4800, name: "#e11d48", options: { color: "e11d48", labelColor: "0f172a" } },
];

/** The cover's stat row: value and caption, mdxcn Stat style. */
const COVER_STATS: readonly [string, string][] = [
  ["28 px", "badge height"],
  ["6", "themes + any hex"],
  ["100 %", "test coverage"],
];

/**
 * Renders the README cover.
 *
 * @param mode - GitHub colour mode the image is for.
 * @returns A standalone 1280 × 600 SVG document.
 */
export function coverSvg(mode: Mode): string {
  const ink = INKS[mode];
  const badges = COVER_BADGES.flatMap(({ count, name, options }, i) => {
    const y = 132 + i * 60;
    return [
      place(generateModernBadge(count, options), 732, y, `${mode}${i}`, 1.25),
      text({ anchor: "end", fill: ink.muted, size: 13, text: name, x: 1156, y: y + 22 }),
    ];
  });
  const stats = COVER_STATS.flatMap(([value, caption], i) => {
    const x = 96 + i * 176;
    return [
      text({
        fill: ink.ink,
        font: "sans",
        size: 34,
        text: value,
        tracking: -0.5,
        weight: 700,
        x,
        y: 468,
      }),
      text({ fill: ink.muted, size: 12, text: caption, tracking: 0.5, x, y: 492 }),
    ];
  });
  const body = [
    frame(ink, {
      height: 520,
      note: "OPEN SOURCE · MIT",
      title: "PROFILE VIEW COUNTER",
      width: 1200,
      x: 40,
      y: 40,
    }),
    `<circle cx="101" cy="141" r="4" fill="${ink.accent}"/>`,
    text({
      fill: ink.accent,
      size: 13,
      text: "EVERY README VIEW, ON THE EDGE",
      tracking: 2,
      x: 114,
      y: 146,
    }),
    text({
      fill: ink.ink,
      font: "sans",
      size: 76,
      text: "Every view,",
      tracking: -2.5,
      weight: 800,
      x: 92,
      y: 232,
    }),
    text({
      fill: ink.accent,
      font: "sans",
      size: 76,
      text: "counted.",
      tracking: -2.5,
      weight: 800,
      x: 92,
      y: 316,
    }),
    text({
      fill: ink.muted,
      font: "sans",
      size: 21,
      text: "A profile view counter badge for GitHub READMEs.",
      x: 96,
      y: 370,
    }),
    text({
      fill: ink.muted,
      font: "sans",
      size: 21,
      text: "Crisp at any size, in any theme or colour.",
      x: 96,
      y: 400,
    }),
    `<path d="M96 428h512" stroke="${ink.frame}"/>`,
    ...stats,
    frame(ink, { height: 408, title: "THEMES", width: 488, x: 700, y: 96 }),
    ...badges,
  ].join("\n");
  return sheet(
    ink,
    { height: 600, width: 1280 },
    { cx: 944, cy: 300, r: 420 },
    "Profile View Counter: every view, counted",
    body,
  );
}

/** One numbered box on the request path. */
interface Node {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly step: string;
  readonly name: string;
  readonly note: string;
}

/** Renders a node: index, monospace name, annotation. */
function node(ink: Ink, n: Node): string {
  const cx = n.x + n.width / 2;
  return [
    `<rect x="${n.x}" y="${n.y}" width="${n.width}" height="76" fill="${ink.node}" stroke="${ink.frame}"/>`,
    text({ fill: ink.accent, size: 11, text: n.step, tracking: 1, x: n.x + 10, y: n.y + 17 }),
    text({
      anchor: "middle",
      fill: ink.ink,
      size: 15,
      text: n.name,
      weight: 600,
      x: cx,
      y: n.y + 40,
    }),
    text({ anchor: "middle", fill: ink.muted, size: 11, text: n.note, x: cx, y: n.y + 60 }),
  ].join("");
}

/** An accent arrow along `d`, solid for the request or dashed for the response. */
interface Arrow {
  readonly d: string;
  readonly label?: string;
  readonly at?: readonly [number, number];
  readonly dashed?: boolean;
  readonly both?: boolean;
}

/** Renders an arrow with an optional label. */
function arrow(ink: Ink, a: Arrow): string {
  const dash = a.dashed === true ? ' stroke-dasharray="5 5"' : "";
  const start = a.both === true ? ' marker-start="url(#head)"' : "";
  const path = `<path d="${a.d}" fill="none" stroke="${ink.accent}" stroke-width="1.5"${dash} marker-end="url(#head)"${start}/>`;
  if (a.label === undefined || a.at === undefined) return path;
  const [x, y] = a.at;
  return path + text({ anchor: "middle", fill: ink.muted, size: 11, text: a.label, x, y });
}

/** D1 drawn as a database cylinder. */
function database(ink: Ink, cx: number, y: number): string {
  const rx = 70;
  return [
    `<path d="M${cx - rx} ${y + 10}v44a${rx} 10 0 0 0 ${rx * 2} 0v-44" fill="${ink.node}" stroke="${ink.frame}"/>`,
    `<ellipse cx="${cx}" cy="${y + 10}" rx="${rx}" ry="10" fill="${ink.node}" stroke="${ink.frame}"/>`,
    text({ anchor: "middle", fill: ink.ink, size: 15, text: "d1", weight: 600, x: cx, y: y + 42 }),
    text({ anchor: "middle", fill: ink.muted, size: 11, text: "view_counts", x: cx, y: y + 60 }),
  ].join("");
}

/**
 * Renders the request path diagram: README, GitHub's image proxy, the Worker's three steps, D1, and
 * the response lane back to the page.
 *
 * @param mode - GitHub colour mode the image is for.
 * @returns A standalone 1280 × 560 SVG document.
 */
export function architectureSvg(mode: Mode): string {
  const ink = INKS[mode];
  const body = [
    frame(ink, {
      height: 480,
      note: "ONE GET · ONE VIEW",
      title: "REQUEST PATH",
      width: 1200,
      x: 40,
      y: 40,
    }),
    frame(ink, { height: 184, title: "CLOUDFLARE WORKER", width: 600, x: 600, y: 112 }),
    node(ink, { name: "readme", note: "your profile page", step: "01", width: 156, x: 84, y: 166 }),
    node(ink, { name: "github camo", note: "image proxy", step: "02", width: 156, x: 316, y: 166 }),
    node(ink, {
      name: "validate",
      note: "valibot · lowercase",
      step: "03",
      width: 160,
      x: 632,
      y: 166,
    }),
    node(ink, {
      name: "count",
      note: "insert … returning",
      step: "04",
      width: 160,
      x: 820,
      y: 166,
    }),
    node(ink, {
      name: "render",
      note: "pure svg · themes",
      step: "05",
      width: 160,
      x: 1008,
      y: 166,
    }),
    database(ink, 900, 330),
    arrow(ink, { at: [278, 196], d: "M242 204H314", label: "img" }),
    arrow(ink, { at: [536, 196], d: "M474 204H630", label: "GET ?username=" }),
    arrow(ink, { d: "M794 204H818" }),
    arrow(ink, { d: "M982 204H1006" }),
    arrow(ink, { both: true, d: "M900 244V328" }),
    arrow(ink, {
      at: [622, 432],
      d: "M1088 244V440H162V246",
      dashed: true,
      label: "image/svg+xml · no-store · every view reaches the worker",
    }),
    `<path d="M96 488h24" stroke="${ink.accent}" stroke-width="1.5"/>`,
    text({ fill: ink.muted, size: 11, text: "request", x: 128, y: 492 }),
    `<path d="M200 488h24" stroke="${ink.accent}" stroke-width="1.5" stroke-dasharray="5 5"/>`,
    text({ fill: ink.muted, size: 11, text: "response", x: 232, y: 492 }),
    text({
      anchor: "end",
      fill: ink.muted,
      size: 11,
      text: "HEAD answers without counting · styling never changes the count",
      x: 1196,
      y: 492,
    }),
  ].join("\n");
  return sheet(
    ink,
    { height: 560, width: 1280 },
    { cx: 900, cy: 210, r: 380 },
    "Request path: README, GitHub image proxy, Worker, D1",
    body,
  );
}

/** Every file this script writes, with its contents. */
export function readmeArt(): Readonly<Record<string, string>> {
  return {
    "assets/architecture-dark.svg": architectureSvg("dark"),
    "assets/architecture-light.svg": architectureSvg("light"),
    "assets/badge-32.7k.svg": `${generateModernBadge(32_700)}\n`,
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
