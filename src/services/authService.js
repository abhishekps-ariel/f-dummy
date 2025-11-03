import client from "../api/axiosInstance";
import { AUTH_ENDPOINTS } from "../constants/apiEndpoints";
import {
  storeAuthData,
  clearAuthData,
  setImpersonationState,
} from "../utils/storage";

export const checkMfa = async (email, password) => {
  const response = await client.post(
    AUTH_ENDPOINTS.CHECK_MFA,
    {
      email,
      password,
    },
    {
      headers: {
        Accept: "text/plain",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
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
      headers: {
        Accept: "text/plain",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const sendOtp = async (email, password) => {
  const response = await client.post(
    AUTH_ENDPOINTS.SEND_OTP,
    {
      email,
      password,
    },
    {
      headers: {
        Accept: "text/plain",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
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
      headers: {
        Accept: "text/plain",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const register = async (formData, inviteData = null, role = null, organizationId = null) => {
  // Map role values to backend expected values
  let roleValue = "Normal User"; // Default
  if (role === "orgAdmin") {
    roleValue = "Organisation Admin";
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
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const verifyEmail = async (token) => {
  const response = await client.get(AUTH_ENDPOINTS.VERIFY_EMAIL(token), {
    headers: { Accept: "text/plain" },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const resendVerification = async (email) => {
  const response = await client.post(
    AUTH_ENDPOINTS.RESEND_VERIFICATION,
    JSON.stringify(email),
    {
      headers: {
        Accept: "text/plain",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const refreshToken = async (refreshToken) => {
  const response = await client.post(
    AUTH_ENDPOINTS.REFRESH_TOKEN,
    {
      refreshToken: refreshToken,
    },
    {
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const logout = async (refreshToken) => {
  const response = await client.post(
    AUTH_ENDPOINTS.LOGOUT,
    {
      refreshToken: refreshToken,
    },
    {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const forgotPassword = async (email) => {
  const response = await client.post(
    AUTH_ENDPOINTS.FORGOT_PASSWORD,
    email, // Send as plain string
    {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const checkResetToken = async (userId) => {
  const response = await client.get(AUTH_ENDPOINTS.CHECK_RESET_TOKEN(userId), {
    headers: {
      Accept: "*/*",
    },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
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
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
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
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const getUserById = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.GET_USER_BY_ID(userId),
    {}, // Empty body as per API spec
    {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
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

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const getSignatureById = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.GET_SIGNATURE_BY_ID(userId),
    {},
    {
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const sendSignatureOtp = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.SEND_SIGNATURE_OTP,
    {
      userId: userId,
    },
    {
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const verifySignatureOtp = async (userId, otpCode) => {
  const response = await client.post(
    AUTH_ENDPOINTS.VERIFY_SIGNATURE_OTP,
    {
      userId: userId,
      otpCode: otpCode,
    },
    {
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

// Impersonation APIs
export const impersonateByUserId = async (userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.IMPERSONATE_BY_USER_ID(userId),
    "",
    {
      headers: {
        Accept: "text/plain",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const managerImpersonate = async (managerUserId, userId) => {
  const response = await client.post(
    AUTH_ENDPOINTS.MANAGER_IMPERSONATE(managerUserId, userId),
    "",
    {
      headers: {
        Accept: "text/plain",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const exitImpersonation = async () => {
  const response = await client.post(AUTH_ENDPOINTS.EXIT_IMPERSONATION, "", {
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const performExitImpersonation = async () => {
  // Hit API to end server-side impersonation session, but do not restore manager session locally
  try {
    await exitImpersonation();
  } catch (e) {
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
