/**
 * Petition form data management helpers
 */

import { STORAGE_KEYS } from '../../constants/appConstants';
import { logger } from '../../utils/logger';

/**
 * Default form data structure for petitions
 */
export const defaultFormData = {
  // Step 2: Property Details
  propertyStreet1: "",
  propertyStreet2: "",
  propertyCity: "",
  propertyState: "MA",
  propertyZip: "",
  propertyCounty: "",
  assessorParcelId: "",
  // Step 3: Loan Details
  isMinApplicable: "",
  minNumber: "",
  loanNumber: "",
  petitionLoanTypeId: "",
  petitionLoanTypeName: "",
  lienPosition: "",
  originationDate: "",
  originalPrincipalAmount: 0,
  currentPrincipalBalance: 0,
  interestRatePercent: null,
  variableRate: false,
  interestOnly: false,
  negativeAmortization: false,
  monthlyPaymentAmount: 0,
  delinquencyDaysAtFiling: null,
  mortgageBrokerLicenseNumber: "",
  mortgageLoanOriginatorLicenseNumber: "",
  lenderId: "",
  borrowerRequestedLoanModification: null,
  loanModificationRequestFinalized: null,
  // Step 4: Borrower Details
    borrowers: [
      {
        id: 1,
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        borrowerIsPrimary: true,
        mailingStreet1: "",
        mailingCity: "",
        mailingState: "",
        mailingZip: "",
        phone: "",
        email: "",
      },
    ],
  // Step 5: Filing Entity
  filingEntityLegalName: "",
  filingEntityRole: "",
  filingEntityStreet1: "",
  filingEntityStreet2: "",
  filingEntityCity: "",
  filingEntityState: "",
  filingEntityZip: "",
  filingContactName: "",
  filingContactEmail: "",
  filingContactPhone: "",
  nmlsLicenseNumber: "",
  stateLicenseNumber: "",
  stateLicenseState: "",
  // Step 6: Right-to-Cure (new array format)
  rightToCures: [],
  // Legacy fields for backward compatibility
  noticeSent: null,
  noticeDate: "",
  amountInDefault: 0,
  daysDelinquentAtNotice: 0,
  cureExpirationDate: "",
  noticeAddressStreet1: "",
  noticeAddressCity: "",
  noticeAddressState: "",
  noticeAddressZip: "",
  manualOverrideReason: "",
  // Step 7: Form 35B Compliance
  certainMortgageLoan: null,
  form35bComplianceAffidavitPdf: "",
  form35bNonApplicabilityAffidavitPdf: "",
  affiantName: "",
  affiantTitle: "",
  affidavitExecutionDate: "",
  // Step 8: Loan Assignees
  loanAssignees: [
    {
      assigneeName: "",
      assigneeTypeId: "",
      assigneeRoleId: "",
      street1: "",
      street2: "",
      city: "",
      addressState: "",
      zip: "",
      licenseNumber: "",
      licenseState: "",
    },
  ],
  // Step 9: Petition Attestation & Signatures
  signatures: [
    {
      signerFullName: "",
      signerTitle: "",
      signerEmail: "",
      esignConsent: false,
      signatureDrawnOrTyped: "",
      signedAt: "",
      signerIp: "",
      otpCode: "",
    },
  ],
  // Additional fields
  documents: [],
  certification_check: false,
  // Signer fields (prefilled from user data)
  signerFirstName: "",
  signerMiddleInitial: "",
  signerLastName: "",
  signerEmail: "",
  signerTitle: "",
};

/**
 * Load form data from sessionStorage
 * @returns {Object} Form data object or default form data
 */
export const loadFormDataFromStorage = () => {
  try {
    const savedData = sessionStorage.getItem(STORAGE_KEYS.PETITION_FORM_DATA);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      return { ...defaultFormData, ...parsedData };
    }
  } catch {
    // Error loading form data from localStorage - will use default data
  }
  return defaultFormData;
};

