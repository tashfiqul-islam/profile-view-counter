// Function to format numbers with commas for readability
function formatNumberWithCommas(number) {
  return new Intl.NumberFormat('en-US').format(number);
}

// Function to format large numbers with appropriate abbreviations
function formatLargeNumber(number) {
  if (isNaN(number)) {
    return 'NaN';
  }
  if (number < 0) {
    // Return formatted negative numbers
    return formatNumberWithCommas(number);
  } else if (number < 1000) {
    // Numbers less than 1000 are returned as-is
    return number.toString();
  } else if (number < 1000000) {
    // Format thousands with 'k' suffix
    return (number / 1000).toFixed(0) + 'k';
  } else if (number < 1000000000) {
    // Format millions with 'M' suffix, removing trailing zeros
    return (number / 1000000).toFixed(2).replace(/\.0+$/, '') + 'M';
  } else {
    // Format billions with 'B' suffix, removing trailing zeros
    return (number / 1000000000).toFixed(2).replace(/\.0+$/, '') + 'B';
  }
}

// Function to generate a custom badge URL based on view count
const generateBadge = (
  count,
  style = 'for-the-badge',
  color = '007ec6',
  timestamp = new Date().getTime(),
) => {
  // Format the count for display
  const formattedCount =
    count >= 100000 ? formatLargeNumber(count) : formatNumberWithCommas(count);

  // Define parameters for the badge URL
  const params = new URLSearchParams({
    label: 'Profile Visitors',
    message: formattedCount,
    color,
    style,
    logo: 'github',
    logoColor: 'white',
    logoSource: 'feather',
    cacheBuster: timestamp,
  });

  // Construct and return the complete badge URL
  return `https://custom-icon-badges.demolab.com/static/v1?${params.toString()}`;
};

module.exports = { formatNumberWithCommas, formatLargeNumber, generateBadge };
