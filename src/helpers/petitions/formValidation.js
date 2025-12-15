/**
 * Form validation helpers for petition forms
 */

import { isDateInPast } from "../../utils/dateUtils";

/**
 * Validate property details
 * @param {Object} formData - Form data object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validatePropertyDetails = (formData) => {
  const errors = {};
  let hasErrors = false;

  if (!formData.propertyStreet1?.trim()) {
    errors.propertyStreet1 = "Street address is required";
    hasErrors = true;
  }

  if (!formData.propertyCity?.trim()) {
    errors.propertyCity = "City is required";
    hasErrors = true;
  }

  if (!formData.propertyState?.trim()) {
    errors.propertyState = "State is required";
    hasErrors = true;
  }

  const zipPattern = /^\d{5}(-\d{4})?$/;
  if (!formData.propertyZip?.trim()) {
    errors.propertyZip = "ZIP code is required";
    hasErrors = true;
  } else if (!zipPattern.test(formData.propertyZip)) {
    errors.propertyZip = "ZIP code must be in valid format (12345 or 12345-6789)";
    hasErrors = true;
  }

  if (!formData.propertyCounty?.trim()) {
    errors.propertyCounty = "County is required";
    hasErrors = true;
  }

  return { hasErrors, errors };
};

/**
 * Validate loan details
 * @param {Object} formData - Form data object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validateLoanDetails = (formData) => {
  const errors = {};
  let hasErrors = false;

  // Is MIN Applicable is required
  if (!formData.isMinApplicable || (formData.isMinApplicable !== "yes" && formData.isMinApplicable !== "no")) {
    errors.isMinApplicable = "Please select if MIN is applicable";
    hasErrors = true;
  }

  // MIN Number is required if MIN is applicable
  if (formData.isMinApplicable === "yes" && !formData.minNumber?.trim()) {
    errors.minNumber = "MIN Number is required when MIN is applicable";
    hasErrors = true;
  }

  // Loan Number is required
  if (!formData.loanNumber?.trim()) {
    errors.loanNumber = "Loan Number is required";
    hasErrors = true;
  }

  // Loan Type is required (from lookup)
  if (!formData.petitionLoanTypeId) {
    errors.petitionLoanTypeId = "Loan Type is required";
    hasErrors = true;
  }

  // Lien Position is required
  // Note: lienPosition can be 0 (for "First"), so we need to check for null/undefined/empty string specifically
  if (formData.lienPosition == null || formData.lienPosition === "") {
    errors.lienPosition = "Lien Position is required";
    hasErrors = true;
  }

  // Origination Date is required and must be in the past
  if (!formData.originationDate?.trim()) {
    errors.originationDate = "Origination Date is required";
    hasErrors = true;
  } else if (!isDateInPast(formData.originationDate)) {
    errors.originationDate = "Origination Date must be in the past";
    hasErrors = true;
  }

  // Original Principal Amount is required and must be positive
  if (!formData.originalPrincipalAmount || formData.originalPrincipalAmount <= 0) {
    errors.originalPrincipalAmount = "Original Principal Amount is required and must be greater than 0";
    hasErrors = true;
  }

  // Current Principal Balance is required and must be positive
  if (!formData.currentPrincipalBalance || formData.currentPrincipalBalance <= 0) {
    errors.currentPrincipalBalance = "Current Principal Balance is required and must be greater than 0";
    hasErrors = true;
  }

  // Interest Rate is required and must be between 0-100%
  if (
    formData.interestRatePercent === "" ||
    formData.interestRatePercent === null ||
    formData.interestRatePercent === undefined
  ) {
    errors.interestRatePercent = "Interest Rate is required";
    hasErrors = true;
  } else if (formData.interestRatePercent < 0 || formData.interestRatePercent > 100) {
    errors.interestRatePercent = "Interest Rate must be between 0% and 100%";
    hasErrors = true;
  } else if (formData.interestRatePercent === 0) {
    // 0% interest rate is not valid for a loan
    errors.interestRatePercent = "Interest Rate must be greater than 0%";
    hasErrors = true;
  }

  // Monthly Payment Amount is required and must be positive
  if (!formData.monthlyPaymentAmount || formData.monthlyPaymentAmount <= 0) {
    errors.monthlyPaymentAmount = "Monthly Payment Amount is required and must be greater than 0";
    hasErrors = true;
  }

  // Delinquency Days at Filing is required and must be non-negative
  if (
    formData.delinquencyDaysAtFiling === "" ||
    formData.delinquencyDaysAtFiling === null ||
    formData.delinquencyDaysAtFiling === undefined ||
    (typeof formData.delinquencyDaysAtFiling === 'number' && formData.delinquencyDaysAtFiling < 0) ||
    (typeof formData.delinquencyDaysAtFiling === 'string' && (formData.delinquencyDaysAtFiling.trim() === "" || parseFloat(formData.delinquencyDaysAtFiling) < 0))
  ) {
    errors.delinquencyDaysAtFiling = "Delinquency Days at Filing is required and must be 0 or greater";
    hasErrors = true;
  }

  // Validate borrower requested loan modification (required)
  if (formData.borrowerRequestedLoanModification === null || formData.borrowerRequestedLoanModification === undefined) {
    errors.borrowerRequestedLoanModification = "Please select if the borrower requested a loan modification";
    hasErrors = true;
  }

  // Validate loan modification request finalized (required if modification was requested)
  if (formData.borrowerRequestedLoanModification === true) {
    if (formData.loanModificationRequestFinalized === null || formData.loanModificationRequestFinalized === undefined) {
      errors.loanModificationRequestFinalized = "Please select if the loan modification request was finalized";
      hasErrors = true;
    }
  }

  return { hasErrors, errors };
};

/**
 * Validate borrower details
 * @param {Object} formData - Form data object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validateBorrowerDetails = (formData) => {
  const errors = {};
  let hasErrors = false;

  // Valid name pattern: letters, spaces, hyphens, apostrophes only
  const validNamePattern = /^[a-zA-Z\s\-']+$/;

  if (!formData.borrowers || formData.borrowers.length === 0) {
    errors.borrowers = "At least one borrower must be entered";
    hasErrors = true;
  } else {
    formData.borrowers.forEach((borrower) => {
      if (!borrower.firstName?.trim()) {
        errors[`borrower_${borrower.id}_firstName`] = "First name is required";
        hasErrors = true;
      } else if (!validNamePattern.test(borrower.firstName.trim())) {
        errors[`borrower_${borrower.id}_firstName`] = "First name must contain only valid characters (no numbers or invalid symbols)";
        hasErrors = true;
      }

      if (!borrower.lastName?.trim()) {
        errors[`borrower_${borrower.id}_lastName`] = "Last name is required";
        hasErrors = true;
      } else if (!validNamePattern.test(borrower.lastName.trim())) {
        errors[`borrower_${borrower.id}_lastName`] = "Last name must contain only valid characters (no numbers or invalid symbols)";
        hasErrors = true;
      }

      // Validate middle name if provided
      if (borrower.middleName?.trim() && !validNamePattern.test(borrower.middleName.trim())) {
        errors[`borrower_${borrower.id}_middleName`] = "Middle name must contain only valid characters (no numbers or invalid symbols)";
        hasErrors = true;
      }

      // Validate suffix if provided
      if (borrower.suffix?.trim() && !validNamePattern.test(borrower.suffix.trim())) {
        errors[`borrower_${borrower.id}_suffix`] = "Suffix must contain only valid characters (no numbers or invalid symbols)";
        hasErrors = true;
      }
    });
  }

  return { hasErrors, errors };
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if email format is valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
};

/**
 * Validate currency value
 * @param {number|string} value - Currency value
 * @param {number} min - Minimum value (default: 0)
 * @returns {Object} Validation result
 */
