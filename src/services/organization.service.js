import axios from "axios";
import { ORGANIZATION_ENDPOINTS } from "../constants/apiEndpoints";

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
    const response = await axios.get(ORGANIZATION_ENDPOINTS.GET_ALL, {
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
    const response = await axios.get(ORGANIZATION_ENDPOINTS.SEARCH, {
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
      ORGANIZATION_ENDPOINTS.SUBMIT_JOIN_REQUEST,
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
      ORGANIZATION_ENDPOINTS.GET_MY_REQUESTS,
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

// Create organization and automatically send join request
export const createOrganization = async (organizationData) => {
  try {
    const response = await axios.post(ORGANIZATION_ENDPOINTS.CREATE, organizationData, {
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

// Get organization by ID
export const getOrganizationById = async (id) => {
  try {
    const response = await axios.get(ORGANIZATION_ENDPOINTS.GET_BY_ID(id), {
      headers: getAuthHeaders(),
    });

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Organization fetched successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to fetch organization",
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

// Update organization
export const updateOrganization = async (id, organizationData) => {
  try {
    const response = await axios.put(
      ORGANIZATION_ENDPOINTS.UPDATE(id),
      { ...organizationData, id },
      {
        headers: getAuthHeaders(),
      }
    );

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Organization updated successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to update organization",
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

// Delete organization
export const deleteOrganization = async (id) => {
  try {
    const response = await axios.delete(ORGANIZATION_ENDPOINTS.DELETE(id), {
      headers: getAuthHeaders(),
    });

    return {
      isSuccess: response.data.success || true,
      msg: response.data.message || "Organization deleted successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isSuccess: false,
        msg: error.response.data.message || "Failed to delete organization",
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

