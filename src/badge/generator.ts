interface BadgeTheme {
  readonly countBg: string;
  readonly labelBg: string;
  readonly logoBg: string;
  readonly textColor: string;
}

interface BadgeDimensions {
  readonly badgeHeight: number;
  readonly badgeRadius: number;
  readonly charWidth: number;
  readonly countCharWidth: number;
  readonly countPadX: number;
  readonly fontSize: number;
  readonly logoCircleSize: number;
  readonly logoStrokeWidth: number;
  readonly outerPadX: number;
}

const THEME = {
  countBg: "#007ec6",
  labelBg: "#444444",
  logoBg: "#24292e",
  textColor: "#ffffff",
} as const satisfies BadgeTheme;

const DIMENSIONS = {
  badgeHeight: 24,
  badgeRadius: 4,
  charWidth: 6.4,
  countCharWidth: 7.5,
  countPadX: 10,
  fontSize: 11,
  logoCircleSize: 30,
  logoStrokeWidth: 2,
  outerPadX: 6,
} as const satisfies BadgeDimensions;

const LABEL = "PROFILE VISITORS";
const LOGO_ICON_SIZE = 16;
const TRAILING_ZERO_REGEX = /\.0$/;

const GITHUB_ICON_PATH =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

const SVG_DEFS = `
    <filter id="logo-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
    </filter>

    <filter id="text-3d">
       <feDropShadow dx="1" dy="1" stdDeviation="0" flood-color="#000" flood-opacity="0.5"/>
    </filter>`;

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}K`;
  }
  return num.toString();
}

export function generateModernBadge(count: number): string {
  const formattedCount = formatNumber(count);
  const safeCount = escapeXml(formattedCount);
  const d = DIMENSIONS;

  const logoDiameter = d.logoCircleSize;
  const logoRadius = logoDiameter / 2;
  const logoStrokeHalf = d.logoStrokeWidth / 2;

  const labelTextWidth = LABEL.length * d.charWidth;
  const countTextWidth = Math.max(safeCount.length * d.countCharWidth, 16);

  const countSectionWidth = countTextWidth + d.countPadX * 2;

  const totalHeight = logoDiameter + 4;
  const badgeY = (totalHeight - d.badgeHeight) / 2 + 1;
  const logoY = totalHeight / 2;

  const logoCenterX = logoRadius + logoStrokeHalf;
  const badgeStartX = logoCenterX + logoRadius - 6;

  const textPadLeft = logoCenterX + logoRadius - badgeStartX + d.countPadX + 1;
  const labelSectionWidth = textPadLeft + labelTextWidth + d.countPadX;
  const badgeInnerWidth =
    textPadLeft + labelTextWidth + d.countPadX + countSectionWidth;

  const viewBoxMinX = -(logoCenterX + logoRadius + logoStrokeHalf + 5);
  const viewBoxDisplayWidth =
    badgeStartX + badgeInnerWidth + d.outerPadX - viewBoxMinX;

  const logoIconScale = LOGO_ICON_SIZE / 16;
  const countLetterSpacing = safeCount.length > 1 ? "2" : "0";

  const labelTextCenterX = textPadLeft + labelTextWidth / 2;
  const countTextCenterX =
    textPadLeft + labelTextWidth + d.countPadX + countSectionWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBoxDisplayWidth * 2}" height="${totalHeight * 2}" viewBox="${viewBoxMinX} 0 ${viewBoxDisplayWidth} ${totalHeight}" preserveAspectRatio="xMinYMid meet" role="img" aria-labelledby="badge-title badge-desc">
  <title id="badge-title">${LABEL}: ${safeCount}</title>
  <desc id="badge-desc">${safeCount} profile views on GitHub</desc>

  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    </style>
    ${SVG_DEFS}
  </defs>

  <g transform="translate(${badgeStartX}, ${badgeY})">
    <path d="M0 0 h${labelSectionWidth} v${d.badgeHeight} h-${labelSectionWidth} v-${d.badgeHeight} z" fill="${THEME.labelBg}"/>

    <path d="M${labelSectionWidth} 0 h${countSectionWidth - d.badgeRadius} a${d.badgeRadius} ${d.badgeRadius} 0 0 1 ${d.badgeRadius} ${d.badgeRadius} v${d.badgeHeight - d.badgeRadius * 2} a${d.badgeRadius} ${d.badgeRadius} 0 0 1 -${d.badgeRadius} ${d.badgeRadius} h-${countSectionWidth - d.badgeRadius} v-${d.badgeHeight} z" fill="${THEME.countBg}"/>

    <text x="${labelTextCenterX}" y="${d.badgeHeight / 2 + 1}" fill="${THEME.textColor}" filter="url(#text-3d)" font-size="${d.fontSize}" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5" text-rendering="geometricPrecision">${LABEL}</text>
    <text x="${countTextCenterX}" y="${d.badgeHeight / 2 + 1}" fill="${THEME.textColor}" filter="url(#text-3d)" font-size="${d.fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" letter-spacing="${countLetterSpacing}" text-rendering="geometricPrecision" font-variant-numeric="tabular-nums">${safeCount}</text>
  </g>

  <g filter="url(#logo-shadow)" aria-hidden="true">
    <circle cx="${logoCenterX}" cy="${logoY}" r="${logoRadius}" fill="${THEME.logoBg}" stroke="#fff" stroke-width="${d.logoStrokeWidth}"/>
    <g transform="translate(${logoCenterX - LOGO_ICON_SIZE / 2}, ${(totalHeight - LOGO_ICON_SIZE) / 2}) scale(${logoIconScale})">
      <path fill="#fff" d="${GITHUB_ICON_PATH}"/>
    </g>
  </g>
</svg>`;
}
