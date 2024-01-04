/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const {
  formatNumberWithCommas,
  formatLargeNumber,
  generateBadge
} = require('../badgeGenerator')

describe('Badge Generator Tests', () => {
  // Tests for formatNumberWithCommas
  describe('formatNumberWithCommas function', () => {
    // Standard formatting tests
    test('formats numbers with commas', () => {
      expect(formatNumberWithCommas(1000)).toBe('1,000')
      expect(formatNumberWithCommas(1234567)).toBe('1,234,567')
    })

    // Handling small numbers
    test('handles small numbers without commas', () => {
      expect(formatNumberWithCommas(999)).toBe('999')
    })

    // Zero handling
    test('handles zero correctly', () => {
      expect(formatNumberWithCommas(0)).toBe('0')
    })

    // Edge case tests for negative numbers and non-numeric values
    test('handles negative numbers', () => {
      expect(formatNumberWithCommas(-1000)).toBe('-1,000')
    })

    test('handles non-numeric values', () => {
      expect(formatLargeNumber('abcd')).toBe('NaN')
    })
  })

  // Tests for formatLargeNumber
  describe('formatLargeNumber function', () => {
    // Standard abbreviation tests
    test('formats large numbers with abbreviations', () => {
      expect(formatLargeNumber(150000)).toBe('150k')
      expect(formatLargeNumber(2000000)).toBe('2M')
    })

    // Handling smaller numbers
    test('handles numbers less than 1000 without abbreviation', () => {
      expect(formatLargeNumber(999)).toBe('999')
    })

    // Handling millions and billions
    test('handles millions and billions correctly', () => {
      expect(formatLargeNumber(1000000)).toBe('1M')
      expect(formatLargeNumber(1000000000)).toBe('1B')
    })

    // Edge case tests for negative numbers, non-numeric values, and floating-point numbers
    test('handles negative numbers', () => {
      expect(formatLargeNumber(-100000)).toBe('-100,000')
    })

    test('handles non-numeric values', () => {
      expect(formatLargeNumber('abcd')).toBe('NaN')
    })

    test('handles floating-point numbers', () => {
      expect(formatLargeNumber(999.99)).toBe('999.99')
    })
  })

  // Fixed timestamp for testing
  const testTimestamp = 'timestamp'

  // Tests for generateBadge
  describe('generateBadge function', () => {
    // Test for correct badge URL generation for small numbers
    test('generates correct badge URL for small numbers', () => {
      const count = 150
      const expectedUrl =
        'https://custom-icon-badges.demolab.com/static/v1?label=Profile+Visitors&message=150&color=007ec6&style=for-the-badge&logo=github&logoColor=white&logoSource=feather&cacheBuster=timestamp'
      expect(
        generateBadge(count, 'for-the-badge', '007ec6', testTimestamp)
      ).toBe(expectedUrl)
    })

    test('generates correct badge URL for large numbers', () => {
      const count = 150000
      const expectedUrl =
        'https://custom-icon-badges.demolab.com/static/v1?label=Profile+Visitors&message=150k&color=007ec6&style=for-the-badge&logo=github&logoColor=white&logoSource=feather&cacheBuster=timestamp'
      expect(
        generateBadge(count, 'for-the-badge', '007ec6', testTimestamp)
      ).toBe(expectedUrl)
    })

    // Handling zero views
    test('handles zero views correctly', () => {
      const count = 0
      const expectedUrl =
        'https://custom-icon-badges.demolab.com/static/v1?label=Profile+Visitors&message=0&color=007ec6&style=for-the-badge&logo=github&logoColor=white&logoSource=feather&cacheBuster=timestamp'
      expect(
        generateBadge(count, 'for-the-badge', '007ec6', testTimestamp)
      ).toBe(expectedUrl)
    })

    // Handling very large numbers
    test('handles very large numbers correctly', () => {
      const count = 1000000000 // 1 billion
      const expectedUrl =
        'https://custom-icon-badges.demolab.com/static/v1?label=Profile+Visitors&message=1B&color=007ec6&style=for-the-badge&logo=github&logoColor=white&logoSource=feather&cacheBuster=timestamp'
      expect(
        generateBadge(count, 'for-the-badge', '007ec6', testTimestamp)
      ).toBe(expectedUrl)
    })

    // Additional scenario tests for different styles, colors
    test('generates badge with custom style and color', () => {
      const count = 500
      const style = 'for-the-badge'
      const color = '007ec6'
      const expectedUrl =
        'https://custom-icon-badges.demolab.com/static/v1?label=Profile+Visitors&message=500&color=007ec6&style=for-the-badge&logo=github&logoColor=white&logoSource=feather&cacheBuster=timestamp'
      expect(
        generateBadge(count, 'for-the-badge', '007ec6', testTimestamp)
      ).toBe(expectedUrl)
    })
  })
})
