/**
 * Composable for formatting currency prices.
 */
export function usePriceFormatter() {
  /**
   * Formats a numeric price into localized currency string.
   * 
   * @param {Number|String} amount Price amount (in minor units e.g. cents/kobo or decimal)
   * @param {String} currencyCode Currency code e.g. 'USD', 'NGN', 'EUR'
   * @returns {String} Formatted price
   */
  const formatPrice = (amount, currencyCode = 'USD') => {
    if (amount === undefined || amount === null) return '';

    const numericValue = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numericValue)) return String(amount);

    // Vendure / e-commerce APIs send prices in minor units (e.g. 4999 minor units = 49.99)
    const val = (numericValue > 100 && Number.isInteger(numericValue)) ? numericValue / 100 : numericValue;

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    } catch (err) {
      return `$${val.toFixed(2)}`;
    }
  };

  return {
    formatPrice
  };
}
