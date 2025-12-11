/**
 * Google Translate API Service
 * Handles translation of dynamic content from API responses
 * Uses backend proxy to keep API key secure
 */

import axiosInstance from '../api/axiosInstance';
import { GOOGLE_ENDPOINTS } from '../constants/apiEndpoints';
import { SERVICE_HEADERS } from '../utils/serviceUtils';

class GoogleTranslateService {
  constructor() {
    this.translationCache = new Map(); // Cache translations to reduce API calls
    this.pendingRequests = new Map(); // Track pending requests to prevent duplicate calls
  }

  /**
   * Detect the source language (default to 'en')
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} Language code
   * @deprecated Not needed - we only translate between 'en' and 'es' for localization
   */
  async detectLanguage(text) {
    // Not used - we know source language is always 'en' for localization
    return 'en';
  }

  /**
   * Translate text to target language
   * For localization: translates between English ('en') and Spanish ('es')
   * @param {string} text - Text to translate (always in English)
   * @param {string} targetLanguage - Target language code ('es' for Spanish, 'en' for English)
   * @param {string} sourceLanguage - Source language code (default: 'en' - always English for localization)
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, targetLanguage = 'en', sourceLanguage = 'en') {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return text;
    }

    // If target language is 'en', return original (source is always English for localization)
    if (targetLanguage === 'en') {
      return text;
    }

    // For localization, source is always 'en', target is 'es'
    // If source is already target, return original
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    // Check cache
    const cacheKey = `${text}|${targetLanguage}|${sourceLanguage}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    // Check if there's already a pending request for this text
    if (this.pendingRequests.has(cacheKey)) {
      // Wait for the existing request to complete
      return await this.pendingRequests.get(cacheKey);
    }

    try {
      // Prepare request body - matches backend API format
      const requestBody = {
        text: text,
        targetLang: targetLanguage,
        sourceLang: sourceLanguage, // Always 'en' for localization
      };

      // Create a promise for this request and store it to prevent duplicate calls
      const requestPromise = axiosInstance.post(
        GOOGLE_ENDPOINTS.TRANSLATE,
        requestBody,
        {
          headers: SERVICE_HEADERS.JSON,
        }
      ).then((response) => {
        // Backend response format: { success, message, exceptionMessage, validationErrors, data: { translatedText } }
        if (response.data?.success && response.data?.data?.translatedText) {
          const translatedText = response.data.data.translatedText;
          // Cache the translation
          this.translationCache.set(cacheKey, translatedText);
          return translatedText;
        }

        // If not successful, log and return original text
        if (response.data?.message) {
          console.warn('Translation API warning:', response.data.message);
        }
        if (response.data?.exceptionMessage) {
          console.error('Translation API error:', response.data.exceptionMessage);
        }
        if (response.data?.validationErrors && response.data.validationErrors.length > 0) {
          console.error('Translation API validation errors:', response.data.validationErrors);
        }
        
        return text;
      }).catch((error) => {
        console.error('Error translating text:', error);
        return text;
      }).finally(() => {
        // Remove from pending requests once done
        this.pendingRequests.delete(cacheKey);
      });

      // Store the pending request
      this.pendingRequests.set(cacheKey, requestPromise);

      // Wait for the request to complete and return the translated text
      return await requestPromise;
    } catch (error) {
      console.error('Error translating text:', error);
      // Return original text on error
      return text;
    }
  }

  /**
   * Translate an array of texts
   * @param {string[]} texts - Array of texts to translate
   * @param {string} targetLanguage - Target language code ('en' or 'es')
   * @param {string} sourceLanguage - Source language code (default: 'en')
   * @returns {Promise<string[]>} Array of translated texts
   */
  async translateBatch(texts, targetLanguage = 'en', sourceLanguage = 'en') {
    if (!Array.isArray(texts) || texts.length === 0) {
      return texts;
    }

    // Translate all texts in parallel
    const translations = await Promise.all(
      texts.map((text) => this.translateText(text, targetLanguage, sourceLanguage))
    );

    return translations;
  }

  /**
   * Translate an object's string properties
   * @param {Object} obj - Object to translate
   * @param {string[]} fieldsToTranslate - Array of field names to translate
   * @param {string} targetLanguage - Target language code ('en' or 'es')
   * @param {string} sourceLanguage - Source language code (default: 'en')
   * @returns {Promise<Object>} Object with translated fields
   */
  async translateObject(obj, fieldsToTranslate, targetLanguage = 'en', sourceLanguage = 'en') {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const translated = { ...obj };

    // Translate specified fields
    const translationPromises = fieldsToTranslate.map(async (field) => {
      if (obj[field] && typeof obj[field] === 'string' && obj[field].trim().length > 0) {
        translated[field] = await this.translateText(obj[field], targetLanguage, sourceLanguage);
      }
    });

    await Promise.all(translationPromises);

    return translated;
  }

  /**
   * Translate an array of objects
   * @param {Object[]} objects - Array of objects to translate
   * @param {string[]} fieldsToTranslate - Array of field names to translate
   * @param {string} targetLanguage - Target language code ('en' or 'es')
   * @param {string} sourceLanguage - Source language code (default: 'en')
   * @returns {Promise<Object[]>} Array of objects with translated fields
   */
  async translateObjectArray(objects, fieldsToTranslate, targetLanguage = 'en', sourceLanguage = 'en') {
    if (!Array.isArray(objects)) {
      return objects;
    }

    const translations = await Promise.all(
      objects.map((obj) => this.translateObject(obj, fieldsToTranslate, targetLanguage, sourceLanguage))
    );

    return translations;
  }

  /**
   * Clear the translation cache
   */
  clearCache() {
    this.translationCache.clear();
  }

  /**
   * Get cache size (for debugging)
   */
  getCacheSize() {
    return this.translationCache.size;
  }
}

// Export singleton instance
const googleTranslateService = new GoogleTranslateService();
export default googleTranslateService;
