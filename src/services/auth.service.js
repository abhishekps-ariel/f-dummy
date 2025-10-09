import axios from "axios";

// Check MFA status for user
export const checkMfa = async (email, password) => {
  try {
    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/Auth/check-mfa",
      {
        email,
        password
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "MFA check failed",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Login user (when MFA not required)
export const login = async (email, password, rememberMe = true) => {
  try {
    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/Auth/login",
      {
        email,
        password,
        rememberMe
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Login failed",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Send OTP for MFA
export const sendOtp = async (email, password) => {
  try {
    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/Auth/login/send-otp",
      {
        email,
        password
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to send OTP",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Verify OTP for MFA
export const verifyOtp = async (email, otpCode) => {
  try {
    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/Auth/login/verify-otp",
      {
        email,
        otpCode
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "OTP verification failed",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Register new user
export const register = async (formData) => {
  try {
    const requestBody = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: "Normal User", 
      phone: formData.phoneNumber,
    };

    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/Auth/register",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || "Registration failed");
    } else {
      throw new Error("Network error");
    }
  }
};

// Verify email with token
export const verifyEmail = async (token) => {
  try {
    const response = await axios.get(
      `http://filir.arielsoftwares.in/api/Auth/verify-email?token=${token}`,
      {
        headers: { Accept: "text/plain" },
      }
    );

    console.log("Verify Email Response:", response.data);

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    console.log("Verify Email Error:", error.response?.data);
    
    if (error.response && error.response.data) {
      return {
        isSuccess: error.response.data.success || false,
        msg: error.response.data.message || "Verification failed",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Resend verification email
export const resendVerification = async (email) => {
  try {
    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/Auth/resend-verification",
      JSON.stringify(email),
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to resend verification email",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Helper function to store auth data in localStorage
export const storeAuthData = (authData) => {
  const { token, refreshToken, user } = authData;
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

// Helper function to get auth data from localStorage
export const getAuthData = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  return { token, refreshToken, user };
};

// Helper function to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};