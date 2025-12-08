/**
 * Utility functions for parsing and validating JWT tokens
 * Provides safe token parsing with proper error handling
 */

import { logger } from './logger';

/**
 * Safely parses a JWT token and extracts its payload
 * @param {string} token - The JWT token to parse
 * @returns {object|null} - The parsed token payload, or null if parsing fails
 */
export const parseToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('Invalid token format: token does not have 3 parts');
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    logger.error('Token parsing failed:', error);
    return null;
  }
};

/**
 * Checks if a token is expired or about to expire
 * @param {string} token - The JWT token to check
 * @param {number} bufferSeconds - Seconds before expiry to consider token expired (default: 300)
 * @returns {boolean} - True if token is expired or about to expire
 */
export const isTokenExpired = (token, bufferSeconds = 300) => {
  if (!token) return true;

  const payload = parseToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= (payload.exp - bufferSeconds);
};

/**
 * Checks if a refresh token is expired
 * @param {string} refreshToken - The refresh token to check
 * @returns {boolean} - True if refresh token is expired
 */
export const isRefreshTokenExpired = (refreshToken) => {
  if (!refreshToken) return true;

  const payload = parseToken(refreshToken);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= payload.exp;
};

