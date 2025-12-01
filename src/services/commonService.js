import client from "../api/axiosInstance";
import { COMMON_ENDPOINTS } from "../constants/apiEndpoints";

export const getFilingEntityTypes = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_FILING_ENTITY_TYPES, {
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const getJoinRequestStatusEnum = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_JOIN_REQUEST_STATUS_ENUM, {
    headers: {
      Accept: "text/plain",
    },
  });

  // Handle nested structure: data.joinRequestStatus
  let enumData = null;
  if (response.data && response.data.data && response.data.data.joinRequestStatus) {
    enumData = response.data.data.joinRequestStatus;
  } else if (response.data && response.data.joinRequestStatus) {
    enumData = response.data.joinRequestStatus;
  } else if (response.data && response.data.data) {
    enumData = response.data.data;
  } else if (response.data) {
    enumData = response.data;
  }

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "Status enum fetched successfully",
    data: enumData || [],
  };
};

export const getMfaTypesEnum = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_MFA_TYPES_ENUM, {
    headers: {
      Accept: "text/plain",
    },
  });

  // Handle nested structure: data.mfaTypes
  let enumData = null;
  if (response.data && response.data.data && response.data.data.mfaTypes) {
    enumData = response.data.data.mfaTypes;
  } else if (response.data && response.data.mfaTypes) {
    enumData = response.data.mfaTypes;
  } else if (response.data && response.data.data) {
    enumData = response.data.data;
  } else if (response.data) {
    enumData = response.data;
  }

  return {
    isSuccess: response.data.success || true,
    msg: response.data.message || "MFA types enum fetched successfully",
    data: enumData || [],
  };
};

export const get35BReportingPeriods = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_35B_REPORTING_PERIOD, {
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

export const get35BEntityTypes = async () => {
  const response = await client.get(COMMON_ENDPOINTS.GET_35B_ENTITY_TYPE, {
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

