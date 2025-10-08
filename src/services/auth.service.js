import axios from "axios";

// ========== Authentication APIs ==========

/**
 * LOGIN - Dummy implementation (waiting for real API)
 * TODO: Replace with real login API when backend provides endpoint
 * 
 * @param {Object} data - { email, password }
 * @returns {Promise} - success response to allow navigation to 2FA page
 */
export const login = async (data) => {
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { email } = data;
        
        // Dummy success response - allows testing the UI flow
        return {
            isSuccess: true,
            msg: "Login successful (dummy mode)",
            statusCode: 200,
            data: {
                token: "dummy-token",
                user: {
                    email: email,
                    firstName: "Test",
                    lastName: "User"
                }
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

/**
 * REGISTER - Real API integration ✅
 * Endpoint: POST https://filir.arielsoftwares.in/api/Auth/register
 * 
 * @param {Object} formData - { firstName, lastName, email, password, phoneNumber }
 * @returns {Promise} - { isSuccess, msg, data }
 */
export const register = async (formData) => {
  try {
    // backend expects these fields: firstName, lastName, email, password, role, phone
    const requestBody = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: "Normal User", 
      phone: formData.phoneNumber, // ensure +123456789 format
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

    // backend response schema: { success, message, data }
    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    // handle errors
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || "Registration failed");
    } else {
      throw new Error("Network error");
    }
  }
};

/**
 * VERIFY EMAIL - Real API integration ✅
 * Endpoint: GET https://filir.arielsoftwares.in/api/Auth/verify-email?token=<token>
 * 
 * @param {string} token - Verification token from URL query parameter
 * @returns {Promise} - { isSuccess, msg, data }
 */
export const verifyEmail = async (token) => {
  try {
    // Query parameter format: /verify-email?token={token}
    const response = await axios.get(
      `http://filir.arielsoftwares.in/api/Auth/verify-email?token=${token}`,
      {
        headers: {
          Accept: "text/plain",
        },
      }
    );

    // Debug: Log the response to see what we get
    console.log("Verify Email Response:", response.data);

    // backend response schema: { success, message, data }
    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    // Debug: Log the error to see what failed
    console.log("Verify Email Error:", error.response?.data);
    
    // handle errors - 400 status code with error message
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

/**
 * RESEND VERIFICATION EMAIL - Real API integration ✅
 * Endpoint: POST https://filir.arielsoftwares.in/api/Auth/resend-verification
 * 
 * @param {string} email - User's email address
 * @returns {Promise} - { isSuccess, msg, data }
 */
export const resendVerification = async (email) => {
  try {
    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/Auth/resend-verification",
      JSON.stringify(email), // Send email as JSON string in body
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      }
    );

    // backend response schema: { success, message, data }
    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    // handle errors
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
