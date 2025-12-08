/**
 * Common utility functions for service layer
 */

/**
 * Common HTTP headers used across services
 */
export const SERVICE_HEADERS = {
  TEXT_PLAIN: {
    Accept: "text/plain",
  },
  JSON: {
    Accept: "text/plain",
    "Content-Type": "application/json",
  },
  JSON_WILDCARD: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
};

/**
 * Normalize API response to consistent format
 * @param {Object} response - Axios response object
 * @param {string} defaultMessage - Default success message
 * @returns {Object} Normalized response with isSuccess, msg, and data
 */
export const normalizeResponse = (response, defaultMessage = "Operation completed successfully") => {
  return {
    isSuccess: response.data?.success !== false && response.status === 200,
    msg: response.data?.message || defaultMessage,
    data: response.data?.data || response.data,
  };
};

/**
 * Safely convert date string to ISO format
 * @param {string} dateString - Date string to convert
 * @returns {string|null} ISO date string or null if invalid
 */
export const safeDateConversion = (dateString) => {
  if (!dateString || !dateString.trim()) return null;
  try {
    // If already in ISO format, return as is
    if (dateString.includes("T")) {
      return dateString;
    }
    // Otherwise, convert to ISO format
    const date = new Date(dateString + "T00:00:00");
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
};

/**
 * Convert date string to ISO format (for dates without time)
 * @param {string} dateString - Date string to convert
 * @returns {string|null} ISO date string or null if invalid
 */
export const dateToISO = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
};

/**
 * Convert File object to base64 string
 * @param {File|string} file - File object or base64 string
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  if (!file || typeof file === "string") {
    return Promise.resolve(file || "");
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix (data:application/pdf;base64,) to get just the base64 string
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => {
      resolve("");
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Safely parse integer value
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed integer or default value
 */
export const safeParseInt = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "") return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely parse float value
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed float or default value
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "") return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely get string value with fallback
 * @param {any} value - Value to get
 * @param {string} defaultValue - Default value
 * @returns {string} String value or default
 */
export const safeString = (value, defaultValue = "") => {
  return value || defaultValue;
};

/**
 * Check if a value is a valid UUID
 * @param {any} value - Value to check
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (value) => {
  if (!value) return false;
  if (typeof value === "string" && value.includes("-")) {
    // Basic UUID format check (contains dashes)
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
  return false;
};

