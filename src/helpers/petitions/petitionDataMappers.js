/**
 * Petition data mapping and transformation utilities
 */

import { safeDateConversion, dateToISO, isValidUUID } from '../../utils/serviceUtils';

/**
 * Map status number to display format
 * @param {string|number} status - Status number
 * @returns {Object} Status display info with text and class
 */
export const getStatusDisplay = (status) => {
  const statusNum = typeof status === 'string' ? status : String(status);
  switch (statusNum) {
    case "0": return { text: "Draft", class: "Draft" };
    case "1": return { text: "Submitted", class: "Submitted" };
    case "2": return { text: "Foreclosure Sale Initiated", class: "ForeclosureSaleInitiated" };
    case "3": return { text: "Judgment Submitted", class: "JudgmentSubmitted" };
    case "4": return { text: "Returned", class: "Returned" };
    case "5": return { text: "Resubmitted", class: "Resubmitted" };
    case "6": return { text: "Accepted", class: "Accepted" };
    case "7": return { text: "Closed", class: "Closed" };
    default: return { text: "Unknown", class: "Unknown" };
  }
};

/**
 * Map borrower data to API format
 * @param {Object} borrower - Borrower form data
 * @returns {Object} Mapped borrower data
 */
export const mapBorrowerToApi = (borrower) => ({
  id: borrower.id || null,
  firstName: borrower.firstName || "",
  middleName: borrower.middleName || "",
  lastName: borrower.lastName || "",
  suffix: borrower.suffix || "",
  borrowerIsPrimary: borrower.borrowerIsPrimary || false,
  mailingStreet1: borrower.mailingStreet1 || "",
  mailingCity: borrower.mailingCity || "",
  mailingState: borrower.mailingState || "",
  mailingZip: borrower.mailingZip || "",
  phone: borrower.phone || "",
  email: borrower.email || ""
});

/**
 * Map borrower data from form (without id for new submissions)
 * @param {Object} borrower - Borrower form data
 * @returns {Object} Mapped borrower data for submission
 */
export const mapBorrowerForSubmission = (borrower) => ({
  firstName: borrower.firstName || "",
  middleName: borrower.middleName || "",
  lastName: borrower.lastName || "",
  suffix: borrower.suffix || "",
  borrowerIsPrimary: borrower.borrowerIsPrimary || false,
  mailingStreet1: borrower.mailingStreet1 || "",
  mailingCity: borrower.mailingCity || "",
  mailingState: borrower.mailingState || "",
  mailingZip: borrower.mailingZip || "",
  phone: borrower.phone || "",
  email: borrower.email || ""
});

/**
 * Map loan assignee data to API format
 * @param {Object} assignee - Assignee form data
 * @returns {Object} Mapped assignee data
 */
export const mapLoanAssigneeToApi = (assignee) => {
  let assigneeId = null;
  if (assignee.id && typeof assignee.id === 'string' && assignee.id.includes('-')) {
    // It's a UUID string, use it
    assigneeId = assignee.id;
  } else if (assignee.id && typeof assignee.id === 'number') {
    // It's a temporary ID (number), set to null for new entries
    assigneeId = null;
  } else if (assignee.id && isValidUUID(assignee.id)) {
    assigneeId = assignee.id;
  }

  return {
    id: assigneeId,
    assigneeName: assignee.assigneeName || "",
    assigneeTypeId: assignee.assigneeTypeId && assignee.assigneeTypeId.trim() !== '' ? assignee.assigneeTypeId : null,
    assigneeRoleId: assignee.assigneeRoleId && assignee.assigneeRoleId.trim() !== '' ? assignee.assigneeRoleId : null,
    street1: assignee.street1 || "",
    street2: assignee.street2 || "",
    city: assignee.city || "",
    addressState: assignee.addressState || "",
    zip: assignee.zip || "",
    licenseNumber: assignee.licenseNumber || "",
    licenseState: assignee.licenseState || ""
  };
};

/**
 * Map loan assignee for submission (without id)
 * @param {Object} assignee - Assignee form data
 * @returns {Object} Mapped assignee data for submission
 */
export const mapLoanAssigneeForSubmission = (assignee) => ({
  assigneeName: assignee.assigneeName && assignee.assigneeName.trim() !== '' ? assignee.assigneeName : null,
  assigneeTypeId: assignee.assigneeTypeId && assignee.assigneeTypeId.trim() !== '' ? assignee.assigneeTypeId : null,
  assigneeRoleId: assignee.assigneeRoleId && assignee.assigneeRoleId.trim() !== '' ? assignee.assigneeRoleId : null,
  street1: assignee.street1 || null,
  street2: assignee.street2 || null,
  city: assignee.city || null,
  addressState: assignee.addressState || null,
  zip: assignee.zip || null,
  licenseNumber: assignee.licenseNumber || null,
  licenseState: assignee.licenseState || null
});

/**
 * Map signature data to API format
 * @param {Object} signature - Signature form data
 * @returns {Object} Mapped signature data
 */
export const mapSignatureToApi = (signature) => {
  let signatureId = null;
  if (signature.id && typeof signature.id === 'string' && signature.id.includes('-')) {
    signatureId = signature.id;
  } else if (signature.id && typeof signature.id === 'number') {
    signatureId = null;
  } else if (signature.id && isValidUUID(signature.id)) {
    signatureId = signature.id;
  }

  return {
    id: signatureId,
    signerFullName: signature.signerFullName || "",
    signerTitle: signature.signerTitle || "",
    signerEmail: signature.signerEmail || "",
    esignConsent: signature.esignConsent !== null && signature.esignConsent !== undefined ? signature.esignConsent : false,
    signatureDrawnOrTyped: signature.signatureDrawnOrTyped || "",
    signedAt: safeDateConversion(signature.signedAt),
    signerIp: signature.signerIp || "",
    otpCode: signature.otpCode || ""
  };
};

