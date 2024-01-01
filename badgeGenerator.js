// Function to format numbers with commas
function formatNumberWithCommas(number) {
  return new Intl.NumberFormat('en-US').format(number);
}

// Function to format large numbers (100,000 and above)
function formatLargeNumber(number) {
  return parseFloat((number / 1000).toFixed(2)) + 'k';
}

// Function to generate the badge URL
const generateBadge = (count) => {
  // Format the count appropriately
  const formattedCount = count >= 100000 ? formatLargeNumber(count) : formatNumberWithCommas(count);

  // Define parameters for custom-icon-badges.demolab.com URL
  const params = new URLSearchParams({
    label: 'Profile Visitors',
    message: formattedCount,
    color: '007ec6',
    style: 'for-the-badge',
    logo: 'github',
    logoColor: 'white',
    logoSource: 'feather',
  });

  // Construct and return the badge URL
  return `https://custom-icon-badges.demolab.com/static/v1?${params.toString()}`;
};

module.exports = { generateBadge };
