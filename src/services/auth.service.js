import axios from "axios";

// Dummy login - TODO: Replace with real API
export const login = async (data) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { email } = data;
        
        return {
            isSuccess: true,
            msg: "Login successful (dummy mode)",
            statusCode: 200,
            data: {
                token: "dummy-token",
                user: { email, firstName: "Test", lastName: "User" }
            }
        };
    } catch {
        return {
            isSuccess: false,
            msg: "Login failed. Please try again.",
            statusCode: 500,
            data: null
        };
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
