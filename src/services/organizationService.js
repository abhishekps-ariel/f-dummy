import client from '../api/axiosInstance';
import { ORGANIZATION_ENDPOINTS } from '../constants/apiEndpoints';

export const getAllOrganizations = async () => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_ALL);

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organizations fetched successfully",
    data: response.data.data || response.data,
  };
};

export const searchOrganizations = async (query) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.SEARCH, {
    params: { query },
  });

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Search completed successfully",
    data: response.data.data || response.data,
  };
};

export const submitJoinRequest = async (organizationId) => {
  const response = await client.post(ORGANIZATION_ENDPOINTS.SUBMIT_JOIN_REQUEST, {
    organizationId
  });

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Join request submitted successfully",
    data: response.data.data || response.data,
  };
};

export const getUserJoinRequests = async () => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_MY_REQUESTS);

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Join requests fetched successfully",
    data: response.data.data || response.data,
  };
};

export const createOrganization = async (organizationData) => {
  const response = await client.post(ORGANIZATION_ENDPOINTS.CREATE, organizationData);

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organization created successfully",
    data: response.data.data || response.data,
  };
};

export const getOrganizationById = async (id) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_BY_ID(id));

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organization fetched successfully",
    data: response.data.data || response.data,
  };
};

export const updateOrganization = async (id, organizationData) => {
  const response = await client.put(ORGANIZATION_ENDPOINTS.UPDATE(id), {
    ...organizationData,
    id
  });

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organization updated successfully",
    data: response.data.data || response.data,
  };
};

export const deleteOrganization = async (id) => {
  const response = await client.delete(ORGANIZATION_ENDPOINTS.DELETE(id));

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organization deleted successfully",
    data: response.data.data || response.data,
  };
};

export const getJoinRequest = async (joinRequestId) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_JOIN_REQUEST(joinRequestId), {
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.status === 200,
    msg: "Join request fetched successfully",
    data: response.data, // This should contain the email
  };
};

export const bindUserToOrganization = async (joinRequestId, userId) => {
  const response = await client.post(
    ORGANIZATION_ENDPOINTS.BIND_USER_TO_ORGANIZATION,
    {
      joinRequestId,
      userId,
    },
    {
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

// Get all join requests for an organization (for org admins)
// If filters are provided, uses POST with server-side filtering, searching, and pagination
// If no filters, uses GET (for backward compatibility with context that needs all requests)
export const getAllOrganizationJoinRequests = async (
  organizationId,
  filters = null
) => {
  // If filters are provided, use the new POST endpoint with server-side filtering
  if (filters) {
    const {
      status = null,
      startDate = null,
      endDate = null,
      pageNumber = 0,
      pageSize = 10,
      searchTerm = "",
    } = filters;

    // Build request body
    // Note: API expects status: null for "all"
    // pageNumber is 1-based (not 0-based)
    // When no date filter, send default dates (old date to current date)
    const requestBody = {
      organizationId: organizationId || "",
      status: status !== null && status !== "all" ? parseInt(status) : null,
      pageNumber: pageNumber + 1, // Convert 0-based to 1-based
      pageSize,
      searchTerm: searchTerm || "",
    };

    // Always include date fields - use defaults if not provided
    if (startDate) {
      requestBody.startDate = startDate;
    } else {
      // Default to a very old date when no filter
      requestBody.startDate = new Date("2020-01-01T00:00:00.000Z").toISOString();
    }
    
    if (endDate) {
      requestBody.endDate = endDate;
    } else {
      // Default to current date when no filter
      requestBody.endDate = new Date().toISOString();
    }

    let response;
    try {
      response = await client.post(
        ORGANIZATION_ENDPOINTS.LIST_BY_ORGANIZATION,
        requestBody,
        {
          headers: {
            Accept: "text/plain",
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error in getAllOrganizationJoinRequests POST:", error);
      console.error("Request body:", JSON.stringify(requestBody, null, 2));
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw error;
    }

    // Handle paginated response structure
    let requestsData = [];
    let totalCount = 0;
    let totalPages = 0;

    if (response.data) {
      if (response.data.data) {
        // Check if it's a paginated response with items and totalCount
        if (response.data.data.items && Array.isArray(response.data.data.items)) {
          requestsData = response.data.data.items;
          totalCount = response.data.data.totalCount || response.data.data.items.length;
          totalPages = response.data.data.totalPages || Math.ceil(totalCount / pageSize);
        } else if (Array.isArray(response.data.data)) {
          // If it's just an array
          requestsData = response.data.data;
          totalCount = requestsData.length;
        }
      } else if (Array.isArray(response.data)) {
        requestsData = response.data;
        totalCount = requestsData.length;
      }
    }

    return {
      isSuccess: response.data?.success !== false,
      msg: response.data?.message || "Join requests fetched successfully",
      data: requestsData,
      pagination: {
        totalCount,
        totalPages,
        currentPage: pageNumber,
        pageSize,
      },
    };
  }

  // Backward compatibility: Use GET endpoint when no filters (for context that needs all requests)
  const response = await client.get(
    ORGANIZATION_ENDPOINTS.GET_ALL_REQUESTS(organizationId),
    {
      headers: {
        Accept: "text/plain",
      },
    }
  );

  // Handle the response structure - API might return single object or array
  let requestsData = null;
  if (response.data && response.data.data) {
    // If nested in data property
    requestsData = response.data.data;
  } else if (response.data) {
    // If directly in response.data
    requestsData = response.data;
  }

  // Ensure it's always an array
  if (requestsData && !Array.isArray(requestsData)) {
    // If it's a single object, wrap it in an array
    requestsData = [requestsData];
  } else if (!requestsData) {
    requestsData = [];
  }

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Join requests fetched successfully",
    data: requestsData,
  };
};

// Review/approve/deny a join request (for org admins)
export const reviewJoinRequest = async (requestId, status, adminComment = "") => {
  const response = await client.post(
    ORGANIZATION_ENDPOINTS.REVIEW_JOIN_REQUEST,
    {
      requestId,
      status,
      adminComment,
    },
    {
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Join request reviewed successfully",
    data: response.data.data || response.data,
  };
};