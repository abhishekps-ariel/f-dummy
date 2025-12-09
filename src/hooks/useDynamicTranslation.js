/**
 * Custom hook for translating dynamic API content using Google Translate
 * Caches translations and integrates with i18next for language detection
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import googleTranslateService from '../services/googleTranslateService';

/**
 * Hook to translate dynamic content
 * @param {string|string[]|Object|Object[]} content - Content to translate
 * @param {Object} options - Translation options
 * @param {string[]} options.fields - Field names to translate (for objects)
 * @param {boolean} options.enabled - Whether translation is enabled (default: true)
 * @returns {string|string[]|Object|Object[]} Translated content
 */
export const useDynamicTranslation = (content, options = {}) => {
  const { i18n } = useTranslation();
  const { fields = [], enabled = true } = options;
  
  const [translatedContent, setTranslatedContent] = useState(content);
  const [isTranslating, setIsTranslating] = useState(false);
  const currentLanguageRef = useRef(i18n.language);
  const contentRef = useRef(content);

  // Get target language from i18n
  const targetLanguage = i18n.language === 'es' ? 'es' : 'en';

  // Translate content when language or content changes
  useEffect(() => {
    // Skip if translation is disabled or target is English
    if (!enabled || targetLanguage === 'en') {
      setTranslatedContent(content);
      currentLanguageRef.current = targetLanguage;
      contentRef.current = content;
      return;
    }

    // Skip if content hasn't changed and language hasn't changed
    if (
      currentLanguageRef.current === targetLanguage &&
      JSON.stringify(contentRef.current) === JSON.stringify(content)
    ) {
      return;
    }

    // If content is null/undefined/empty, return as is
    if (!content || (Array.isArray(content) && content.length === 0)) {
      setTranslatedContent(content);
      return;
    }

    const translate = async () => {
      setIsTranslating(true);
      try {
        let translated;

        if (typeof content === 'string') {
          // Single string
          translated = await googleTranslateService.translateText(content, targetLanguage);
        } else if (Array.isArray(content)) {
          // Array - check if it's array of strings or objects
          if (content.length > 0 && typeof content[0] === 'string') {
            // Array of strings
            translated = await googleTranslateService.translateBatch(content, targetLanguage);
          } else if (content.length > 0 && typeof content[0] === 'object') {
            // Array of objects
            translated = await googleTranslateService.translateObjectArray(
              content,
              fields.length > 0 ? fields : Object.keys(content[0] || {}),
              targetLanguage
            );
          } else {
            translated = content;
          }
        } else if (typeof content === 'object') {
          // Single object
          translated = await googleTranslateService.translateObject(
            content,
            fields.length > 0 ? fields : Object.keys(content || {}),
            targetLanguage
          );
        } else {
          translated = content;
        }

        setTranslatedContent(translated);
        currentLanguageRef.current = targetLanguage;
        contentRef.current = content;
      } catch (error) {
        console.error('Error translating content:', error);
        setTranslatedContent(content); // Fallback to original on error
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [content, targetLanguage, enabled, fields]);

  return { translatedContent, isTranslating };
};

/**
 * Hook to translate a single string (simpler API)
 * @param {string} text - Text to translate
 * @param {boolean} enabled - Whether translation is enabled
 * @returns {string} Translated text
 */
export const useTranslateText = (text, enabled = true) => {
  const { translatedContent } = useDynamicTranslation(text, { enabled });
  return typeof translatedContent === 'string' ? translatedContent : text;
};

/**
 * Hook to translate an array of strings
 * @param {string[]} texts - Array of texts to translate
 * @param {boolean} enabled - Whether translation is enabled
 * @returns {string[]} Translated texts
 */
export const useTranslateArray = (texts, enabled = true) => {
  const { translatedContent } = useDynamicTranslation(texts, { enabled });
  return Array.isArray(translatedContent) ? translatedContent : texts;
};

/**
 * Hook to translate an object
 * @param {Object} obj - Object to translate
 * @param {string[]} fields - Field names to translate
 * @param {boolean} enabled - Whether translation is enabled
 * @returns {Object} Translated object
 */
export const useTranslateObject = (obj, fields = [], enabled = true) => {
  const { translatedContent } = useDynamicTranslation(obj, { fields, enabled });
  return typeof translatedContent === 'object' && !Array.isArray(translatedContent)
    ? translatedContent
    : obj;
};

/**
 * Hook to translate an array of objects
 * @param {Object[]} objects - Array of objects to translate
 * @param {string[]} fields - Field names to translate
 * @param {boolean} enabled - Whether translation is enabled
 * @returns {Object[]} Translated objects
 */
export const useTranslateObjectArray = (objects, fields = [], enabled = true) => {
  const { translatedContent } = useDynamicTranslation(objects, { fields, enabled });
  return Array.isArray(translatedContent) ? translatedContent : objects;
};

export default useDynamicTranslation;

