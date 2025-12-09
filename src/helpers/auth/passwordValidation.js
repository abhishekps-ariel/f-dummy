/**
 * Password validation and strength checking utilities
 */

import { VALIDATION } from '../../constants/appConstants';

/**
 * Check password against guidelines and return validation object
 * @param {string} password - Password to validate
 * @returns {Object} Validation object with boolean flags for each guideline
 */
export const checkPasswordGuidelines = (password) => {
  const guidelines = {
    minLength: password.length >= VALIDATION.MIN_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  return guidelines;
};

/**
 * Check if password meets all requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets all requirements
 */
export const isPasswordValid = (password) => {
  const guidelines = checkPasswordGuidelines(password);
  return Object.values(guidelines).every(Boolean);
};

/**
 * Validate password and confirm password match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirm password
 * @returns {Object} Validation result with isValid and error message
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!password || !confirmPassword) {
    return { isValid: false, error: 'Both password fields are required' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Get password strength level
 * @param {string} password - Password to check
 * @returns {string} Strength level: 'weak', 'medium', 'strong'
 */
export const getPasswordStrength = (password) => {
  if (!password) return 'weak';
  
  const guidelines = checkPasswordGuidelines(password);
  const metCount = Object.values(guidelines).filter(Boolean).length;
  
  if (metCount < 3) return 'weak';
  if (metCount < 5) return 'medium';
  return 'strong';
};

