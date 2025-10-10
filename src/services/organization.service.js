import axios from "axios";

const BASE_URL = "http://filir.arielsoftwares.in/Organization";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Get all organizations
export const getAllOrganizations = async () => {
  try {
    const response = await axios.get(BASE_URL, {
      headers: getAuthHeaders(),
    });

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Organizations fetched successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to fetch organizations",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Search organizations by query
export const searchOrganizations = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: { query },
      headers: getAuthHeaders(),
    });

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Search completed successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Search failed",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Submit join request for an organization
export const submitJoinRequest = async (organizationId) => {
  try {
    const response = await axios.post(
      "http://filir.arielsoftwares.in/api/OrganizationJoinRequest/request",
      { organizationId },
      {
        headers: getAuthHeaders(),
      }
    );

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Join request submitted successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to submit join request",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Get user's join requests
export const getUserJoinRequests = async () => {
  try {
    const response = await axios.get(
      "http://filir.arielsoftwares.in/api/OrganizationJoinRequest/my-requests",
      {
        headers: getAuthHeaders(),
      }
    );

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Join requests fetched successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to fetch join requests",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

// Create organization (for future use)
export const createOrganization = async (organizationData) => {
  try {
    const response = await axios.post(BASE_URL, organizationData, {
      headers: getAuthHeaders(),
    });

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Organization created successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to create organization",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        msg: "Network error. Please try again.",
        data: null,
      };
    }
  }
};