export const validateCurrency = (value, min = 0) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue < min) {
    return { isValid: false, error: `Value must be ${min} or greater` };
  }
  return { isValid: true };
};

/**
 * Validate integer value
 * @param {number|string} value - Integer value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Object} Validation result
 */
export const validateInteger = (value, min = null, max = null) => {
  const intValue = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(intValue)) {
    return { isValid: false, error: "Value must be a valid integer" };
  }
  if (min !== null && intValue < min) {
    return { isValid: false, error: `Value must be ${min} or greater` };
  }
  if (max !== null && intValue > max) {
    return { isValid: false, error: `Value must be ${max} or less` };
  }
  return { isValid: true };
};

/**
 * Validate percentage value (0-100)
 * @param {number|string} value - Percentage value
 * @returns {Object} Validation result
 */
export const validatePercentage = (value) => {
  return validateInteger(value, 0, 100);
};

/**
 * Validate Right-to-Cure details
 * @param {Object} formData - Form data object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validateRightToCureDetails = (formData) => {
  const errors = {};
  let hasErrors = false;

  // Check if rightToCures array exists (new format)
  const rightToCures = formData.rightToCures || [];
  const currentRTC = rightToCures.length > 0 ? rightToCures[0] : null;
  
  // Use rightToCures array data if available, otherwise fallback to single-object format
  const noticeSent = currentRTC ? currentRTC.noticeSent : formData.noticeSent;
  const noticeDate = currentRTC ? currentRTC.noticeDate : formData.noticeDate;
  const amountInDefault = currentRTC ? currentRTC.amountInDefault : formData.amountInDefault;
  const daysDelinquentAtNotice = currentRTC ? currentRTC.daysDelinquentAtNotice : formData.daysDelinquentAtNotice;
  const cureExpirationDate = currentRTC ? currentRTC.cureExpirationDate : formData.cureExpirationDate;
  const noticeAddressStreet1 = currentRTC ? currentRTC.noticeAddressStreet1 : formData.noticeAddressStreet1;
  const noticeAddressCity = currentRTC ? currentRTC.noticeAddressCity : formData.noticeAddressCity;
  const noticeAddressState = currentRTC ? currentRTC.noticeAddressState : formData.noticeAddressState;
  const noticeAddressZip = currentRTC ? currentRTC.noticeAddressZip : formData.noticeAddressZip;
  const manualOverrideReason = currentRTC ? currentRTC.manualOverrideReason : formData.manualOverrideReason;
  const borrowerRespondedWithin30Days = currentRTC ? currentRTC.borrowerRespondedWithin30Days : formData.borrowerRespondedWithin30Days;
  const borrowerResponseDate = currentRTC ? currentRTC.borrowerResponseDate : formData.borrowerResponseDate;
  const proceededWithRightToCure = currentRTC ? currentRTC.proceededWithRightToCure : formData.proceededWithRightToCure;

  // Validate notice sent selection
  if (noticeSent === null || noticeSent === undefined) {
    errors.noticeSent = "Please select whether the Right-to-Cure notice was sent";
    hasErrors = true;
  }

  if (noticeSent === true) {
    // Validate notice date
    if (!noticeDate || !noticeDate.trim()) {
      errors.noticeDate = "Notice date is required";
      hasErrors = true;
    } else if (!isDateInPast(noticeDate)) {
      errors.noticeDate = "Notice date must be in the past";
      hasErrors = true;
    }

    // Validate amount in default
    if (!amountInDefault || amountInDefault <= 0) {
      errors.amountInDefault = "Amount in default is required and must be greater than 0";
      hasErrors = true;
    }

    // Validate days delinquent
    if (
      daysDelinquentAtNotice === "" ||
      daysDelinquentAtNotice === null ||
      daysDelinquentAtNotice === undefined ||
      daysDelinquentAtNotice < 0
    ) {
      errors.daysDelinquentAtNotice = "Days delinquent is required and must be 0 or greater";
      hasErrors = true;
    }

    // Validate cure expiration date
    if (!cureExpirationDate || !cureExpirationDate.trim()) {
      errors.cureExpirationDate = "Cure expiration date is required";
      hasErrors = true;
    } else if (
      noticeDate &&
      cureExpirationDate &&
      new Date(cureExpirationDate) <= new Date(noticeDate)
    ) {
      errors.cureExpirationDate = "Cure expiration date must be after notice date";
      hasErrors = true;
    }

    // Validate notice address
    if (!noticeAddressStreet1 || !noticeAddressStreet1.trim()) {
      errors.noticeAddressStreet1 = "Notice mailing address is required";
      hasErrors = true;
    }

    if (!noticeAddressCity || !noticeAddressCity.trim()) {
      errors.noticeAddressCity = "City is required";
      hasErrors = true;
    }

    if (!noticeAddressState || !noticeAddressState.trim()) {
      errors.noticeAddressState = "State is required";
      hasErrors = true;
    }

    if (!noticeAddressZip || !noticeAddressZip.trim()) {
      errors.noticeAddressZip = "ZIP code is required";
      hasErrors = true;
    }

    // Validate borrower responded within 30 days (required if notice was sent)
    if (borrowerRespondedWithin30Days === null || borrowerRespondedWithin30Days === undefined) {
      errors.borrowerRespondedWithin30Days = "Please select if the borrower responded to the notice within 30 days";
      hasErrors = true;
    }

    // Validate borrower response date (required if borrower responded)
    if (borrowerRespondedWithin30Days === true) {
      if (!borrowerResponseDate || !borrowerResponseDate.trim()) {
        errors.borrowerResponseDate = "Date on which the borrower responded is required";
        hasErrors = true;
      } else if (noticeDate && noticeDate.trim()) {
        const noticeDateObj = new Date(noticeDate);
        const responseDate = new Date(borrowerResponseDate);
        
        if (!isNaN(noticeDateObj.getTime()) && !isNaN(responseDate.getTime())) {
          noticeDateObj.setHours(0, 0, 0, 0);
          responseDate.setHours(0, 0, 0, 0);
          
          if (responseDate < noticeDateObj) {
            errors.borrowerResponseDate = "Borrower Response Date must be on or after Notice Date";
            hasErrors = true;
          }
        }
      }

      // Validate proceeded with right to cure (required if borrower responded)
      if (proceededWithRightToCure === null || proceededWithRightToCure === undefined) {
        errors.proceededWithRightToCure = "Please select if the borrower proceeded with the right to cure";
        hasErrors = true;
      }
    }
  } else if (noticeSent === false) {
    // Validate acceleration date for non-notice path
    if (!manualOverrideReason || !manualOverrideReason.trim()) {
      errors.manualOverrideReason = "Acceleration date is required";
      hasErrors = true;
    } else if (!isDateInPast(manualOverrideReason)) {
      errors.manualOverrideReason = "Acceleration date must be in the past";
      hasErrors = true;
    }
  }

  return { hasErrors, errors };
};

/**
 * Validate Form 35B Compliance
 * @param {Object} formData - Form data object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validateForm35BCompliance = (formData) => {
  const errors = {};
  let hasErrors = false;

  // Validate certain mortgage loan selection
  if (
    formData.certainMortgageLoan === null ||
    formData.certainMortgageLoan === undefined
  ) {
    errors.certainMortgageLoan = "Please select whether this loan qualifies as a certain mortgage loan";
    hasErrors = true;
  }

  // Validate wasForm35BProvided - required if certainMortgageLoan is true
  if (formData.certainMortgageLoan === true) {
    if (
      formData.wasForm35BProvided === null ||
      formData.wasForm35BProvided === undefined
    ) {
      errors.wasForm35BProvided = "Please select whether a Form 35B was provided";
      hasErrors = true;
    }
  }

  return { hasErrors, errors };
};

/**
 * Validate Filing Entity
 * @param {Object} formData - Form data object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validateFilingEntity = (formData) => {
  const errors = {};
  let hasErrors = false;

  if (!formData.filingEntityLegalName?.trim()) {
    errors.filingEntityLegalName = "Filing Entity Legal Name is required";
    hasErrors = true;
  }

  if (!formData.filingEntityStreet1?.trim()) {
    errors.filingEntityStreet1 = "Street address is required";
    hasErrors = true;
  }

  if (!formData.filingEntityCity?.trim()) {
    errors.filingEntityCity = "City is required";
    hasErrors = true;
  }

  if (!formData.filingEntityState?.trim()) {
    errors.filingEntityState = "State is required";
    hasErrors = true;
  }

  if (!formData.filingEntityZip?.trim()) {
    errors.filingEntityZip = "ZIP code is required";
    hasErrors = true;
  }

  if (!formData.filingContactName?.trim()) {
    errors.filingContactName = "Contact name is required";
    hasErrors = true;
  }

  if (!formData.filingContactEmail?.trim()) {
    errors.filingContactEmail = "Contact email is required";
    hasErrors = true;
  } else if (!validateEmail(formData.filingContactEmail)) {
    errors.filingContactEmail = "Contact email must be a valid email address";
    hasErrors = true;
  }

  if (!formData.filingContactPhone?.trim()) {
    errors.filingContactPhone = "Contact phone is required";
    hasErrors = true;
  }

  return { hasErrors, errors };
};

/**
 * Validate Loan Assignees
 * @param {Object} formData - Form data object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validateLoanAssignees = (formData) => {
  const errors = {};
  let hasErrors = false;

  if (!formData.loanAssignees || !Array.isArray(formData.loanAssignees) || formData.loanAssignees.length === 0) {
    errors.loanAssignees = "At least one loan assignee must be entered";
    hasErrors = true;
  } else {
    formData.loanAssignees.forEach((assignee, index) => {
      if (!assignee.assigneeName?.trim()) {
        errors[`loanAssignees.${index}.assigneeName`] = "Assignee Name is required";
        hasErrors = true;
      }

      if (!assignee.assigneeTypeId || (typeof assignee.assigneeTypeId === 'string' && assignee.assigneeTypeId.trim() === "")) {
        errors[`loanAssignees.${index}.assigneeTypeId`] = "Assignee Type is required";
        hasErrors = true;
      }

      if (!assignee.assigneeRoleId || (typeof assignee.assigneeRoleId === 'string' && assignee.assigneeRoleId.trim() === "")) {
        errors[`loanAssignees.${index}.assigneeRoleId`] = "Assignee Role is required";
        hasErrors = true;
      }

      if (!assignee.street1?.trim()) {
        errors[`loanAssignees.${index}.street1`] = "Street Address is required";
        hasErrors = true;
      }

      if (!assignee.city?.trim()) {
        errors[`loanAssignees.${index}.city`] = "City is required";
        hasErrors = true;
      }

      if (!assignee.addressState?.trim()) {
        errors[`loanAssignees.${index}.addressState`] = "State is required";
        hasErrors = true;
      }

      if (!assignee.zip?.trim()) {
        errors[`loanAssignees.${index}.zip`] = "ZIP Code is required";
        hasErrors = true;
      }
    });
  }

  return { hasErrors, errors };
};

/**
 * Validate Petition Attestation
 * @param {Object} formData - Form data object
 * @param {Object} userProfile - User profile object
 * @returns {Object} Validation result with hasErrors flag and errors object
 */
export const validatePetitionAttestation = (formData, userProfile) => {
  const errors = {};
  let hasErrors = false;

  if (!formData.certification_check) {
    errors.certification_check = "You must certify the information is accurate";
    hasErrors = true;
  }

  if (!userProfile?.signatureImageName && !userProfile?.signatureUrl) {
    errors.signature = "Signature is required";
    hasErrors = true;
  }

  return { hasErrors, errors };
};

