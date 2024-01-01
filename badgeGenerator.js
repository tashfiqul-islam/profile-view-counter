exports.generateBadge = (label, count) => {
    // Format count for large numbers
    let formattedCount = count >= 100000 
        ? formatLargeNumber(count) 
        : formatNumberWithCommas(count);

    // Dynamic width calculation based on label and count
    const labelWidth = label.length * 6.75;
    const countWidth = formattedCount.length * 5.5;
    const totalWidth = 20 + labelWidth + countWidth;
    const labelX = 27.5;
    const countX = totalWidth - countWidth;

    // SVG markup
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth + 10}" height="25">
            <rect width="${totalWidth + 10}" height="27.5" fill="#555555" />
            <rect x="${labelWidth + 17.5}" width="${countWidth + 17}" height="27.5" fill="#007ec6"/>
            <image href="https://github.com/fluidicon.png" x="5" y="5" height="18" width="18"/>
            <text x="${labelX}" y="18" alignment-baseline="center" font-family="Roboto, sans-serif" font-size="11" fill="#fff">${label}</text>
            <text x="${countX + (countWidth + 12.5 / 2)}" y="18" alignment-baseline="center" font-family="Roboto, sans-serif" font-size="11" font-weight="bold" fill="#fff" text-anchor="end">${formattedCount}</text>
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