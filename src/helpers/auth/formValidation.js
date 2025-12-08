/**
 * Generic form validation utilities
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.blockGmail - Block @gmail.com emails (default: false)
 * @returns {Object} Validation result with isValid and error message
 */
export const validateEmail = (email, options = {}) => {
  const { blockGmail = false } = options;
  
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (blockGmail && email.toLowerCase().endsWith('@gmail.com')) {
    return { isValid: false, error: 'Gmail addresses are not accepted' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @returns {Object} Validation result with isValid and error message
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate phone number (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it's a valid phone number (10 digits for US)
  if (!/^\d{10,15}$/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate form fields object
 * @param {Object} formData - Form data object
 * @param {Object} rules - Validation rules object
 * @param {Function} t - Translation function (optional)
 * @returns {Object} Validation result with isValid and errors object
 */
export const validateForm = (formData, rules, t) => {
  const errors = {};
  
  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = formData[fieldName];
    
    // Required validation
    if (rule.required && (!value || !value.trim())) {
      errors[fieldName] = t 
        ? t('auth.thisFieldEmpty') 
        : `${fieldName} is required`;
      continue;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || !value.trim()) {
      continue;
    }
    
    // Email validation
    if (rule.type === 'email') {
      const emailValidation = validateEmail(value, { blockGmail: rule.blockGmail });
      if (!emailValidation.isValid) {
        errors[fieldName] = t 
          ? t('auth.enterValidEmail') 
          : emailValidation.error;
      }
    }
    
    // Phone validation
    if (rule.type === 'phone') {
      const phoneValidation = validatePhone(value);
      if (!phoneValidation.isValid) {
        errors[fieldName] = phoneValidation.error;
      }
    }
    
    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[fieldName] = t
        ? t('auth.minLength', { min: rule.minLength })
        : `Must be at least ${rule.minLength} characters`;
    }
    
    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[fieldName] = t
        ? t('auth.maxLength', { max: rule.maxLength })
        : `Must be no more than ${rule.maxLength} characters`;
    }
    
    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const customError = rule.validate(value, formData);
      if (customError) {
        errors[fieldName] = customError;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

