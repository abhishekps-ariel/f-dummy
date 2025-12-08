/**
 * MFA (Multi-Factor Authentication) utilities
 */

import { getMfaTypesEnum } from '../../services/commonService';

/**
 * Load available MFA types
 * @returns {Promise<Array>} Array of available MFA types
 */
export const loadMfaTypes = async () => {
  try {
    const response = await getMfaTypesEnum();
    if (response.isSuccess && response.data) {
      // Filter out "None" and "AuthenticatorApp" for now, only show SMS and Email
      const availableTypes = response.data.filter(
        (type) => type.name === "SMS" || type.name === "Email"
      );
      return availableTypes;
    }
  } catch {
    // Fallback to default types
    return [
      { name: "SMS", value: 1 },
      { name: "Email", value: 2 },
    ];
  }
  return [];
};

/**
 * Get preferred MFA method from response
 * @param {Object} mfaResponse - MFA response object
 * @returns {string|null} Preferred MFA method or null
 */
export const getPreferredMfaMethod = (mfaResponse) => {
  const { preferredMfaMethod, isMfaEnabled } = mfaResponse?.data || {};
  
  if (preferredMfaMethod) {
    return preferredMfaMethod;
  }
  
  // Default to SMS if MFA is enabled but no preference
  if (isMfaEnabled) {
    return "SMS";
  }
  
  return null;
};

/**
 * Validate MFA method selection
 * @param {string} method - Selected MFA method
 * @param {Array} availableTypes - Available MFA types
 * @returns {boolean} True if method is valid
 */
export const isValidMfaMethod = (method, availableTypes) => {
  if (!method || !availableTypes || availableTypes.length === 0) {
    return false;
  }
  
  return availableTypes.some(type => type.name === method);
};

