/**
 * Pure SVG rendering of the "PROFILE VISITORS" badge: no bindings, no I/O.
 *
 * Layout is computed from estimated text widths, then every text run is pinned to that width with
 * `textLength`, so the text fits and stays centred whatever font the viewer's system picks. Colours
 * come from a named theme, optionally overridden by caller-supplied hex colours; text colour on a
 * custom background is picked by contrast.
 *
 * @module
 */

/** Typography of one text run. */
interface TextStyle {
  /** Font size in px. */
  readonly size: number;
  /** Font weight. */
  readonly weight: number;
  /** Extra space per gap between glyphs, in px; also the slack that absorbs wider fonts. */
  readonly tracking: number;
}

/** Colours of one badge. Hex strings with a leading `#`. */
export interface Palette {
  /** Left segment background. */
  readonly label: string;
  /** Right segment background: a solid colour or a left-to-right gradient. */
  readonly count: string | readonly [string, string];
  /** Label text and GitHub mark. */
  readonly labelText: string;
  /** Count text. */
  readonly countText: string;
  /** Hairline edge colour and opacity. */
  readonly edge: readonly [string, number];
  /** Sheen opacities: white at the top, black at the bottom. */
  readonly sheen: readonly [number, number];
}

/** Names of the built-in themes, in display order. */
export const THEME_NAMES = [
  "graphite",
  "aurora",
  "mono",
  "paper",
  "contribution",
  "adaptive",
] as const;

/** A built-in theme name. */
export type ThemeName = (typeof THEME_NAMES)[number];

/** Optional styling for {@link generateModernBadge}. */
export interface BadgeOptions {
  /** Built-in theme; defaults to `graphite`. */
  readonly theme?: ThemeName | undefined;
  /** Count segment background as 6-digit hex without `#`, e.g. `e11d48`. Overrides the theme. */
  readonly color?: string | undefined;
  /** Label segment background as 6-digit hex without `#`. Overrides the theme. */
  readonly labelColor?: string | undefined;
}

const WHITE = "#ffffff";
const INK = "#1f2328";
const DARK_EDGE = [WHITE, 0.12] as const;
const DARK_SHEEN = [0.14, 0.12] as const;

const GRAPHITE: Palette = {
  count: "#0969da",
  countText: WHITE,
  edge: DARK_EDGE,
  label: INK,
  labelText: WHITE,
  sheen: DARK_SHEEN,
};

/** The built-in palettes. `adaptive` is `graphite` plus a light-mode override (see `ADAPTIVE_CSS`). */
export const THEMES: Readonly<Record<ThemeName, Palette>> = {
  adaptive: GRAPHITE,
  aurora: {
    count: ["#2f81f7", "#a371f7"],
    countText: WHITE,
    edge: DARK_EDGE,
    label: "#0d1117",
    labelText: WHITE,
    sheen: DARK_SHEEN,
  },
  contribution: {
    count: "#1a7f37",
    countText: WHITE,
    edge: DARK_EDGE,
    label: INK,
    labelText: WHITE,
    sheen: DARK_SHEEN,
  },
  graphite: GRAPHITE,
  mono: {
    count: "#24292f",
    countText: "#58a6ff",
    edge: DARK_EDGE,
    label: "#24292f",
    labelText: WHITE,
    sheen: DARK_SHEEN,
  },
  paper: {
    count: "#0969da",
    countText: WHITE,
    edge: ["#d0d7de", 1],
    label: WHITE,
    labelText: INK,
    sheen: [0, 0.04],
  },
};

// Switches the label segment to light when the viewer prefers a light colour scheme.
const ADAPTIVE_CSS =
  "@media (prefers-color-scheme: light){.pvc-label{fill:#f6f8fa}.pvc-label-text{fill:#1f2328}" +
  ".pvc-edge{stroke:#d0d7de;stroke-opacity:1}}";

const HEIGHT = 28;
const RADIUS = HEIGHT / 2;
const PAD = 11;
const ICON = 14;
const ICON_GAP = 6;
const MIN_COUNT_SEGMENT = 36;

