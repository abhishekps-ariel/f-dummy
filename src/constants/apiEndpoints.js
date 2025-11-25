export const AUTH_ENDPOINTS = {
  CHECK_MFA: "/api/Auth/check-mfa",
  SEND_OTP: "/api/Auth/login/send-otp",
  VERIFY_OTP: "/api/Auth/login/verify-otp",
  LOGIN: "/api/Auth/login",
  LOGOUT: "/api/Auth/logout",
  REFRESH_TOKEN: "/api/Auth/refresh-token",
  REGISTER: "/api/Auth/register",
  VERIFY_EMAIL: (token) => `/api/Auth/verify-email?token=${token}`,
  RESEND_VERIFICATION: "/api/Auth/resend-verification",
  FORGOT_PASSWORD: "/api/Account/forget-password",
  CHECK_RESET_TOKEN: (userId) => `/api/Account/check-reset-token-expiry/${userId}`,
  RESET_PASSWORD: "/api/Account/reset-password",
  UPDATE_USER: "/api/Account/update-user",
  GET_USER_BY_ID: (userId) => `/api/Account/get-user-by-id/${userId}`,
  UPLOAD_USER_SIGNATURE: "/api/Account/upload-user-signature",
  GET_SIGNATURE_BY_ID: (userId) => `/api/Account/get-signature-by-id/${userId}`,
  SEND_SIGNATURE_OTP: "/api/Account/send-signature-otp",
  VERIFY_SIGNATURE_OTP: "/api/Account/verify-signature-otp",
  ORGANISATION_USERS_API: "/api/Account/list",
  // Impersonation
  IMPERSONATE_BY_USER_ID: (userId) => `/api/Auth/impersonate/${userId}`,
  EXIT_IMPERSONATION: "/api/Auth/exit-impersonation",
  MANAGER_IMPERSONATE: (managerUserId, userId) => `/api/Auth/managers/${managerUserId}/impersonate/${userId}`,
};

export const ORGANIZATION_ENDPOINTS = {
  GET_ALL: "/Organization",
  GET_BY_ID: (id) => `/Organization/${id}`,
  GET_BY_USER: (userId) => `/Organization/get-organizations-by-user/${userId}`,
  SEARCH: "/Organization/search",
  CREATE: "/Organization/create-and-request-to-join",
  UPDATE: (id) => `/Organization/${id}`,
  DELETE: (id) => `/Organization/${id}`,
  SUBMIT_JOIN_REQUEST: "/api/OrganizationJoinRequest/request",
  GET_MY_REQUESTS: "/api/OrganizationJoinRequest/my-requests",
  GET_JOIN_REQUEST: (joinRequestId) => `/api/OrganizationJoinRequest/join-request/${joinRequestId}`,
  GET_ALL_REQUESTS: (organizationId) => `/api/OrganizationJoinRequest/by-organization/${organizationId}`, // GET by organizationId (deprecated, use LIST_BY_ORGANIZATION)
  LIST_BY_ORGANIZATION: "/api/OrganizationJoinRequest/list-by-organization", // POST with filters and pagination
  REVIEW_JOIN_REQUEST: "/api/OrganizationJoinRequest/review", // POST with requestId, status, adminComment
};

export const COMMON_ENDPOINTS = {
  GET_FILING_ENTITY_TYPES: "/Common/get-filing-entity-types",
  GET_PETITION_ENUMS: "/Common/petition-enums",
  GET_PETITION_LOAN_TYPES: "/Common/get-petition-loan-types",
  GET_PETITION_ASSIGNEE_TYPES: "/Common/get-petition-assignee-types",
  GET_PETITION_ASSIGNEE_ROLES: "/Common/get-petition-assignee-roles",
  GET_BUYER_TYPES: "/Common/get-buyer-type",
  GET_LENDER_TYPES: "/Common/get-lender-type",
  GET_FAQ_CATEGORIES: "/Common/get-faq-category",
  GET_JOIN_REQUEST_STATUS_ENUM: "/Common/join-request-status-enum",
  GET_MFA_TYPES_ENUM: "/Common/mfa-types-enum",
};

export const FAQ_ENDPOINTS = {
  GET_QUESTIONS_BY_CATEGORY: "/Faq/questions-by-category",
};

export const PETITION_ENDPOINTS = {
  SUBMIT_PETITION: "/api/Petition/submit",
  GET_PETITIONS_PAGED: "/api/Petition/paged",
  GET_PETITION_COUNT: "/api/Petition/count",
  GET_PETITION_BY_ID: (petitionId) => `/api/Petition/${petitionId}`,
  DELETE_PETITION_BY_ID: (petitionId) => `/api/Petition/${petitionId}`,
  GET_PUBLIC_PETITIONS_PAGED: "/api/Petition/public/petitions/paged",
  SUBMIT_NOTE: "/api/Petition/add-update-note",
};

export const CHAT_ENDPOINTS = {
  SEND_MESSAGE: "/api/Chat/send-message",
  GET_MESSAGES: "/api/Chat/get-messages",
  GET_CHAT_LIST: (userId) => `/api/Chat/get-chat-list/${userId}`,
  GET_CHAT_USER_LIST: (userId, searchText) => `/api/Chat/get-chat-user-list?userId=${userId}&searchText=${encodeURIComponent(searchText || '')}`,
  SIGNALR_HUB_URL: "/hubs/realtime-chat",
  MARK_AS_READ: (chatId, userId) => `/api/Chat/mark-as-read?chatId=${chatId}&userId=${userId}`,
};

