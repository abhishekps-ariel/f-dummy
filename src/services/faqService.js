import axiosInstance from '../api/axiosInstance';
import { COMMON_ENDPOINTS, FAQ_ENDPOINTS } from '../constants/apiEndpoints';

class FAQService {
  // Get FAQ categories
  async getFAQCategories() {
    const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_FAQ_CATEGORIES, {
      headers: {
        Accept: "text/plain",
      },
    });
    return response.data;
  }

  // Get questions by category ID
  async getQuestionsByCategory(categoryId) {
    const response = await axiosInstance.post(
      FAQ_ENDPOINTS.GET_QUESTIONS_BY_CATEGORY,
      { categoryId },
      {
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }
}

// Create and export a singleton instance
const faqService = new FAQService();

export default faqService;

