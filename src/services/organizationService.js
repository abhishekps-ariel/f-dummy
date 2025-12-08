import client from '../api/axiosInstance';
import { ORGANIZATION_ENDPOINTS } from '../constants/apiEndpoints';
import { SERVICE_HEADERS, normalizeResponse } from '../utils/serviceUtils';

export const getAllOrganizations = async () => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_ALL);

  return normalizeResponse(response, "Organizations fetched successfully");
};

export const searchOrganizations = async (query) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.SEARCH, {
    params: { query },
  });

  return normalizeResponse(response, "Search completed successfully");
};

export const getUserJoinRequests = async () => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_MY_REQUESTS);

  return normalizeResponse(response, "Join requests fetched successfully");
};

export const getOrganizationById = async (id) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_BY_ID(id));

  return normalizeResponse(response, "Organization fetched successfully");
};

export const getJoinRequest = async (joinRequestId) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_JOIN_REQUEST(joinRequestId), {
    headers: SERVICE_HEADERS.TEXT_PLAIN,
  });

  return normalizeResponse(response, "Join request fetched successfully");
};

export const bindUserToOrganization = async (joinRequestId, userId) => {
  const response = await client.post(
    ORGANIZATION_ENDPOINTS.BIND_USER_TO_ORGANIZATION,
    {
      joinRequestId,
      userId,
    },
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "User bound to organization successfully");
};
