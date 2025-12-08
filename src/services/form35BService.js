import axiosInstance from '../api/axiosInstance';
import { FORM35B_ENDPOINTS } from '../constants/apiEndpoints';
import { SERVICE_HEADERS, normalizeResponse } from '../utils/serviceUtils';

class Form35BService {
  // Calculate Form 35B data based on organization, year, and reporting period
  async calculateForm35BData(calculationData) {
    const response = await axiosInstance.post(
      FORM35B_ENDPOINTS.CALCULATE,
      calculationData,
      {
        headers: SERVICE_HEADERS.JSON,
      }
    );

    return normalizeResponse(response, "Form 35B data calculated successfully");
  }

  // Submit or update Form 35B
  async submitForm35B(formData) {
    const response = await axiosInstance.post(
      FORM35B_ENDPOINTS.ADD_UPDATE,
      formData,
      {
        headers: SERVICE_HEADERS.JSON_WILDCARD,
      }
    );

    return normalizeResponse(response, "Form 35B submitted successfully");
  }
}

export default new Form35BService();