const LABEL = "PROFILE VISITORS";
const LABEL_STYLE = { size: 10, tracking: 0.9, weight: 600 } as const satisfies TextStyle;
const COUNT_STYLE = { size: 12, tracking: 0.4, weight: 700 } as const satisfies TextStyle;

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Advance widths in 1/1000 em of a bold grotesque (Arial Bold metrics). */
const ADVANCE: Readonly<Record<string, number>> = {
  " ": 278,
  ".": 278,
  ...Object.fromEntries("0123456789".split("").map((digit) => [digit, 556])),
  A: 722,
  B: 722,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 556,
  K: 722,
  L: 611,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
};
const FALLBACK_ADVANCE = 667;

const GITHUB_MARK =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

const COMPACT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, notation: "compact" });

const round = (value: number): number => Math.round(value * 10) / 10;

/**
 * Escapes the five XML special characters so a value is safe inside SVG text or attributes.
 *
 * @param str - Untrusted text.
 * @returns The escaped text.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Shortens a count the way GitHub does: compact notation with at most one decimal.
 *
 * @param num - Non-negative view count.
 * @returns For example `"999"`, `"1.2K"`, `"1M"` (999,999 rounds up to `1M`, never `1000K`).
 */
export function formatNumber(num: number): string {
  return COMPACT.format(num);
}

/**
 * Estimated rendered width of `text`, including tracking between glyphs.
 *
 * @param text - The run to measure.
 * @param style - Its typography.
 * @returns Width in px, rounded to 0.1.
 */
export function textWidth(text: string, style: TextStyle): number {
  let units = 0;
  let glyphs = 0;
  for (const glyph of text) {
    units += ADVANCE[glyph] ?? FALLBACK_ADVANCE;
    glyphs += 1;
  }
  return round((units / 1000) * style.size + style.tracking * Math.max(glyphs - 1, 0));
}

const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const;

