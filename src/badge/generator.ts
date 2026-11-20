/**
 * Pure SVG rendering of the "PROFILE VISITORS" badge: no bindings, no I/O.
 *
 * Layout is computed from estimated text widths, then every text run is pinned to that width with
 * `textLength`, so the text fits and stays centred whatever font the viewer's system picks.
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

const HEIGHT = 28;
const RADIUS = HEIGHT / 2;
const PAD = 11;
const ICON = 14;
const ICON_GAP = 6;
const MIN_COUNT_SEGMENT = 36;

const LABEL = "PROFILE VISITORS";
const LABEL_STYLE = { size: 10, tracking: 0.9, weight: 600 } as const satisfies TextStyle;
const COUNT_STYLE = { size: 12, tracking: 0.4, weight: 700 } as const satisfies TextStyle;

const COLORS = {
  count: "#0969da",
  label: "#1f2328",
  text: "#ffffff",
} as const satisfies Record<string, string>;

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
  for (const glyph of text) units += ADVANCE[glyph] ?? FALLBACK_ADVANCE;
  return round((units / 1000) * style.size + style.tracking * Math.max(text.length - 1, 0));
}

/** Baseline that centres capitals of `size` vertically in the badge. */
const baseline = (size: number): number => round(HEIGHT / 2 + size * 0.35);

/**
 * Renders the badge: a 28 px pill with the GitHub mark and label on the left and the formatted
 * count on the right. Width grows with the count; text never overflows its segment.
 *
 * @param count - View count to show.
 * @returns A standalone, accessible SVG document sized 1:1 to its `viewBox`.
 */
export function generateModernBadge(count: number): string {
  const value = escapeXml(formatNumber(count));
  const label = escapeXml(LABEL);
  const title = `Profile visitors: ${value}`;

  const labelText = textWidth(LABEL, LABEL_STYLE);
  const countText = textWidth(value, COUNT_STYLE);
  const labelSegment = round(PAD + ICON + ICON_GAP + labelText + PAD);
  const countSegment = round(Math.max(PAD + countText + PAD, MIN_COUNT_SEGMENT));
  const width = round(labelSegment + countSegment);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${title}">
  <title>${title}</title>
  <defs>
    <linearGradient id="pvc-sheen" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".14"/>
      <stop offset="1" stop-color="#000000" stop-opacity=".12"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${HEIGHT}" rx="${RADIUS}" fill="${COLORS.count}"/>
  <path d="M${RADIUS} 0H${labelSegment}V${HEIGHT}H${RADIUS}A${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} 0Z" fill="${COLORS.label}"/>
  <rect width="${width}" height="${HEIGHT}" rx="${RADIUS}" fill="url(#pvc-sheen)"/>
  <rect x=".5" y=".5" width="${round(width - 1)}" height="${HEIGHT - 1}" rx="${RADIUS - 0.5}" fill="none" stroke="#ffffff" stroke-opacity=".12"/>
  <g fill="${COLORS.text}" font-family="${FONT_STACK}" text-rendering="geometricPrecision">
    <path aria-hidden="true" transform="translate(${PAD} ${(HEIGHT - ICON) / 2}) scale(${ICON / 16})" d="${GITHUB_MARK}"/>
    <text x="${PAD + ICON + ICON_GAP}" y="${baseline(LABEL_STYLE.size)}" font-size="${LABEL_STYLE.size}" font-weight="${LABEL_STYLE.weight}" textLength="${labelText}" lengthAdjust="spacing">${label}</text>
    <text x="${round(labelSegment + countSegment / 2)}" y="${baseline(COUNT_STYLE.size)}" font-size="${COUNT_STYLE.size}" font-weight="${COUNT_STYLE.weight}" text-anchor="middle" font-variant-numeric="tabular-nums" textLength="${countText}" lengthAdjust="spacing">${value}</text>
  </g>
</svg>`;
}
