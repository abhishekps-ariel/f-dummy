/**
 * User profile validation helpers for petitions
 */

import { getUserById, getSignatureById } from "../../services/authService";

/**
 * Validate user profile before creating a petition
 * Checks for required fields: filing entity type and signature
 * @param {Object} user - User object
 * @param {Function} t - Translation function
 * @returns {Promise<Object>} Validation result with isValid flag and errors object
 */
export const validateUserProfileForPetition = async (user, t) => {
  if (!user?.id) {
    return {
      isValid: false,
      errors: {
        missingFilingEntityType: false,
        missingSignature: false,
      },
      errorMessage: t("viewAllPetitions.userInfoNotFound"),
    };
  }

  try {
    // Load user profile
    const profileResponse = await getUserById(user.id);

    if (!profileResponse.isSuccess) {
      return {
        isValid: false,
        errors: {
          missingFilingEntityType: false,
          missingSignature: false,
        },
        errorMessage: t("viewAllPetitions.failedLoadProfile"),
      };
    }

    const userProfile = profileResponse.data;
    let hasErrors = false;
    const errors = {
      missingFilingEntityType: false,
      missingSignature: false,
    };

    // Check if filing entity type is set
    if (!userProfile.filingEntityTypeId) {
      errors.missingFilingEntityType = true;
      hasErrors = true;
    }

    // Check if signature is uploaded
    try {
      const signatureResponse = await getSignatureById(user.id);
      // Check for new format: signatureBase64 and signatureImageName
      // Also support old format: signatureUrl for backward compatibility
      if (
        !signatureResponse.isSuccess ||
        !signatureResponse.data ||
        (!signatureResponse.data.signatureImageName &&
          !signatureResponse.data.signatureUrl)
      ) {
        errors.missingSignature = true;
        hasErrors = true;
      }
    } catch (error) {
      errors.missingSignature = true;
      hasErrors = true;
    }

    return {
      isValid: !hasErrors,
      errors,
      errorMessage: hasErrors
        ? t("viewAllPetitions.profileValidationFailed")
        : null,
    };
  } catch (err) {
    return {
      isValid: false,
      errors: {
        missingFilingEntityType: false,
        missingSignature: false,
      },
      errorMessage: err?.message || t("viewAllPetitions.failedValidateProfile"),
    };
  }
};

