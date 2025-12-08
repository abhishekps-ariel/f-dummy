/**
 * Utility functions for parsing API responses
 * Provides consistent response parsing across the application
 */

/**
 * Extracts nested data from API responses
 * Handles various response structures: response.data.data.field, response.data.field, etc.
 * 
 * @param {object} response - The API response object
 * @param {...string} keys - Keys to extract from the response (e.g., 'joinRequestStatus', 'mfaTypes')
 * @returns {any|null} - The extracted data, or null if not found
 * 
 * @example
 * // Extract joinRequestStatus from various response structures
 * const status = extractNestedData(response, 'joinRequestStatus');
 * 
 * @example
 * // Extract nested data with multiple keys
 * const data = extractNestedData(response, 'data', 'joinRequestStatus');
 */
export const extractNestedData = (response, ...keys) => {
  if (!response || !response.data) {
    return null;
  }

  let current = response.data;

  // First, try to extract using the provided keys
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      break;
    }
  }

  // If we found data with keys, return it
  if (current !== response.data) {
    return current;
  }

  // Fallback: Try common nested structures
  // Structure 1: response.data.data.field
  if (response.data.data && typeof response.data.data === 'object') {
    for (const key of keys) {
      if (key in response.data.data) {
        return response.data.data[key];
      }
    }
    // If no specific key found, return the data object
    if (keys.length === 0) {
      return response.data.data;
    }
  }

  // Structure 2: response.data.field
  for (const key of keys) {
    if (key in response.data) {
      return response.data[key];
    }
  }

  // Structure 3: response.data itself
  if (keys.length === 0) {
    return response.data;
  }

  return null;
};

/**
 * Normalizes API response to a consistent format
 * @param {object} response - The API response
 * @param {string} defaultMessage - Default success message
 * @returns {object} - Normalized response with { isSuccess, msg, data }
 */
export const normalizeResponse = (response, defaultMessage = 'Operation completed successfully') => {
  if (!response || !response.data) {
    return {
      isSuccess: false,
      msg: 'Invalid response received',
      data: null,
    };
  }

  return {
    isSuccess: response.data.success !== false && response.status >= 200 && response.status < 300,
    msg: response.data.message || response.data.msg || defaultMessage,
    data: response.data.data || response.data,
  };
};

