export const AUTH_ENDPOINTS = {
  CHECK_MFA: "/api/Auth/check-mfa",
  SEND_OTP: "/api/Auth/login/send-otp",
  VERIFY_OTP: "/api/Auth/login/verify-otp",
  LOGIN: "/api/Auth/login",
  LOGOUT: "/api/Auth/logout",
  REFRESH_TOKEN: "/api/Auth/refresh-token",
  REGISTER: "/api/Registration/register",
  VERIFY_EMAIL: (token) => `/api/Registration/verify-email?token=${token}`,
  RESEND_VERIFICATION: "/api/Registration/resend-verification",
  FORGOT_PASSWORD: "/api/Password/forgot-password",
  CHECK_RESET_TOKEN: (userId) => `/api/Password/check-reset-token-expiry/${userId}`,
  RESET_PASSWORD: "/api/Password/reset-password",
  UPDATE_USER: "/api/Account/update-user",
  GET_USER_BY_ID: (userId) => `/api/Account/get-user-by-id/${userId}`,
  UPLOAD_USER_SIGNATURE: "/api/Account/upload-user-signature",
  GET_SIGNATURE_BY_ID: (userId) => `/api/Account/get-signature-by-id/${userId}`,
  GET_BASE64_BY_S3KEY: "/api/Account/get-base64-by-s3key",
  SEND_SIGNATURE_OTP: "/api/Account/send-signature-otp",
  VERIFY_SIGNATURE_OTP: "/api/Account/verify-signature-otp",
  // Impersonation
  IMPERSONATE_BY_USER_ID: (userId) => `/api/Impersonation/impersonate/${userId}`,
  EXIT_IMPERSONATION: "/apiImpersonation/exit-impersonation",
  MANAGER_IMPERSONATE: (managerUserId, userId) => `/api/Impersonation/managers/${managerUserId}/impersonate/${userId}`,
};

export const ORGANIZATION_ENDPOINTS = {
  GET_ALL: "/Organization",
  GET_BY_ID: (id) => `/Organization/${id}`,
  SEARCH: "/Organization/search",
  GET_MY_REQUESTS: "/api/OrganizationJoinRequest/my-requests",
  GET_JOIN_REQUEST: (joinRequestId) => `/api/OrganizationJoinRequest/join-request/${joinRequestId}`,
  BIND_USER_TO_ORGANIZATION: "/api/OrganizationJoinRequest/bind-user-to-organization",
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
  GET_MFA_TYPES_ENUM: "/Common/mfa-types-enum",
  GET_35B_REPORTING_PERIOD: "/Common/get-35b-reporting-period",
  GET_35B_ENTITY_TYPE: "/Common/get-35b-entitytype",
  GET_EMAIL_TYPES_ENUM: "/Common/email-types-enum",
  GET_ALL_MUNICIPALITIES: "/Common/get-all-municipalities",
};

export const NOTIFICATION_ENDPOINTS = {
  GET_PAGED_LIST: "/api/EmaiLHistory/paged-list",
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
  UPDATE_PROPERTY: "/api/Petition/add-update-property",
  UPDATE_LOAN: "/api/Petition/add-update-loan",
  UPDATE_FILING_ENTITY: "/api/Petition/add-update-filingEntity",
  UPDATE_BORROWERS: "/api/Petition/add-update-borrower",
  UPDATE_AFFIDAVIT: "/api/Petition/add-update-affidavit",
  UPDATE_RIGHT_TO_CURE: "/api/Petition/add-update-righttoCure",
  UPDATE_LOAN_ASSIGNEES: "/api/Petition/add-update-loanAssignee",
  UPDATE_SIGNATURES: "/api/Petition/add-update-signature",
  UPDATE_FORECLOSURE: "/api/Petition/add-update-foreclosure",
  UPDATE_JUDGMENT: "/api/Petition/add-update-judgement",
  UPDATE_STATUS: "/api/Petition/updateStatus",
};

export const CHAT_ENDPOINTS = {
  SEND_MESSAGE: "/api/Chat/send-message",
  GET_MESSAGES: "/api/Chat/get-messages",
  GET_CHAT_LIST: (userId) => `/api/Chat/get-chat-list/${userId}`,
  GET_CHAT_USER_LIST: (userId, searchText) => `/api/Chat/get-chat-user-list?userId=${userId}&searchText=${encodeURIComponent(searchText || '')}`,
  SIGNALR_HUB_URL: "/hubs/realtime-chat",
  MARK_AS_READ: (chatId, userId) => `/api/Chat/mark-as-read?chatId=${chatId}&userId=${userId}`,
};

export const FORM35B_ENDPOINTS = {
  CALCULATE: "/api/Report35B/35b/calculate",
  ADD_UPDATE: "/api/Report35B/add-update",
  PAGED: "/api/Report35B/paged",
};

export const GOOGLE_ENDPOINTS = {
  TRANSLATE: "/api/Google/translate",
  AUTOCOMPLETE: "/api/Google/autocomplete",
  PLACE_DETAILS: "/api/Google/place-details",
  GEOCODE: "/api/Google/geocode",
};

