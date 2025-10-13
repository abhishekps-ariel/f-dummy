export const AUTH_ENDPOINTS = {
  CHECK_MFA: "/api/Auth/check-mfa",
  SEND_OTP: "/api/Auth/login/send-otp",
  VERIFY_OTP: "/api/Auth/login/verify-otp",
  LOGIN: "/api/Auth/login",
  LOGOUT: "/api/Auth/logout",
  REGISTER: "/api/Auth/register",
  VERIFY_EMAIL: (token) => `/api/Auth/verify-email?token=${token}`,
  RESEND_VERIFICATION: "/api/Auth/resend-verification",
  FORGOT_PASSWORD: "/api/Account/forget-password",
  CHECK_RESET_TOKEN: (userId) => `/api/Account/check-reset-token-expiry/${userId}`,
  RESET_PASSWORD: "/api/Account/reset-password",
};

export const ORGANIZATION_ENDPOINTS = {
  GET_ALL: "/Organization",
  GET_BY_ID: (id) => `/Organization/${id}`,
  SEARCH: "/Organization/search",
  CREATE: "/Organization/create-and-request-to-join",
  UPDATE: (id) => `/Organization/${id}`,
  DELETE: (id) => `/Organization/${id}`,
  SUBMIT_JOIN_REQUEST: "/api/OrganizationJoinRequest/request",
  GET_MY_REQUESTS: "/api/OrganizationJoinRequest/my-requests",
};

