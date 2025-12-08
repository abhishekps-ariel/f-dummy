/**
 * Currency formatting utility functions
 */

/**
 * Format a numeric value as currency input (with commas)
 * @param {string|number} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyInput = (value) => {
  if (!value && value !== 0) return "";
  // Remove all non-digit characters except decimal point
  const numericValue = String(value).replace(/[^\d.]/g, "");
  // Split by decimal point
  const parts = numericValue.split(".");
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Join back with decimal if it exists
  return parts.length > 1 ? parts.join(".") : parts[0];
};

/**
 * Parse a formatted currency string to numeric value
 * @param {string} value - The formatted currency string
 * @returns {string} Numeric value without formatting
 */
export const parseCurrencyInput = (value) => {
  if (!value) return "";
  // Remove all non-digit characters except decimal point
  const numericValue = String(value).replace(/[^\d.]/g, "");
  // Return empty string if nothing remains
  if (!numericValue) return "";
  // Return the numeric value (without commas)
  return numericValue;
};

