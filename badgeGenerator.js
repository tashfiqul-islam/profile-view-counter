exports.generateBadge = (label, count) => {
    const formattedCount = count >= 100000 ? formatLargeNumber(count) : formatNumberWithCommas(count);

    // Badge dimension and font size
    const badgeHeight = 34;
    const logoSize = 22;
    const padding = 10;
    const spacing = 8;
    const textFontSize = 14;
    const fontWeightAdjustment = 1.5;

    // Function to estimate text width
    const estimatedTextWidth = (text, fontSize, fontWeight) => 
        text.length * (fontSize / 2) * (fontWeight === 'bold' ? fontWeightAdjustment : 1.05);

    const labelWidth = estimatedTextWidth(label, textFontSize, 'normal');
    const countWidth = estimatedTextWidth(formattedCount, textFontSize, 'bold');

    const ashSectionWidth = padding + logoSize + spacing + labelWidth + padding;
    const blueSectionWidth = padding + countWidth + padding;
    const totalWidth = ashSectionWidth + blueSectionWidth;

    // Position calculations
    const labelXPosition = padding + logoSize + spacing + (labelWidth / 2);
    const countXPosition = ashSectionWidth + (blueSectionWidth / 2);
    const verticalCenter = (badgeHeight / 2) + 1;

    // SVG markup
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${badgeHeight}">
            <rect width="${ashSectionWidth}" height="${badgeHeight}" fill="#555555" />
            <rect x="${ashSectionWidth}" width="${blueSectionWidth}" height="${badgeHeight}" fill="#007ec6"/>
            <image href="https://github.com/fluidicon.png" x="${padding}" y="${(badgeHeight - logoSize) / 2}" height="${logoSize}" width="${logoSize}"/>
            <text x="${labelXPosition}" y="${verticalCenter}" alignment-baseline="middle" text-anchor="middle" font-family="Roboto-regular, sans-serif" font-size="${textFontSize}" fill="#fff">${label}</text>
            <text x="${countXPosition}" y="${verticalCenter}" alignment-baseline="middle" text-anchor="middle" font-family="Roboto-medium, sans-serif" font-size="${textFontSize}" font-weight="bold" fill="#fff">${formattedCount}</text>
        </svg>`;
};

// Function to format numbers with commas
function formatNumberWithCommas(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

// Function to format large numbers (100,000 and above)
function formatLargeNumber(number) {
    return parseFloat((number / 1000).toFixed(2)).toString() + 'k';
}