/**
 * Map signature for submission (preserves all fields)
 * @param {Object} signature - Signature form data
 * @returns {Object} Mapped signature data for submission
 */
export const mapSignatureForSubmission = (signature) => ({
  ...signature,
  signedAt: safeDateConversion(signature.signedAt)
});

/**
 * Map right to cure data to API format
 * @param {Object} rtc - Right to cure form data
 * @returns {Object} Mapped right to cure data
 */
export const mapRightToCureToApi = (rtc) => {
  const rtcId = isValidUUID(rtc.id) ? rtc.id : null;

  return {
    id: rtcId,
    noticeSent: rtc.noticeSent !== null && rtc.noticeSent !== undefined ? rtc.noticeSent : null,
    noticeDate: safeDateConversion(rtc.noticeDate),
    amountInDefault: parseFloat(rtc.amountInDefault) || 0,
    daysDelinquentAtNotice: parseInt(rtc.daysDelinquentAtNotice) || 0,
    cureExpirationDate: safeDateConversion(rtc.cureExpirationDate),
    noticeAddressStreet1: rtc.noticeAddressStreet1 || "",
    noticeAddressCity: rtc.noticeAddressCity || "",
    noticeAddressState: rtc.noticeAddressState || "",
    noticeAddressZip: rtc.noticeAddressZip || "",
    manualOverrideReason: rtc.manualOverrideReason || "",
    borrowerRespondedWithin30Days: (rtc.noticeSent === false || rtc.noticeSent === null || rtc.noticeSent === undefined) 
      ? null 
      : (rtc.borrowerRespondedWithin30Days !== null && rtc.borrowerRespondedWithin30Days !== undefined ? rtc.borrowerRespondedWithin30Days : false),
    borrowerResponseDate: safeDateConversion(rtc.borrowerResponseDate),
    proceededWithRightToCure: (rtc.noticeSent === false || rtc.noticeSent === null || rtc.noticeSent === undefined) 
      ? null 
      : (rtc.proceededWithRightToCure !== null && rtc.proceededWithRightToCure !== undefined ? rtc.proceededWithRightToCure : false)
  };
};

/**
 * Map right to cure for submission
 * @param {Object} rtc - Right to cure form data
 * @returns {Object} Mapped right to cure data for submission
 */
export const mapRightToCureForSubmission = (rtc) => ({
  id: rtc.id || null,
  noticeSent: rtc.noticeSent !== null && rtc.noticeSent !== undefined ? rtc.noticeSent : null,
  noticeDate: safeDateConversion(rtc.noticeDate),
  amountInDefault: parseFloat(rtc.amountInDefault) || 0,
  daysDelinquentAtNotice: parseInt(rtc.daysDelinquentAtNotice) || 0,
  cureExpirationDate: safeDateConversion(rtc.cureExpirationDate),
  noticeAddressStreet1: rtc.noticeAddressStreet1 || "",
  noticeAddressCity: rtc.noticeAddressCity || "",
  noticeAddressState: rtc.noticeAddressState || "",
  noticeAddressZip: rtc.noticeAddressZip || "",
  manualOverrideReason: rtc.manualOverrideReason || "",
  borrowerRespondedWithin30Days: (rtc.noticeSent === false || rtc.noticeSent === null || rtc.noticeSent === undefined) 
    ? null 
    : (rtc.borrowerRespondedWithin30Days !== null && rtc.borrowerRespondedWithin30Days !== undefined ? rtc.borrowerRespondedWithin30Days : false),
  borrowerResponseDate: safeDateConversion(rtc.borrowerResponseDate),
  proceededWithRightToCure: (rtc.noticeSent === false || rtc.noticeSent === null || rtc.noticeSent === undefined) 
    ? null 
    : (rtc.proceededWithRightToCure !== null && rtc.proceededWithRightToCure !== undefined ? rtc.proceededWithRightToCure : false)
});

/**
 * Get primary borrower name from borrowers array
 * @param {Array} borrowers - Array of borrower objects
 * @returns {string} Primary borrower's full name
 */
export const getPrimaryBorrowerName = (borrowers) => {
  if (!borrowers || borrowers.length === 0) {
    return 'N/A';
  }

  // Find the primary borrower first
  let borrower = borrowers.find(b => b.borrowerIsPrimary === true);
  
  // If no primary borrower found, fall back to the first borrower
  if (!borrower) {
    borrower = borrowers[0];
  }
  
  const nameParts = [borrower.firstName, borrower.middleName, borrower.lastName, borrower.suffix]
    .filter(part => part && part.trim())
    .map(part => part.trim());
  return nameParts.join(' ') || 'N/A';
};

/**
 * Format property address from property object
 * @param {Object} property - Property object
 * @returns {string} Formatted address string
 */
export const formatPropertyAddress = (property) => {
  if (!property) return 'N/A';
  
  const addressParts = [
    property.propertyStreet1,
    property.propertyStreet2,
    property.propertyCity,
    property.propertyState,
    property.propertyZip
  ].filter(part => part && part.trim());
  
  return addressParts.join(', ') || 'N/A';
};

/**
 * Format loan amount from loan object
 * @param {Object} loan - Loan object
 * @returns {string} Formatted loan amount
 */
export const formatLoanAmount = (loan) => {
  if (!loan) return 'N/A';
  
  if (loan.currentPrincipalBalance) {
    return `$${parseFloat(loan.currentPrincipalBalance).toLocaleString()}`;
  } else if (loan.originalPrincipalAmount) {
    return `$${parseFloat(loan.originalPrincipalAmount).toLocaleString()}`;
  }
  
  return 'N/A';
};

