function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return num.toString()
}

export function generateModernBadge(count: number): string {
  const formattedCount = formatNumber(count)
  const label = 'PROFILE VISITORS'

  // 3D Capsule Dimensions
  const logoCircleSize = 30
  const badgeHeight = 24
  const badgeRadius = 4

  // Spacing & Layout
  const leftStripPad = logoCircleSize / 2 + 2
  const labelSidePad = 4
  const countPadX = 10

  // Font settings
  const fontSize = 11
  const charWidth = 6.4
  const countCharWidth = 7.5

  // Calculate text widths
  const labelTextWidth = label.length * charWidth
  const countTextWidth = Math.max(formattedCount.length * countCharWidth, 12)

  // Section widths
  const labelSectionWidth = leftStripPad + labelTextWidth + labelSidePad
  const countSectionWidth = countTextWidth + countPadX * 2
  const stripWidth = labelSectionWidth + countSectionWidth

  // SVG total dimensions
  const totalWidth = stripWidth + logoCircleSize / 2
  const totalHeight = logoCircleSize + 4

  // Colors
  const labelBg = '#444444'
  const countBg = '#007ec6'
  const textColor = '#ffffff'
  const logoBg = '#24292e'

  // Vertical centering offsets
  const badgeY = (totalHeight - badgeHeight) / 2
  const logoY = totalHeight / 2

  // GitHub Mark
  const logoIconSize = 16 // Slightly smaller icon
  const logoIconScale = logoIconSize / 16

  // Count letter spacing for better readability
  const countLetterSpacing = formattedCount.length > 1 ? '2' : '0'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" role="img" aria-label="${label}: ${formattedCount}">
  <title>${label}: ${formattedCount}</title>

  <defs>
    <style>@import url('https://fonts.googleapis.com/css2?family=Ropa+Sans&amp;display=swap');</style>

    <!-- Subtle Logo Shadow -->
    <filter id="logo-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
    </filter>

    <!-- 3D Text Shadow (Inset/Emboss effect) - Cleaner -->
    <filter id="text-3d">
       <feDropShadow dx="1" dy="1" stdDeviation="0" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- 1. BADGE STRIP (Background Layer) -->
  <g transform="translate(${logoCircleSize / 2}, ${badgeY})">
    <!-- Left gray capsule part -->
    <path d="M0 0 h${labelSectionWidth} v${badgeHeight} h-${labelSectionWidth} v-${badgeHeight} z" fill="${labelBg}"/>

    <!-- Right blue count part -->
    <path d="M${labelSectionWidth} 0 h${countSectionWidth - badgeRadius} a${badgeRadius} ${badgeRadius} 0 0 1 ${badgeRadius} ${badgeRadius} v${badgeHeight - badgeRadius * 2} a${badgeRadius} ${badgeRadius} 0 0 1 -${badgeRadius} ${badgeRadius} h-${countSectionWidth - badgeRadius} v-${badgeHeight} z" fill="${countBg}"/>

    <!-- Text Labels with 3D Effect -->
    <text x="${leftStripPad + labelTextWidth / 2}" y="${badgeHeight / 2 + 1}" fill="${textColor}" filter="url(#text-3d)" font-family="'Ropa Sans', sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${label}</text>
    <text x="${labelSectionWidth + countSectionWidth / 2}" y="${badgeHeight / 2 + 1}" fill="${textColor}" filter="url(#text-3d)" font-family="'Ropa Sans', sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" letter-spacing="${countLetterSpacing}">${formattedCount}</text>
  </g>

  <!-- 2. LOGO CIRCLE (Foreground Layer) -->
  <g filter="url(#logo-shadow)">
    <circle cx="${logoCircleSize / 2}" cy="${logoY}" r="${logoCircleSize / 2}" fill="${logoBg}" stroke="#fff" stroke-width="2"/>
    <g transform="translate(${(logoCircleSize - logoIconSize) / 2}, ${(totalHeight - logoIconSize) / 2}) scale(${logoIconScale})">
      <path fill="#fff" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </g>
  </g>
</svg>`
}
