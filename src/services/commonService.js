import client from "../api/axiosInstance";
import { COMMON_ENDPOINTS } from "../constants/apiEndpoints";
import { extractNestedData, normalizeResponse } from "../utils/responseParser";

export const getFilingEntityTypes = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_FILING_ENTITY_TYPES, {
    headers: {
      Accept: "text/plain",
    },
  });

  return normalizeResponse(response, "Filing entity types fetched successfully");
};

export const getMfaTypesEnum = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_MFA_TYPES_ENUM, {
    headers: {
      Accept: "text/plain",
    },
  });

  // Extract nested mfaTypes data using unified parser
  const enumData = extractNestedData(response, 'mfaTypes') || extractNestedData(response);

  return {
    isSuccess: response.data?.success !== false,
    msg: response.data?.message || "MFA types enum fetched successfully",
    data: enumData || [],
  };
};

export const get35BReportingPeriods = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_35B_REPORTING_PERIOD, {
    headers: {
      Accept: "text/plain",
    },
  });

  return normalizeResponse(response, "35B reporting periods fetched successfully");
};

export const get35BEntityTypes = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_35B_ENTITY_TYPE, {
    headers: {
      Accept: "text/plain",
    },
  });

  return normalizeResponse(response, "35B entity types fetched successfully");
};

