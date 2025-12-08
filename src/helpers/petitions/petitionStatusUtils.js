/**
 * Petition status utilities
 */

/**
 * Get status value from status filter string
 * @param {string} status - Status filter string (e.g., "all", "draft", "submitted")
 * @returns {number|null} Status value for API or null
 */
export const getStatusValue = (status) => {
  const statusMap = {
    all: null,
    draft: 0,
    submitted: 1,
    resubmitted: 3,
    accepted: 4,
    returned: 2,
    closed: 5,
    judgmentSubmitted: 3,
    foreclosureSaleInitiated: 2,
  };
  return statusMap[status] !== undefined ? statusMap[status] : null;
};

/**
 * Get CSS class for status badge
 * @param {string} status - Status text
 * @param {string} statusClass - Status class from API (optional)
 * @returns {string} CSS class for status badge
 */
export const getStatusBadgeClass = (status, statusClass) => {
  // Use the statusClass from API if available, otherwise fallback to status text
  if (statusClass) {
    return `status-badge status-${statusClass}`;
  }

  switch (status.toLowerCase()) {
    case "accepted":
      return "status-badge status-accepted";
    case "submitted":
      return "status-badge status-submitted";
    case "resubmitted":
      return "status-badge status-submitted";
    case "returned":
      return "status-badge status-returned";
    case "draft":
      return "status-badge status-draft";
    case "under review":
      return "status-badge status-under-review";
    case "rejected":
      return "status-badge status-rejected";
    case "closed":
      return "status-badge status-closed";
    default:
      return "status-badge";
  }
};

/**
 * Map frontend sort fields to API sort columns
 * @param {string} sortBy - Frontend sort field (e.g., "filingDate", "lastUpdated")
 * @returns {string} API sort column name
 */
export const getSortColumn = (sortBy) => {
  const sortColumnMap = {
    filingDate: "CreatedDate", // filingDate maps to CreatedDate
    lastUpdated: "ModifiedDate", // lastUpdated maps to ModifiedDate
    petitionNumber: "PetitionNumber", // petitionNumber maps to PetitionNumber
  };
  return sortColumnMap[sortBy] || "ModifiedDate"; // Default to ModifiedDate
};

