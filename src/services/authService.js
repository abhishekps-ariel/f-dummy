import client from "../api/axiosInstance";
import { AUTH_ENDPOINTS } from "../constants/apiEndpoints";

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

export const login = async (email, password, rememberMe = true) => {
  const response = await client.post(
    AUTH_ENDPOINTS.LOGIN,
    {
      email,
      password,
      rememberMe,
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

export const verifyOtp = async (email, otpCode) => {
  const response = await client.post(
    AUTH_ENDPOINTS.VERIFY_OTP,
    {
      email,
      otpCode,
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

export const register = async (formData, inviteData = null) => {
  const requestBody = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    password: formData.password,
    role: "Normal User",
    phone: formData.phoneNumber,
  };

  // Add invite-related parameters if provided
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

  console.log("Verify Email Response:", response.data);

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

export const updateUser = async (userId, filingEntityTypeId, firstName, lastName) => {
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