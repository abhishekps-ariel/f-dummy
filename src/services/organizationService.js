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

export const getUserJoinRequests = async () => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_MY_REQUESTS);

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Join requests fetched successfully",
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

export const getJoinRequest = async (joinRequestId) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_JOIN_REQUEST(joinRequestId), {
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.data?.success !== false && response.status === 200,
    msg: response.data?.message || "Join request fetched successfully",
    data: response.data?.data || response.data, // Contains request with userDetail
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
