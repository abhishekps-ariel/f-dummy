import axiosInstance from '../api/axiosInstance';
import { COMMON_ENDPOINTS, NOTIFICATION_ENDPOINTS } from '../constants/apiEndpoints';
import { SERVICE_HEADERS } from '../utils/serviceUtils';
import { normalizeResponse } from '../utils/responseParser';

/**
 * Get email types enum for filter dropdown
 */
export const getEmailTypesEnum = async () => {
  const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_EMAIL_TYPES_ENUM, {
    headers: SERVICE_HEADERS.TEXT_PLAIN,
  });

  return normalizeResponse(response, "Email types fetched successfully");
};

/**
 * Get paginated email history/notifications
 * @param {Object} params - Pagination and filter parameters
 * @param {number} params.pageNumber - Page number (1-based)
 * @param {number} params.pageSize - Number of items per page
 * @param {string} params.userId - User ID (UUID)
 * @param {string} params.searchTerm - Search term for filtering
 * @param {string} params.type - Email type filter (e.g., "PetitionCreatedForFiler")
 * @param {string} params.sortBy - Field to sort by
 * @param {boolean} params.sortDescending - Sort direction
 */
export const getEmailHistoryPaged = async (params) => {
  const requestBody = {
    pageNumber: params.pageNumber || 1,
    pageSize: params.pageSize || 10,
    userId: params.userId || null,
    searchTerm: params.searchTerm || "",
    type: params.type || null,
    sortBy: params.sortBy || "",
    sortDescending: params.sortDescending !== undefined ? params.sortDescending : true,
  };

  const response = await axiosInstance.post(NOTIFICATION_ENDPOINTS.GET_PAGED_LIST, requestBody, {
    headers: SERVICE_HEADERS.JSON_WILDCARD,
  });

  // Handle paginated response structure
  // The API might return: { success, message, data: { items, totalCount, totalPages } }
  // or: { success, message, data: [...items], totalCount, totalPages }
  const normalized = normalizeResponse(response, "Email history fetched successfully");
  
  // If data is an object with items/items array, extract it
  if (normalized.data && typeof normalized.data === 'object' && !Array.isArray(normalized.data)) {
    // Check for nested items array
    if (Array.isArray(normalized.data.items)) {
      return {
        ...normalized,
        data: normalized.data.items,
        totalCount: normalized.data.totalCount || normalized.data.totalRecords || 0,
        totalPages: normalized.data.totalPages || Math.ceil((normalized.data.totalCount || normalized.data.totalRecords || 0) / (params.pageSize || 10)),
      };
    }
    // Check if data itself contains pagination info
    if (normalized.data.totalCount !== undefined || normalized.data.totalPages !== undefined) {
      return {
        ...normalized,
        data: normalized.data.data || normalized.data.items || [],
        totalCount: normalized.data.totalCount || normalized.data.totalRecords || 0,
        totalPages: normalized.data.totalPages || Math.ceil((normalized.data.totalCount || normalized.data.totalRecords || 0) / (params.pageSize || 10)),
      };
    }
  }
  
  // If response.data has pagination info at root level
  if (response.data && (response.data.totalCount !== undefined || response.data.totalPages !== undefined)) {
    return {
      ...normalized,
      totalCount: response.data.totalCount || response.data.totalRecords || 0,
      totalPages: response.data.totalPages || Math.ceil((response.data.totalCount || response.data.totalRecords || 0) / (params.pageSize || 10)),
    };
  }

  return normalized;
};

