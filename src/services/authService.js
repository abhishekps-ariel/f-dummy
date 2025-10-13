import client from "../api/client";
import { AUTH_ENDPOINTS } from "../constants/apiEndpoints";

// Check MFA status for user
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

// Login user (when MFA not required)
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

// Send OTP for MFA
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

// Verify OTP for MFA
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

// Register new user
export const register = async (formData) => {
  const requestBody = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    password: formData.password,
    role: "Normal User",
    phone: formData.phoneNumber,
  };

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

// Verify email with token
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

// Resend verification email
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
