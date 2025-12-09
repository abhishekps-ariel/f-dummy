// Date utility functions

/**
 * Format date string
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date and time string
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Get from date based on date filter
 * @param {string} dateFilter - Date filter type ('today', 'week', 'month', 'custom')
 * @param {string} customDateFrom - Custom from date (for 'custom' filter)
 * @returns {string} ISO date string
 */
export const getFromDate = (dateFilter, customDateFrom) => {
  if (dateFilter === "custom" && customDateFrom) {
    return new Date(customDateFrom).toISOString();
  }
  if (dateFilter === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }
  if (dateFilter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return weekAgo.toISOString();
  }
  if (dateFilter === "month") {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return monthAgo.toISOString();
  }
  return new Date("2020-01-01").toISOString(); // Default to a very old date
};

/**
 * Get to date based on date filter
 * @param {string} dateFilter - Date filter type ('today', 'week', 'month', 'custom')
 * @param {string} customDateTo - Custom to date (for 'custom' filter)
 * @returns {string} ISO date string
 */
export const getToDate = (dateFilter, customDateTo) => {
  if (dateFilter === "custom" && customDateTo) {
    const toDate = new Date(customDateTo);
    toDate.setHours(23, 59, 59, 999);
    return toDate.toISOString();
  }
  return new Date().toISOString();
};

/**
 * Format date for input field (YYYY-MM-DD format)
 * Converts ISO date string or Date object to YYYY-MM-DD format for HTML date inputs
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Date string in YYYY-MM-DD format, or empty string if invalid
 */
export const formatDateForInput = (date) => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "";
    }
    
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // If it's an ISO string, extract the date part
    if (typeof date === 'string' && date.includes('T')) {
      return date.split('T')[0];
    }
    
    // Format Date object to YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

/**
 * Parse date from input field (YYYY-MM-DD format)
 * Converts YYYY-MM-DD string to Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseDateFromInput = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  // Check if it's in YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
    return null;
  }
  
  const date = new Date(dateString + 'T00:00:00');
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};

/**
 * Check if a date is in the past
 * @param {string|Date} date - Date string or Date object
 * @returns {boolean} True if date is in the past, false otherwise
 */
export const isDateInPast = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseDateFromInput(date) : date;
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate < today;
  } catch {
    return false;
  }
};

/**
 * Format date for display with custom format
 * @param {string|Date} date - Date string or Date object
 * @param {string} format - Format type ('short', 'long', 'medium', 'full') or custom format string
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date, format = 'medium') => {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }
    
    const formatOptions = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    };
    
    const options = formatOptions[format] || formatOptions.medium;
    
    return dateObj.toLocaleDateString("en-US", options);
  } catch {
    return "N/A";
  }
};

/**
 * Normalize date for API submission
 * Ensures date is in ISO format for API
 * @param {string|Date} date - Date string or Date object
 * @returns {string|null} ISO date string or null if invalid
 */
export const normalizeDateForAPI = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseDateFromInput(date) : date;
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return null;
    }
    
    // If it's already an ISO string, return as is
    if (typeof date === 'string' && date.includes('T')) {
      return date;
    }
    
    // Convert to ISO string
    return dateObj.toISOString();
  } catch {
    return null;
  }
};