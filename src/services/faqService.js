import axiosInstance from '../api/axiosInstance';
import { COMMON_ENDPOINTS, FAQ_ENDPOINTS } from '../constants/apiEndpoints';
import { SERVICE_HEADERS } from '../utils/serviceUtils';

class FAQService {
  // Get FAQ categories
  async getFAQCategories(languageCode = 'en') {
    const response = await axiosInstance.get(
      `${COMMON_ENDPOINTS.GET_FAQ_CATEGORIES}?languageCode=${languageCode}`,
      {
        headers: SERVICE_HEADERS.TEXT_PLAIN,
      }
    );
    return response.data;
  }

  // Get questions by category ID
  async getQuestionsByCategory(categoryId, languageCode = 'en') {
    const response = await axiosInstance.post(
      FAQ_ENDPOINTS.GET_QUESTIONS_BY_CATEGORY,
      { 
        categoryId,
        languageCode
      },
      {
        headers: SERVICE_HEADERS.JSON,
      }
    );
    return response.data;
  }
}

// Create and export a singleton instance
const faqService = new FAQService();

export default faqService;

