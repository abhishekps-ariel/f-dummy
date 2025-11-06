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

//get all join request
export const getAllOrganizationJoinRequests = async (payload) => {
  try {
    // POST request with payload directly
    const response = await client.post(
      "/api/OrganizationJoinRequest/list-by-organization",
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
 
    // Handle response structure - API might return nested or direct data
    let requestsData = null;
    if (response.data && response.data.data) {
      requestsData = response.data.data;
    } else if (response.data) {
      requestsData = response.data;
    }
 
    // Ensure result is always an array
    if (requestsData && !Array.isArray(requestsData)) {
      requestsData = [requestsData];
    } else if (!requestsData) {
      requestsData = [];
    }
 
    return {
      isSuccess: response.data?.success ?? true,
      msg: response.data?.message || "Join requests fetched successfully",
      data: requestsData,
    };
  } catch (error) {
    console.error("Error fetching organization join requests:", error);
 
    return {
      isSuccess: false,
      msg: error.response?.data?.message || "Failed to fetch join requests",
      data: [],
    };
  }
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