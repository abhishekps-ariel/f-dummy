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

