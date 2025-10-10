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

// Organization endpoints
export const ORGANIZATION_ENDPOINTS = {
  // Organization CRUD
  GET_ALL: `${API_URL}/Organization`,
  GET_BY_ID: (id) => `${API_URL}/Organization/${id}`,
  SEARCH: `${API_URL}/Organization/search`,
  CREATE: `${API_URL}/Organization/create-and-request-to-join`,
  UPDATE: (id) => `${API_URL}/Organization/${id}`,
  DELETE: (id) => `${API_URL}/Organization/${id}`,
  
  // Join requests
  SUBMIT_JOIN_REQUEST: `${API_URL}/api/OrganizationJoinRequest/request`,
  GET_MY_REQUESTS: `${API_URL}/api/OrganizationJoinRequest/my-requests`,
};

