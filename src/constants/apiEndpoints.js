// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  // MFA endpoints
  CHECK_MFA: `${API_URL}/api/Auth/check-mfa`,
  SEND_OTP: `${API_URL}/api/Auth/login/send-otp`,
  VERIFY_OTP: `${API_URL}/api/Auth/login/verify-otp`,
  
  // Login & Registration
  LOGIN: `${API_URL}/api/Auth/login`,
  REGISTER: `${API_URL}/api/Auth/register`,
  
  // Email verification
  VERIFY_EMAIL: (token) => `${API_URL}/api/Auth/verify-email?token=${token}`,
  RESEND_VERIFICATION: `${API_URL}/api/Auth/resend-verification`,
};

