/**
 * Google Places API Service
 * Handles Google Places API calls (autocomplete, place details, geocode)
 * Uses backend proxy to keep API key secure
 */

import axiosInstance from '../api/axiosInstance';
import { GOOGLE_ENDPOINTS } from '../constants/apiEndpoints';
import { SERVICE_HEADERS } from '../utils/serviceUtils';

class GooglePlacesService {
  constructor() {
    this.placeDetailsCache = new Map(); // Cache place details to reduce API calls
    this.geocodeCache = new Map(); // Cache geocode results to reduce API calls
    this.pendingRequests = new Map(); // Track pending requests to prevent duplicate calls
  }

  /**
   * Get autocomplete suggestions for an address input
   * @param {string} input - Address input string
   * @returns {Promise<Array>} Array of suggestions with description and placeId
   */
  async autocomplete(input) {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return [];
    }

    const trimmedInput = input.trim();
    const cacheKey = `autocomplete:${trimmedInput}`;

    // Check if there's already a pending request for this input
    if (this.pendingRequests.has(cacheKey)) {
      // Wait for the existing request to complete
      return await this.pendingRequests.get(cacheKey);
    }

    try {
      // Prepare request body - matches backend API format
      const requestBody = {
        input: trimmedInput,
      };

      // Create a promise for this request and store it to prevent duplicate calls
      const requestPromise = axiosInstance.post(
        GOOGLE_ENDPOINTS.AUTOCOMPLETE,
        requestBody,
        {
          headers: SERVICE_HEADERS.JSON,
        }
      ).then((response) => {
        // Backend response format: { success, message, exceptionMessage, validationErrors, data: { suggestions } }
        if (response.data?.success && response.data?.data?.suggestions) {
          return response.data.data.suggestions;
        }

        // If not successful, log and return empty array
        if (response.data?.message) {
          console.warn('Google Places Autocomplete API warning:', response.data.message);
        }
        if (response.data?.exceptionMessage) {
          console.error('Google Places Autocomplete API error:', response.data.exceptionMessage);
        }
        if (response.data?.validationErrors && response.data.validationErrors.length > 0) {
          console.error('Google Places Autocomplete API validation errors:', response.data.validationErrors);
        }
        
        return [];
      }).catch((error) => {
        console.error('Error getting autocomplete suggestions:', error);
        return [];
      }).finally(() => {
        // Remove from pending requests once done
        this.pendingRequests.delete(cacheKey);
      });

      // Store the pending request
      this.pendingRequests.set(cacheKey, requestPromise);

      // Wait for the request to complete and return the suggestions
      return await requestPromise;
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get place details by place ID
   * @param {string} placeId - Google Places place ID
   * @returns {Promise<Object|null>} Place details with formattedAddress, latitude, longitude, addressComponents
   */
  async getPlaceDetails(placeId) {
    if (!placeId || typeof placeId !== 'string' || placeId.trim().length === 0) {
      return null;
    }

    const trimmedPlaceId = placeId.trim();
    const cacheKey = `placeDetails:${trimmedPlaceId}`;

    // Check cache
    if (this.placeDetailsCache.has(cacheKey)) {
      return this.placeDetailsCache.get(cacheKey);
    }

    // Check if there's already a pending request for this placeId
    if (this.pendingRequests.has(cacheKey)) {
      // Wait for the existing request to complete
      return await this.pendingRequests.get(cacheKey);
    }

    try {
      // Prepare request body - matches backend API format
      const requestBody = {
        placeId: trimmedPlaceId,
      };

      // Create a promise for this request and store it to prevent duplicate calls
      const requestPromise = axiosInstance.post(
        GOOGLE_ENDPOINTS.PLACE_DETAILS,
        requestBody,
        {
          headers: SERVICE_HEADERS.JSON,
        }
      ).then((response) => {
        // Backend response format: { success, message, exceptionMessage, validationErrors, data: { formattedAddress, latitude, longitude, addressComponents } }
        if (response.data?.success && response.data?.data) {
          const placeDetails = response.data.data;
          // Cache the place details
          this.placeDetailsCache.set(cacheKey, placeDetails);
          return placeDetails;
        }

        // If not successful, log and return null
        if (response.data?.message) {
          console.warn('Google Places Details API warning:', response.data.message);
        }
        if (response.data?.exceptionMessage) {
          console.error('Google Places Details API error:', response.data.exceptionMessage);
        }
        if (response.data?.validationErrors && response.data.validationErrors.length > 0) {
          console.error('Google Places Details API validation errors:', response.data.validationErrors);
        }
        
        return null;
      }).catch((error) => {
        console.error('Error getting place details:', error);
        return null;
      }).finally(() => {
        // Remove from pending requests once done
        this.pendingRequests.delete(cacheKey);
      });

      // Store the pending request
      this.pendingRequests.set(cacheKey, requestPromise);

      // Wait for the request to complete and return the place details
      return await requestPromise;
    } catch (error) {
      console.error('Error getting place details:', error);
      // Return null on error
      return null;
    }
  }

  /**
   * Geocode an address string to get coordinates and address components
   * @param {string} address - Address string to geocode
   * @returns {Promise<Object|null>} Geocode result with formattedAddress, latitude, longitude, addressComponents
   */
  async geocode(address) {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return null;
    }

    const trimmedAddress = address.trim();
    const cacheKey = `geocode:${trimmedAddress}`;

    // Check cache
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey);
    }

    // Check if there's already a pending request for this address
    if (this.pendingRequests.has(cacheKey)) {
      // Wait for the existing request to complete
      return await this.pendingRequests.get(cacheKey);
    }

    try {
      // Prepare request body - matches backend API format
      const requestBody = {
        address: trimmedAddress,
      };

      // Create a promise for this request and store it to prevent duplicate calls
      const requestPromise = axiosInstance.post(
        GOOGLE_ENDPOINTS.GEOCODE,
        requestBody,
        {
          headers: SERVICE_HEADERS.JSON,
        }
      ).then((response) => {
        // Backend response format: { success, message, exceptionMessage, validationErrors, data: { formattedAddress, latitude, longitude, addressComponents } }
        if (response.data?.success && response.data?.data) {
          const geocodeResult = response.data.data;
          // Cache the geocode result
          this.geocodeCache.set(cacheKey, geocodeResult);
          return geocodeResult;
        }

        // If not successful, log and return null
        if (response.data?.message) {
          console.warn('Google Places Geocode API warning:', response.data.message);
        }
        if (response.data?.exceptionMessage) {
          console.error('Google Places Geocode API error:', response.data.exceptionMessage);
        }
        if (response.data?.validationErrors && response.data.validationErrors.length > 0) {
          console.error('Google Places Geocode API validation errors:', response.data.validationErrors);
        }
        
        return null;
      }).catch((error) => {
        console.error('Error geocoding address:', error);
        return null;
      }).finally(() => {
        // Remove from pending requests once done
        this.pendingRequests.delete(cacheKey);
      });

      // Store the pending request
      this.pendingRequests.set(cacheKey, requestPromise);

      // Wait for the request to complete and return the geocode result
      return await requestPromise;
    } catch (error) {
      console.error('Error geocoding address:', error);
      // Return null on error
      return null;
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.placeDetailsCache.clear();
    this.geocodeCache.clear();
  }

  /**
   * Clear place details cache only
   */
  clearPlaceDetailsCache() {
    this.placeDetailsCache.clear();
  }

  /**
   * Clear geocode cache only
   */
  clearGeocodeCache() {
    this.geocodeCache.clear();
  }

  /**
   * Get cache sizes (for debugging)
   */
  getCacheSizes() {
    return {
      placeDetails: this.placeDetailsCache.size,
      geocode: this.geocodeCache.size,
    };
  }
}

// Export singleton instance
const googlePlacesService = new GooglePlacesService();
export default googlePlacesService;

