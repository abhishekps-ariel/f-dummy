const API_URL = import.meta.env.VITE_API_URL;

export const AUTH_ENDPOINTS = {
  CHECK_MFA: `${API_URL}/api/Auth/check-mfa`,
  SEND_OTP: `${API_URL}/api/Auth/login/send-otp`,
  VERIFY_OTP: `${API_URL}/api/Auth/login/verify-otp`,
  LOGIN: `${API_URL}/api/Auth/login`,
  LOGOUT: `${API_URL}/api/Auth/logout`,
  REGISTER: `${API_URL}/api/Auth/register`,
  VERIFY_EMAIL: (token) => `${API_URL}/api/Auth/verify-email?token=${token}`,
  RESEND_VERIFICATION: `${API_URL}/api/Auth/resend-verification`,
};

export const ORGANIZATION_ENDPOINTS = {
  GET_ALL: `${API_URL}/Organization`,
  GET_BY_ID: (id) => `${API_URL}/Organization/${id}`,
  SEARCH: `${API_URL}/Organization/search`,
  CREATE: `${API_URL}/Organization/create-and-request-to-join`,
  UPDATE: (id) => `${API_URL}/Organization/${id}`,
  DELETE: (id) => `${API_URL}/Organization/${id}`,
  SUBMIT_JOIN_REQUEST: `${API_URL}/api/OrganizationJoinRequest/request`,
  GET_MY_REQUESTS: `${API_URL}/api/OrganizationJoinRequest/my-requests`,
};

