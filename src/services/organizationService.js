import client from '../api/client';
import { ORGANIZATION_ENDPOINTS } from '../constants/apiEndpoints';

// Get all organizations
export const getAllOrganizations = async () => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_ALL);

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organizations fetched successfully",
    data: response.data.data || response.data,
  };
};

// Search organizations by query
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

// Submit join request for an organization
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

// Get user's join requests
export const getUserJoinRequests = async () => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_MY_REQUESTS);

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Join requests fetched successfully",
    data: response.data.data || response.data,
  };
};

// Create organization and automatically send join request
export const createOrganization = async (organizationData) => {
  const response = await client.post(ORGANIZATION_ENDPOINTS.CREATE, organizationData);

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organization created successfully",
    data: response.data.data || response.data,
  };
};

// Get organization by ID
export const getOrganizationById = async (id) => {
  const response = await client.get(ORGANIZATION_ENDPOINTS.GET_BY_ID(id));

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organization fetched successfully",
    data: response.data.data || response.data,
  };
};

// Update organization
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

// Delete organization
export const deleteOrganization = async (id) => {
  const response = await client.delete(ORGANIZATION_ENDPOINTS.DELETE(id));

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Organization deleted successfully",
    data: response.data.data || response.data,
  };
};
