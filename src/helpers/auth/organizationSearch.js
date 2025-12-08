/**
 * Organization search helpers for registration
 */

import { searchOrganizations } from '../../services/organizationService';

/**
 * Search organizations by query
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of organizations
 */
export const searchOrganizationsByQuery = async (query) => {
  try {
    const response = await searchOrganizations(query || "");
    if (response.isSuccess) {
      return response.data || [];
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Format organization for display
 * @param {Object} org - Organization object
 * @returns {Object} Formatted organization
 */
export const formatOrganization = (org) => {
  return {
    id: org.id,
    name: org.name || org.organizationName || '',
    email: org.email || '',
    address: org.address || '',
  };
};

