/**
 * Google Translate API Service
 * Handles translation of dynamic content from API responses
 */

const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

class GoogleTranslateService {
  constructor() {
    this.apiKey = API_KEY;
    this.translationCache = new Map(); // Cache translations to reduce API calls
  }

  /**
   * Detect the source language (default to 'en')
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} Language code
   */
  async detectLanguage(text) {
    if (!this.apiKey || !text || typeof text !== 'string' || text.trim().length === 0) {
      return 'en';
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text.substring(0, 100), // Google API has limits on text length
          }),
        }
      );

      if (!response.ok) {
        console.warn('Failed to detect language, defaulting to en');
        return 'en';
      }

      const data = await response.json();
      return data?.data?.detections?.[0]?.[0]?.language || 'en';
    } catch (error) {
      console.warn('Error detecting language:', error);
      return 'en';
    }
  }

  /**
   * Translate text to target language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'es', 'en')
   * @param {string} sourceLanguage - Source language code (optional, will auto-detect if not provided)
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, targetLanguage = 'en', sourceLanguage = null) {
    // Return original text if no API key or invalid input
    if (!this.apiKey) {
      console.warn('Google Translate API key not configured');
      return text;
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return text;
    }

    // If target language is 'en', return original (assuming source is English)
    if (targetLanguage === 'en') {
      return text;
    }

    // Check cache
    const cacheKey = `${text}|${targetLanguage}|${sourceLanguage || 'auto'}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    try {
      // Auto-detect source language if not provided
      let detectedSourceLanguage = sourceLanguage;
      if (!detectedSourceLanguage) {
        detectedSourceLanguage = await this.detectLanguage(text);
        // If source is already target language, return original
        if (detectedSourceLanguage === targetLanguage) {
          this.translationCache.set(cacheKey, text);
          return text;
        }
      }

      // Prepare request body
      const requestBody = {
        q: text,
        target: targetLanguage,
        format: 'text',
      };

      if (detectedSourceLanguage && detectedSourceLanguage !== 'auto') {
        requestBody.source = detectedSourceLanguage;
      }

      const response = await fetch(`${TRANSLATE_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Google Translate API error:', errorData);
        // Return original text on error
        return text;
      }

      const data = await response.json();
      const translatedText = data?.data?.translations?.[0]?.translatedText || text;

      // Cache the translation
      this.translationCache.set(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      // Return original text on error
      return text;
    }
  }

  /**
   * Translate an array of texts
   * @param {string[]} texts - Array of texts to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise<string[]>} Array of translated texts
   */
  async translateBatch(texts, targetLanguage = 'en', sourceLanguage = null) {
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
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise<Object>} Object with translated fields
   */
  async translateObject(obj, fieldsToTranslate, targetLanguage = 'en', sourceLanguage = null) {
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
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise<Object[]>} Array of objects with translated fields
   */
  async translateObjectArray(objects, fieldsToTranslate, targetLanguage = 'en', sourceLanguage = null) {
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

