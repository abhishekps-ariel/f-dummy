/**
 * Input processing helpers for petition forms
 */

import { parseCurrencyInput } from "../../utils/currencyUtils";
import { isDateInPast } from "../../utils/dateUtils";

/**
 * Get field type based on field name
 * @param {string} fieldName - Field name
 * @returns {string} Field type ('currency', 'integer', 'text', 'number', 'date', 'checkbox', 'file')
 */
export const getFieldType = (fieldName) => {
  const currencyFields = [
    "originalPrincipalAmount",
    "currentPrincipalBalance",
    "monthlyPaymentAmount",
    "amountInDefault",
  ];

  const integerFields = ["delinquencyDaysAtFiling", "daysDelinquentAtNotice"];

  if (currencyFields.includes(fieldName)) {
    return "currency";
  }
  if (integerFields.includes(fieldName)) {
    return "integer";
  }
  if (fieldName === "minNumber" || fieldName === "loanNumber") {
    return "digitsOnly";
  }
  if (fieldName.includes("Date")) {
    return "date";
  }
  return "text";
};

/**
 * Process currency input
 * @param {string} value - Input value
 * @returns {number} Parsed numeric value
 */
export const processCurrencyInput = (value) => {
  return parseCurrencyInput(value);
};

/**
 * Process integer input
 * @param {string} value - Input value
 * @returns {string} Processed integer value
 */
export const processIntegerInput = (value) => {
  if (value === "") return "";
  const intValue = parseInt(value, 10);
  return isNaN(intValue) ? "" : intValue.toString();
};

/**
 * Process numeric input
 * @param {string} value - Input value
 * @param {string} type - Input type ('currency', 'integer', 'number')
 * @returns {number|string} Processed value
 */
export const processNumericInput = (value, type) => {
  if (type === "currency") {
    return processCurrencyInput(value);
  }
  if (type === "integer") {
    return processIntegerInput(value);
  }
  return value;
};

/**
 * Process text input (digits only for MIN and Loan Number)
 * @param {string} value - Input value
 * @param {string} fieldName - Field name
 * @returns {string} Processed text value
 */
export const processTextInput = (value, fieldName) => {
  if (fieldName === "minNumber" || fieldName === "loanNumber") {
    return (value || "").replace(/\D+/g, "");
  }
  return value;
};

/**
 * Check if certainMortgageLoan should be auto-set based on loan checkboxes
 * @param {Object} formData - Form data object
 * @param {string} changedField - Name of the field that changed
 * @param {boolean} checked - Checked state
 * @returns {boolean|null} True if should be set to true, null if should allow user control
 */
export const shouldAutoSetCertainMortgageLoan = (formData, changedField, checked) => {
  if (changedField !== "variableRate" && changedField !== "interestOnly" && changedField !== "negativeAmortization") {
    return null;
  }

  const variableRateChecked = changedField === "variableRate" ? checked : formData.variableRate;
  const interestOnlyChecked = changedField === "interestOnly" ? checked : formData.interestOnly;
  const negativeAmortizationChecked = changedField === "negativeAmortization" ? checked : formData.negativeAmortization;

  const hasAnyChecked = variableRateChecked || interestOnlyChecked || negativeAmortizationChecked;

  return hasAnyChecked ? true : null; // null means don't auto-set, allow user control
};

/**
 * Validate date is in the past (for real-time validation)
 * @param {string} dateString - Date string
 * @param {string} fieldName - Field name for error message
 * @returns {Object|null} Error object or null if valid
 */
export const validateDateInPast = (dateString, fieldName) => {
  if (!dateString || !dateString.trim()) return null;

  if (!isDateInPast(dateString)) {
    const fieldLabels = {
      originationDate: "Origination Date must be in the past",
      noticeDate: "Notice Date must be in the past",
    };

    return {
      field: fieldName,
      message: fieldLabels[fieldName] || "Date must be in the past",
    };
  }

  return null;
};

/**
 * Validate interest rate percentage (0-100)
 * @param {string|number} value - Interest rate value
 * @returns {Object|null} Error object or null if valid
 */
export const validateInterestRate = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null; // Empty is handled by required validation
  }

  const interestRate = parseFloat(value) || 0;

  if (interestRate < 0 || interestRate > 100) {
    return {
      field: "interestRatePercent",
      message: "Interest Rate must be between 0% and 100%",
    };
  }

  return null;
};

/**
 * Process input value based on field type
 * @param {string} fieldName - Field name
 * @param {string} value - Input value
 * @param {string} inputType - HTML input type
 * @returns {any} Processed value
 */
export const processInputValue = (fieldName, value, inputType) => {
  const fieldType = getFieldType(fieldName);

  if (inputType === "checkbox") {
    return value; // Checkbox value is boolean
  }

  if (inputType === "file") {
    return value; // File value is File object
  }

  if (fieldType === "currency") {
    return processCurrencyInput(value);
  }

  if (fieldType === "integer" && inputType === "number") {
    return processIntegerInput(value);
  }

  if (fieldType === "digitsOnly") {
    return processTextInput(value, fieldName);
  }

  return value;
};

