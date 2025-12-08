/**
 * Invite flow helpers for user registration
 */

import { getJoinRequest } from '../../services/organizationService';

/**
 * Fetch invite data from join request
 * @param {string} joinRequestId - Join request ID
 * @param {boolean} isAdminInvite - Whether this is an admin invite
 * @returns {Promise<Object>} Invite data with email, joinRequestId, and isAdminInvite
 */
export const fetchInviteData = async (joinRequestId, isAdminInvite) => {
  try {
    const response = await getJoinRequest(joinRequestId);

    if (response.isSuccess) {
      // Access email from the nested data structure
      const email = response.data.data?.email || response.data.email;

      if (email) {
        return {
          success: true,
          data: {
            joinRequestId,
            isAdminInvite,
            email: email,
          },
        };
      } else {
        return {
          success: false,
          error: "Email not found in invite data",
        };
      }
    } else {
      return {
        success: false,
        error: "Invalid or expired invite link",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: "Failed to load invite details. Please check your link and try again.",
    };
  }
};

