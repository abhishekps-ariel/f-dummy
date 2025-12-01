import axiosInstance from '../api/axiosInstance';
import { FORM35B_ENDPOINTS } from '../constants/apiEndpoints';

class Form35BService {
  // Calculate Form 35B data based on organization, year, and reporting period
  async calculateForm35BData(calculationData) {
    const response = await axiosInstance.post(
      FORM35B_ENDPOINTS.CALCULATE,
      calculationData,
      {
        headers: {
          Accept: 'text/plain',
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  }

  // Submit or update Form 35B
  async submitForm35B(formData) {
    const response = await axiosInstance.post(
      FORM35B_ENDPOINTS.ADD_UPDATE,
      formData,
      {
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      isSuccess: response.data.success,
      msg: response.data.message,
      data: response.data.data,
    };
  }
}

export default new Form35BService();

