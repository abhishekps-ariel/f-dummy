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