/**
 * Save form data to sessionStorage
 * @param {Object} data - Form data to save
 */
export const saveFormDataToStorage = (data) => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.PETITION_FORM_DATA, JSON.stringify(data));
  } catch {
    // Error saving form data to localStorage - non-critical
  }
};

/**
 * Clear form data from sessionStorage
 */
export const clearFormDataFromStorage = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.PETITION_FORM_DATA);
  } catch {
    // Error clearing form data from localStorage - non-critical
  }
};

/**
 * Transform API petition data to form data format (for take-over petitions)
 * @param {Object} petitionData - API response data (can be details object or full response)
 * @returns {Object} Transformed form data
 */
export const transformTakeOverPetitionData = (petitionData) => {
  if (!petitionData) {
    logger.error('transformTakeOverPetitionData: petitionData is null or undefined');
    return null;
  }

  // The API response structure is: { success: true, data: { property, loan, borrowers, ... } }
  // getPetitionById returns { success: true, data: {...} }, so petitionData is already the data object
  // OR if passed directly, it's the petition object with properties at root level
  // Handle both: { details: {...} } (transformed) or { property, loan, ... } (raw API response)
  const details = petitionData.details || petitionData;
  
  if (!details || typeof details !== 'object') {
    logger.error('transformTakeOverPetitionData: details is invalid', details);
    return null;
  }

  // Extract nested data - API has property, loan, borrowers, etc. at root level of data object
  const property = details.property || {};
  const loan = details.loan || {};
  const borrowers = details.borrowers || [];
  const filingEntity = details.filingEntity || {};

  // Map borrowers with proper structure
  const mappedBorrowers = borrowers.map((b, idx) => {
    const isPrimary = b.borrowerIsPrimary === true;
    return {
      id: b.id || idx + 1,
      firstName: b.firstName || "",
      middleName: b.middleName || "",
      lastName: b.lastName || "",
      suffix: b.suffix || "",
      borrowerIsPrimary: isPrimary,
      mailingStreet1: b.mailingStreet1 || "",
      mailingCity: b.mailingCity || "",
      mailingState: b.mailingState || "",
      mailingZip: b.mailingZip || "",
      phone: b.phone || "",
      email: b.email || "",
    };
  });

  // Ensure at least one primary borrower
  if (mappedBorrowers.length > 0 && !mappedBorrowers.some(b => b.borrowerIsPrimary)) {
    mappedBorrowers[0].borrowerIsPrimary = true;
  }

  return {
    // Property Details
    propertyStreet1: property.propertyStreet1 || property.street1 || "",
    propertyStreet2: property.propertyStreet2 || property.street2 || "",
    propertyCity: property.propertyCity || property.city || "",
    propertyState: property.propertyState || property.state || "MA",
    propertyZip: property.propertyZip || property.zip || "",
    propertyCounty: property.propertyCounty || property.county || "",
    assessorParcelId: property.assessorParcelId || "",

    // Loan Details
    isMinApplicable: loan.minNumber && loan.minNumber.trim() ? "yes" : "no",
    minNumber: loan.minNumber || "",
    loanNumber: loan.loanNumber || "",
    petitionLoanTypeId: loan.petitionLoanTypeId || loan.loanTypeId || "",
    petitionLoanTypeName: loan.petitionLoanTypeName || loan.loanTypeName || "",
    lienPosition: loan.lienPosition != null ? loan.lienPosition : "",
    originationDate: loan.originationDate ? loan.originationDate.split("T")[0] : "",
    originalPrincipalAmount: loan.originalPrincipalAmount || 0,
    currentPrincipalBalance: loan.currentPrincipalBalance || 0,
    interestRatePercent: loan.interestRatePercent || null,
    variableRate: loan.variableRate || false,
    interestOnly: loan.interestOnly || false,
    negativeAmortization: loan.negativeAmortization || false,
    monthlyPaymentAmount: loan.monthlyPaymentAmount || 0,
    delinquencyDaysAtFiling: loan.delinquencyDaysAtFiling || null,
    mortgageBrokerLicenseNumber: loan.mortgageBrokerLicenseNumber || "",
    mortgageLoanOriginatorLicenseNumber: loan.mortgageLoanOriginatorLicenseNumber || "",
    lenderId: loan.lenderId || "",
    borrowerRequestedLoanModification: loan.borrowerRequestedLoanModification !== undefined ? loan.borrowerRequestedLoanModification : null,
    loanModificationRequestFinalized: loan.loanModificationRequestFinalized !== undefined ? loan.loanModificationRequestFinalized : null,

    // Borrower Details
    borrowers: mappedBorrowers.length > 0 ? mappedBorrowers : defaultFormData.borrowers,

    // Filing Entity - DO NOT pre-fill, user must select organization and fill this themselves
    filingEntityTypeId: null,
    filingEntityLegalName: "",
    filingEntityRole: "",
    filingEntityStreet1: "",
    filingEntityStreet2: "",
    filingEntityCity: "",
    filingEntityState: "",
    filingEntityZip: "",
    filingContactName: "",
    filingContactEmail: "",
    filingContactPhone: "",
    nmlsLicenseNumber: "",
    stateLicenseNumber: "",
    stateLicenseState: "",

    // Right-to-Cure
    // Handle both rightToCures array (new format) and rightToCure object (old format)
    // Map all rightToCures from the array, preserving all fields including id
    rightToCures: details.rightToCures && Array.isArray(details.rightToCures) && details.rightToCures.length > 0
      ? details.rightToCures.map((rtc) => ({
          id: rtc.id || null,
          noticeSent: rtc.noticeSent ?? null,
          noticeDate: rtc.noticeDate ? rtc.noticeDate.split("T")[0] : "",
          amountInDefault: rtc.amountInDefault || 0,
          daysDelinquentAtNotice: rtc.daysDelinquentAtNotice || 0,
          cureExpirationDate: rtc.cureExpirationDate ? rtc.cureExpirationDate.split("T")[0] : "",
          noticeAddressStreet1: rtc.noticeAddressStreet1 || "",
          noticeAddressCity: rtc.noticeAddressCity || "",
          noticeAddressState: rtc.noticeAddressState || "",
          noticeAddressZip: rtc.noticeAddressZip || "",
          manualOverrideReason: rtc.manualOverrideReason || "",
          borrowerRespondedWithin30Days: rtc.borrowerRespondedWithin30Days ?? null,
          borrowerResponseDate: rtc.borrowerResponseDate ? rtc.borrowerResponseDate.split("T")[0] : "",
          proceededWithRightToCure: rtc.proceededWithRightToCure ?? null,
        }))
      : details.rightToCure
      ? [{
          id: details.rightToCure.id || null,
          noticeSent: details.rightToCure.noticeSent ?? null,
          noticeDate: details.rightToCure.noticeDate ? details.rightToCure.noticeDate.split("T")[0] : "",
          amountInDefault: details.rightToCure.amountInDefault || 0,
          daysDelinquentAtNotice: details.rightToCure.daysDelinquentAtNotice || 0,
          cureExpirationDate: details.rightToCure.cureExpirationDate ? details.rightToCure.cureExpirationDate.split("T")[0] : "",
          noticeAddressStreet1: details.rightToCure.noticeAddressStreet1 || "",
          noticeAddressCity: details.rightToCure.noticeAddressCity || "",
          noticeAddressState: details.rightToCure.noticeAddressState || "",
          noticeAddressZip: details.rightToCure.noticeAddressZip || "",
          manualOverrideReason: details.rightToCure.manualOverrideReason || "",
          borrowerRespondedWithin30Days: details.rightToCure.borrowerRespondedWithin30Days ?? null,
          borrowerResponseDate: details.rightToCure.borrowerResponseDate ? details.rightToCure.borrowerResponseDate.split("T")[0] : "",
          proceededWithRightToCure: details.rightToCure.proceededWithRightToCure ?? null,
        }]
      : [],
    // Legacy fields for backward compatibility
    noticeSent: details.rightToCures?.[0]?.noticeSent ?? details.rightToCure?.noticeSent ?? null,
    noticeDate: details.rightToCures?.[0]?.noticeDate ? details.rightToCures[0].noticeDate.split("T")[0] : (details.rightToCure?.noticeDate ? details.rightToCure.noticeDate.split("T")[0] : ""),
    amountInDefault: details.rightToCures?.[0]?.amountInDefault ?? details.rightToCure?.amountInDefault ?? 0,
    daysDelinquentAtNotice: details.rightToCures?.[0]?.daysDelinquentAtNotice ?? details.rightToCure?.daysDelinquentAtNotice ?? 0,
    cureExpirationDate: details.rightToCures?.[0]?.cureExpirationDate ? details.rightToCures[0].cureExpirationDate.split("T")[0] : (details.rightToCure?.cureExpirationDate ? details.rightToCure.cureExpirationDate.split("T")[0] : ""),
    noticeAddressStreet1: details.rightToCures?.[0]?.noticeAddressStreet1 || details.rightToCure?.noticeAddressStreet1 || "",
    noticeAddressCity: details.rightToCures?.[0]?.noticeAddressCity || details.rightToCure?.noticeAddressCity || "",
    noticeAddressState: details.rightToCures?.[0]?.noticeAddressState || details.rightToCure?.noticeAddressState || "",
    noticeAddressZip: details.rightToCures?.[0]?.noticeAddressZip || details.rightToCure?.noticeAddressZip || "",
    manualOverrideReason: details.rightToCures?.[0]?.manualOverrideReason || details.rightToCure?.manualOverrideReason || "",

    // Form 35B Compliance
    certainMortgageLoan: details.affidavit?.certainMortgageLoan ?? null,
    form35bComplianceAffidavitPdf: details.affidavit?.form35bComplianceAffidavitPdf || "",
    form35bNonApplicabilityAffidavitPdf: details.affidavit?.form35bNonApplicabilityAffidavitPdf || "",
    affiantName: details.affidavit?.affiantName || "",
    affiantTitle: details.affidavit?.affiantTitle || "",
    affidavitExecutionDate: details.affidavit?.affidavitExecutionDate ? details.affidavit.affidavitExecutionDate.split("T")[0] : "",

    // Loan Assignees
    loanAssignees: details.loanAssignees?.map((a, idx) => ({
      assigneeName: a.assigneeName || "",
      assigneeTypeId: a.assigneeTypeId || "",
      assigneeRoleId: a.assigneeRoleId || "",
      street1: a.street1 || "",
      street2: a.street2 || "",
      city: a.city || "",
      addressState: a.addressState || "",
      zip: a.zip || "",
      licenseNumber: a.licenseNumber || "",
      licenseState: a.licenseState || "",
    })) || [],

    // Additional
    documents: details.documents || [],
    isAllStepsCompleted: false,
    organizationId: null, // DO NOT pre-fill, user must select organization on step 1
    
    // Judgment - Set to null/empty for take over (user must fill this themselves)
    judgment: null,
    
    // Foreclosure Sale - Set to null/empty for take over (user must fill this themselves)
    foreclosureSale: null,
    
    // Signer fields - will be filled with current user's details in handleTakeOverConfirm
    signerFirstName: "",
    signerMiddleInitial: "",
    signerLastName: "",
    signerEmail: "",
    signerTitle: "",
    certification_check: false,
    
    // Signatures - will be pre-filled with current user's details in handleTakeOverConfirm
    signatures: defaultFormData.signatures,
  };
};

