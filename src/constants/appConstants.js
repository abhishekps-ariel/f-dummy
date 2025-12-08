/**
 * Application-wide constants
 * Centralizes magic numbers and strings for better maintainability
 */

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

export const RETRY = {
  DEFAULT_RETRIES: 3,
  DEFAULT_DELAY: 1000,
};

export const INTERVALS = {
  MESSAGE_REFRESH: 30000, // 30 seconds
  UNREAD_COUNT_CHECK: 2000, // 2 seconds
  TOKEN_REFRESH_CHECK: 300000, // 5 minutes
};

export const DEBOUNCE = {
  SEARCH: 300,
  FORM_CALCULATION: 500,
  ORGANIZATION_SEARCH: 300,
  ADDRESS_AUTOCOMPLETE: 250,
};

export const TIMEOUTS = {
  AUTO_SAVE_DELAY: 2000, // 2 seconds
  TOAST_DURATION: 3000, // 3 seconds
  ERROR_RELOAD_DELAY: 2000, // 2 seconds for error boundary reload
  CHUNK_ERROR_RELOAD: 1500, // 1.5 seconds for chunk load error reload
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  ACTIVE_ORGANIZATION: 'activeOrganizationId',
  PETITION_TABS: 'petitionTabs',
  ACTIVE_PETITION_TAB: 'activePetitionTab',
  PETITION_FORM_DATA: 'petitionFormData',
  PETITION_DRAFTS: 'petitionDrafts',
  MESSAGES_UNREAD_COUNT: 'messagesUnreadCount',
  HIGH_CONTRAST_MODE: 'highContrastMode',
  ACCESSIBILITY_TEXT_SIZE: 'accessibilityTextSize',
  ACCESSIBILITY_FONT_SIZE: 'accessibilityFontSize',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
};

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SIGNATURE_SIZE: 2 * 1024 * 1024, // 2MB
};

export const TOKEN = {
  EXPIRY_BUFFER: 300, // 5 minutes before actual expiry
};

