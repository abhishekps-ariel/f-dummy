import client from "../api/axiosInstance";
import { AUTH_ENDPOINTS } from "../constants/apiEndpoints";
import {
  storeAuthData,
  clearAuthData,
  setImpersonationState,
} from "../utils/storage";
import { SERVICE_HEADERS, normalizeResponse } from "../utils/serviceUtils";

export const checkMfa = async (email, password) => {
  const response = await client.post(
    AUTH_ENDPOINTS.CHECK_MFA,
    {
      email,
      password,
    },
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "MFA check completed");
};

export const login = async (email, password, rememberMe = true, isManager = false) => {
  const requestBody = {
    email,
    password,
    rememberMe,
  };

  // Add isManager flag for org admin login
  if (isManager) {
    requestBody.isManager = true;
  }

  const response = await client.post(
    AUTH_ENDPOINTS.LOGIN,
    requestBody,
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "Login successful");
};

export const sendOtp = async (email, password, mfaType = "None") => {
  const response = await client.post(
    AUTH_ENDPOINTS.SEND_OTP,
    {
      email,
      password,
      mfaType,
    },
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "OTP sent successfully");
};

export const verifyOtp = async (email, otpCode, isManager = false) => {
  const requestBody = {
    email,
    otpCode,
  };

  // Add isManager flag for org admin login
  if (isManager) {
    requestBody.isManager = true;
  }

  const response = await client.post(
    AUTH_ENDPOINTS.VERIFY_OTP,
    requestBody,
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "OTP verified successfully");
};

export const register = async (formData, inviteData = null, role = null, organizationId = null) => {
  // Map role values to backend expected values
  let roleValue = "Normal User"; // Default
  if (role === "orgAdmin") {
    roleValue = "Organization Admin";
  } else if (role === "filer") {
    roleValue = "Filer";
  }

  const requestBody = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    password: formData.password,
    role: roleValue,
    phone: formData.phoneNumber,
  };

  // Add organizationId if provided (for org admin registration)
  if (organizationId) {
    requestBody.organizationId = organizationId;
  }

  // Add invite-related parameters if provided
  // Note: Do not send joinRequestId for org admin registration
  if (inviteData) {
    requestBody.joinRequestId = inviteData.joinRequestId;
    requestBody.isAdminInvite = inviteData.isAdminInvite;
  }

  const response = await client.post(AUTH_ENDPOINTS.REGISTER, requestBody, {
    headers: SERVICE_HEADERS.TEXT_PLAIN,
  });

  return normalizeResponse(response, "Registration successful");
};

export const verifyEmail = async (token) => {
  const response = await client.get(AUTH_ENDPOINTS.VERIFY_EMAIL(token), {
    headers: SERVICE_HEADERS.TEXT_PLAIN,
  });

  return normalizeResponse(response, "Email verified successfully");
};

export const resendVerification = async (email) => {
  const response = await client.post(
    AUTH_ENDPOINTS.RESEND_VERIFICATION,
    JSON.stringify(email),
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "Verification email sent successfully");
};

export const refreshToken = async (refreshToken) => {
  const response = await client.post(
    AUTH_ENDPOINTS.REFRESH_TOKEN,
    {
      refreshToken: refreshToken,
    },
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "Token refreshed successfully");
};

export const logout = async (refreshToken) => {
  const response = await client.post(
    AUTH_ENDPOINTS.LOGOUT,
    {
      refreshToken: refreshToken,
    },
    {
      headers: SERVICE_HEADERS.JSON_WILDCARD,
    }
  );

  return normalizeResponse(response, "Logged out successfully");
};

export const forgotPassword = async (email) => {
  const response = await client.post(
    AUTH_ENDPOINTS.FORGOT_PASSWORD,
    email, // Send as plain string
    {
      headers: SERVICE_HEADERS.JSON_WILDCARD,
    }
  );

  return normalizeResponse(response, "Password reset email sent successfully");
};

export const checkResetToken = async (userId) => {
  const response = await client.get(AUTH_ENDPOINTS.CHECK_RESET_TOKEN(userId), {
    headers: SERVICE_HEADERS.TEXT_PLAIN,
  });

  return normalizeResponse(response, "Reset token validated successfully");
};

export const resetPassword = async (userId, password, token) => {
  const response = await client.post(
    AUTH_ENDPOINTS.RESET_PASSWORD,
    {
      userId: userId,
      password: password,
      token: token,
    },
    {
      headers: SERVICE_HEADERS.JSON_WILDCARD,
    }
  );

  return normalizeResponse(response, "Password reset successfully");
};

export const updateUser = async (
  userId,
  filingEntityTypeId,
  firstName,
  lastName
) => {
  const response = await client.post(
    AUTH_ENDPOINTS.UPDATE_USER,
    {
      id: userId,
      filingEntityTypeId,
      firstName,
      lastName,
    },
    {
      headers: SERVICE_HEADERS.JSON_WILDCARD,
    }
  );

  return normalizeResponse(response, "User updated successfully");
};

export const getUserById = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.GET_USER_BY_ID(userId),
    {}, // Empty body as per API spec
    {
      headers: SERVICE_HEADERS.JSON_WILDCARD,
    }
  );

  return normalizeResponse(response, "User fetched successfully");
};

export const uploadUserSignature = async (userId, signatureFile) => {
  const formData = new FormData();
  formData.append("UserId", userId);
  formData.append("File", signatureFile);

  const response = await client.post(
    AUTH_ENDPOINTS.UPLOAD_USER_SIGNATURE,
    formData,
    {
      headers: {
        Accept: "text/plain",
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return normalizeResponse(response, "Signature uploaded successfully");
};

export const getSignatureById = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.GET_SIGNATURE_BY_ID(userId),
    {},
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "Signature fetched successfully");
};

export const getBase64ByS3Key = async (s3Key) => {
  const response = await client.post(
    AUTH_ENDPOINTS.GET_BASE64_BY_S3KEY,
    {
      s3Key: s3Key,
    },
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "Base64 data fetched successfully");
};

export const sendSignatureOtp = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.SEND_SIGNATURE_OTP,
    {
      userId: userId,
    },
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "Signature OTP sent successfully");
};

export const verifySignatureOtp = async (userId, otpCode) => {
  const response = await client.post(
    AUTH_ENDPOINTS.VERIFY_SIGNATURE_OTP,
    {
      userId: userId,
      otpCode: otpCode,
    },
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "Signature OTP verified successfully");
};

// Impersonation APIs
export const impersonateByUserId = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.IMPERSONATE_BY_USER_ID(userId),
    "",
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "Impersonation started successfully");
};

export const managerImpersonate = async (managerUserId, userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.MANAGER_IMPERSONATE(managerUserId, userId),
    "",
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "Manager impersonation started successfully");
};

export const exitImpersonation = async () => {
  const response = await client.post(AUTH_ENDPOINTS.EXIT_IMPERSONATION, "", {
    headers: SERVICE_HEADERS.TEXT_PLAIN,
  });

  return normalizeResponse(response, "Impersonation exited successfully");
};

export const performExitImpersonation = async () => {
  // Hit API to end server-side impersonation session, but do not restore manager session locally
  try {
    await exitImpersonation();
  } catch {
    // ignore errors; still proceed to clear local state for safety
  }
  try {
    setImpersonationState(false);
  } catch {}
  try {
    clearAuthData();
  } catch {}
  return { isSuccess: true };
};