/** WCAG relative luminance of a `#rrggbb` colour. */
const luminance = (hex: string): number =>
  LUMINANCE_WEIGHTS.reduce((sum, weight, i) => {
    const c = Number.parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return sum + weight * (c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  }, 0);

/** WCAG contrast ratio between two `#rrggbb` colours. */
const contrast = (a: string, b: string): number => {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/**
 * Text colour for a background: white or GitHub ink, whichever contrasts more.
 *
 * @param background - `#rrggbb` background colour.
 * @returns `#ffffff` or `#1f2328`.
 */
export function readableText(background: string): string {
  return contrast(background, WHITE) >= contrast(background, INK) ? WHITE : INK;
}

/**
 * The palette for a theme with optional custom colours applied; custom backgrounds get readable
 * text automatically.
 *
 * @param options - Theme and custom colours.
 * @returns The palette to draw with.
 * @throws Error when a custom colour is not 6-digit hex.
 */
export function resolvePalette(options: BadgeOptions = {}): Palette {
  const base = THEMES[options.theme ?? "graphite"];
  const label = parseHex(options.labelColor, "labelColor");
  const count = parseHex(options.color, "color");
  return {
    ...base,
    ...(label === undefined ? {} : { label, labelText: readableText(label) }),
    ...(count === undefined ? {} : { count, countText: readableText(count) }),
  };
}

const HEX = /^[0-9a-f]{6}$/i;

/** `#rrggbb` from a validated 6-digit hex; anything else never reaches the SVG. */
function parseHex(value: string | undefined, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (!HEX.test(value))
    throw new Error(`${name} must be a 6-digit hex colour, got ${JSON.stringify(value)}`);
  return `#${value.toLowerCase()}`;
}

/** Baseline that centres capitals of `size` vertically in the badge. */
const baseline = (size: number): number => round(HEIGHT / 2 + size * 0.35);

/**
 * Renders the badge: a 28 px pill with the GitHub mark and label on the left and the formatted
 * count on the right. Width grows with the count; text never overflows its segment.
 *
 * @param count - View count to show.
 * @param options - Theme and custom colours; defaults to the `graphite` theme.
 * @returns A standalone, accessible SVG document sized 1:1 to its `viewBox`.
 */
export function generateModernBadge(count: number, options: BadgeOptions = {}): string {
  const palette = resolvePalette(options);
  const adaptive = options.theme === "adaptive" && options.labelColor === undefined;
  const value = escapeXml(formatNumber(count));
  const label = escapeXml(LABEL);
  const title = `Profile visitors: ${value}`;

  const labelText = textWidth(LABEL, LABEL_STYLE);
  const countText = textWidth(value, COUNT_STYLE);
  const labelSegment = round(PAD + ICON + ICON_GAP + labelText + PAD);
  const countSegment = round(Math.max(PAD + countText + PAD, MIN_COUNT_SEGMENT));
  const width = round(labelSegment + countSegment);

  const gradient = typeof palette.count === "string" ? undefined : palette.count;
  const countFill = typeof palette.count === "string" ? palette.count : "url(#pvc-accent)";
  const labelClass = adaptive ? ' class="pvc-label"' : "";
  const labelTextClass = adaptive ? ' class="pvc-label-text"' : "";
  const edgeClass = adaptive ? ' class="pvc-edge"' : "";
  const [edgeColor, edgeOpacity] = palette.edge;
  const [sheenTop, sheenBottom] = palette.sheen;

  const defs = [
    adaptive ? `    <style>${ADAPTIVE_CSS}</style>` : "",
    `    <linearGradient id="pvc-sheen" x2="0" y2="1">
      <stop offset="0" stop-color="${WHITE}" stop-opacity="${sheenTop}"/>
      <stop offset="1" stop-color="#000000" stop-opacity="${sheenBottom}"/>
    </linearGradient>`,
    gradient === undefined
      ? ""
      : `    <linearGradient id="pvc-accent">
      <stop offset="0" stop-color="${gradient[0]}"/>
      <stop offset="1" stop-color="${gradient[1]}"/>
    </linearGradient>`,
  ]
    .filter(Boolean)
    .join("\n");
  // Same colour on both segments: a short divider keeps them apart.
  const divider =
    palette.label === palette.count
      ? `\n  <rect x="${labelSegment}" y="7" width="1" height="14" fill="${palette.labelText}" fill-opacity=".25"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${title}">
  <title>${title}</title>
  <defs>
${defs}
  </defs>
  <rect width="${width}" height="${HEIGHT}" rx="${RADIUS}" fill="${countFill}"/>
  <path${labelClass} d="M${RADIUS} 0H${labelSegment}V${HEIGHT}H${RADIUS}A${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} 0Z" fill="${palette.label}"/>
  <rect width="${width}" height="${HEIGHT}" rx="${RADIUS}" fill="url(#pvc-sheen)"/>
  <rect x=".5" y=".5" width="${round(width - 1)}" height="${HEIGHT - 1}" rx="${RADIUS - 0.5}" fill="none"${edgeClass} stroke="${edgeColor}" stroke-opacity="${edgeOpacity}"/>${divider}
  <g font-family="${FONT_STACK}" text-rendering="geometricPrecision">
    <path${labelTextClass} aria-hidden="true" fill="${palette.labelText}" transform="translate(${PAD} ${(HEIGHT - ICON) / 2}) scale(${ICON / 16})" d="${GITHUB_MARK}"/>
    <text${labelTextClass} x="${PAD + ICON + ICON_GAP}" y="${baseline(LABEL_STYLE.size)}" fill="${palette.labelText}" font-size="${LABEL_STYLE.size}" font-weight="${LABEL_STYLE.weight}" textLength="${labelText}" lengthAdjust="spacing">${label}</text>
    <text x="${round(labelSegment + countSegment / 2)}" y="${baseline(COUNT_STYLE.size)}" fill="${palette.countText}" font-size="${COUNT_STYLE.size}" font-weight="${COUNT_STYLE.weight}" text-anchor="middle" textLength="${countText}" lengthAdjust="spacing">${value}</text>
  </g>
</svg>`;
}
