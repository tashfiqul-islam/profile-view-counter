// Function to format numbers with commas for readability
function formatNumberWithCommas (number) {
  return new Intl.NumberFormat('en-US').format(number)
}

// Function to format large numbers with appropriate abbreviations
function formatLargeNumber (number) {
  if (isNaN(number)) {
    return 'NaN' // Handle non-numeric values
  }

  if (number < 0) {
    // Return formatted negative numbers
    return formatNumberWithCommas(number)
  } else if (number < 100000) {
    // Numbers less than 100,000 are returned as-is
    return number.toString()
  } else if (number < 1000000) {
    // Format thousands with 'k' suffix, with two decimal places
    const formatted = (number / 1000).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return formatted.endsWith('.00') ? formatted.slice(0, -3) + 'k' : formatted + 'k'
  } else if (number < 1000000000) {
    // Format millions with 'M' suffix, without decimal places
    return (number / 1000000).toFixed(0) + 'M'
  } else {
    // Format billions with 'B' suffix, without decimal places
    return (number / 1000000000).toFixed(0) + 'B'
  }
}

// Function to generate a custom badge URL based on view count
const generateBadge = (count, style = 'for-the-badge', color = '007ec6', timestamp = new Date().getTime()) => {
  // Format the count for display
  const formattedCount = count >= 100000 ? formatLargeNumber(count) : formatNumberWithCommas(count)

  // Define parameters for the badge URL
  const params = new URLSearchParams({
    label: 'Profile Visitors',
    message: formattedCount,
    color,
    style,
    logo: 'github',
    logoColor: 'white',
    logoSource: 'feather',
    cacheBuster: timestamp // Cache busting timestamp
  })

  // Construct and return the complete badge URL
  return `https://custom-icon-badges.demolab.com/static/v1?${params.toString()}`
}

module.exports = { formatNumberWithCommas, formatLargeNumber, generateBadge }
