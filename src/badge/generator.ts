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
  readonly labelSidePad: number;
  readonly logoCircleSize: number;
}

const THEME = {
  labelBg: "#444444",
  countBg: "#007ec6",
  textColor: "#ffffff",
  logoBg: "#24292e",
} as const satisfies BadgeTheme;

const DIMENSIONS = {
  logoCircleSize: 30,
  badgeHeight: 24,
  badgeRadius: 4,
  labelSidePad: 4,
  countPadX: 10,
  fontSize: 11,
  charWidth: 6.4,
  countCharWidth: 7.5,
} as const satisfies BadgeDimensions;

const LABEL = "PROFILE VISITORS";
const LOGO_ICON_SIZE = 16;
const TRAILING_ZERO_REGEX = /\.0$/;

function formatNumber(num: number): string {
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

  const leftStripPad = DIMENSIONS.logoCircleSize / 2 + 2;
  const labelTextWidth = LABEL.length * DIMENSIONS.charWidth;
  const countTextWidth = Math.max(
    formattedCount.length * DIMENSIONS.countCharWidth,
    12
  );

  const labelSectionWidth =
    leftStripPad + labelTextWidth + DIMENSIONS.labelSidePad;
  const countSectionWidth = countTextWidth + DIMENSIONS.countPadX * 2;
  const stripWidth = labelSectionWidth + countSectionWidth;

  const totalWidth = stripWidth + DIMENSIONS.logoCircleSize / 2;
  const totalHeight = DIMENSIONS.logoCircleSize + 4;

  const badgeY = (totalHeight - DIMENSIONS.badgeHeight) / 2;
  const logoY = totalHeight / 2;

  const logoIconScale = LOGO_ICON_SIZE / 16;
  const countLetterSpacing = formattedCount.length > 1 ? "2" : "0";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth * 2}" height="${totalHeight * 2}" viewBox="0 0 ${totalWidth} ${totalHeight}" preserveAspectRatio="xMinYMid meet" role="img" aria-labelledby="badge-title badge-desc">
  <title id="badge-title">${LABEL}: ${formattedCount}</title>
  <desc id="badge-desc">${formattedCount} profile views on GitHub</desc>

  <defs>
    <style>@import url('https://fonts.googleapis.com/css2?family=Ropa+Sans&amp;display=swap');</style>

    <filter id="logo-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
    </filter>

    <filter id="text-3d">
       <feDropShadow dx="1" dy="1" stdDeviation="0" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <g transform="translate(${DIMENSIONS.logoCircleSize / 2}, ${badgeY})">
    <path d="M0 0 h${labelSectionWidth} v${DIMENSIONS.badgeHeight} h-${labelSectionWidth} v-${DIMENSIONS.badgeHeight} z" fill="${THEME.labelBg}"/>

    <path d="M${labelSectionWidth} 0 h${countSectionWidth - DIMENSIONS.badgeRadius} a${DIMENSIONS.badgeRadius} ${DIMENSIONS.badgeRadius} 0 0 1 ${DIMENSIONS.badgeRadius} ${DIMENSIONS.badgeRadius} v${DIMENSIONS.badgeHeight - DIMENSIONS.badgeRadius * 2} a${DIMENSIONS.badgeRadius} ${DIMENSIONS.badgeRadius} 0 0 1 -${DIMENSIONS.badgeRadius} ${DIMENSIONS.badgeRadius} h-${countSectionWidth - DIMENSIONS.badgeRadius} v-${DIMENSIONS.badgeHeight} z" fill="${THEME.countBg}"/>

    <text x="${leftStripPad + labelTextWidth / 2}" y="${DIMENSIONS.badgeHeight / 2 + 1}" fill="${THEME.textColor}" filter="url(#text-3d)" font-family="'Ropa Sans', sans-serif" font-size="${DIMENSIONS.fontSize}" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${LABEL}</text>
    <text x="${labelSectionWidth + countSectionWidth / 2}" y="${DIMENSIONS.badgeHeight / 2 + 1}" fill="${THEME.textColor}" filter="url(#text-3d)" font-family="'Ropa Sans', sans-serif" font-size="${DIMENSIONS.fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" letter-spacing="${countLetterSpacing}">${formattedCount}</text>
  </g>

  <g filter="url(#logo-shadow)">
    <circle cx="${DIMENSIONS.logoCircleSize / 2}" cy="${logoY}" r="${DIMENSIONS.logoCircleSize / 2}" fill="${THEME.logoBg}" stroke="#fff" stroke-width="2"/>
    <g transform="translate(${(DIMENSIONS.logoCircleSize - LOGO_ICON_SIZE) / 2}, ${(totalHeight - LOGO_ICON_SIZE) / 2}) scale(${logoIconScale})">
      <path fill="#fff" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </g>
  </g>
</svg>`;
}
