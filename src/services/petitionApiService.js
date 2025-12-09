import axiosInstance from '../api/axiosInstance';
import { PAGINATION } from '../constants/appConstants';
import { PETITION_ENDPOINTS } from '../constants/apiEndpoints';
import axios from 'axios';
import Config from '../config/index';
import { SERVICE_HEADERS, safeDateConversion, dateToISO, fileToBase64, safeParseInt, safeParseFloat, safeString, isValidUUID } from '../utils/serviceUtils';
import {
  getStatusDisplay,
  mapBorrowerToApi,
  mapBorrowerForSubmission,
  mapLoanAssigneeToApi,
  mapLoanAssigneeForSubmission,
  mapSignatureToApi,
  mapSignatureForSubmission,
  mapRightToCureToApi,
  mapRightToCureForSubmission,
  getPrimaryBorrowerName,
  formatPropertyAddress,
  formatLoanAmount
} from '../helpers/petitions/petitionDataMappers';

class PetitionApiService {
  // Submit a new petition
  async submitPetition(petitionData) {
    const response = await axiosInstance.post(PETITION_ENDPOINTS.SUBMIT_PETITION, petitionData);
    return response.data;
  }


  // Get petition count by organization ID or user ID
  async getPetitionCount(params) {
    const { organizationId, userId } = params;
    
    const requestBody = {};
    if (organizationId) {
      requestBody.organizationId = organizationId;
    }
    if (userId) {
      requestBody.userId = userId;
    }
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.GET_PETITION_COUNT, requestBody, {
      headers: SERVICE_HEADERS.JSON
    });
    
    return response.data;
  }

  async deletePetitionById(petitionId) {
    if (!petitionId) {
      throw new Error('Petition ID is required to delete a petition.');
    }
 
    const response = await axiosInstance.delete(PETITION_ENDPOINTS.DELETE_PETITION_BY_ID(petitionId), {
      headers: SERVICE_HEADERS.TEXT_PLAIN
    });
 
    return response.data;
  }

  // Get petition by ID
  async getPetitionById(petitionId) {
    const response = await axiosInstance.get(PETITION_ENDPOINTS.GET_PETITION_BY_ID(petitionId), {
      headers: SERVICE_HEADERS.TEXT_PLAIN
    });
    
    return response.data;
  }

  // Submit note (add or update)
  async submitNote(petitionId, noteId, noteText) {
    const requestBody = {
      petitionId: petitionId,
      noteText: noteText
    };
    
    // Only include noteId when updating (not when adding a new note)
    if (noteId) {
      requestBody.noteId = noteId;
    }
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.SUBMIT_NOTE, requestBody, {
      headers: SERVICE_HEADERS.JSON
    });
    
    return response.data;
  }

  // Update property details
  async updateProperty(petitionId, propertyData) {
    const requestBody = {
      petitionId: petitionId,
      petitionProperty: {
        id: propertyData.id || null,
        propertyStreet1: safeString(propertyData.propertyStreet1),
        propertyStreet2: safeString(propertyData.propertyStreet2),
        propertyCity: safeString(propertyData.propertyCity),
        propertyState: safeString(propertyData.propertyState, "MA"),
        propertyZip: safeString(propertyData.propertyZip),
        propertyCounty: safeString(propertyData.propertyCounty),
        assessorParcelId: safeString(propertyData.assessorParcelId)
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_PROPERTY, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update loan details
  async updateLoan(petitionId, loanData) {
    const requestBody = {
      petitionId: petitionId,
      petitionLoan: {
        id: loanData.id || null,
        minNumber: loanData.minNumber || "",
        loanNumber: loanData.loanNumber || "",
        petitionLoanTypeId: loanData.petitionLoanTypeId && loanData.petitionLoanTypeId.trim() !== '' ? loanData.petitionLoanTypeId : null,
        petitionLoanTypeName: loanData.petitionLoanTypeName || "",
        lienPosition: (loanData.lienPosition === null || loanData.lienPosition === undefined || loanData.lienPosition === "") 
          ? null 
          : (typeof loanData.lienPosition === 'number' ? loanData.lienPosition : parseInt(loanData.lienPosition)),
        originationDate: dateToISO(loanData.originationDate),
        originalPrincipalAmount: safeParseFloat(loanData.originalPrincipalAmount),
        currentPrincipalBalance: safeParseFloat(loanData.currentPrincipalBalance),
        interestRatePercent: safeParseFloat(loanData.interestRatePercent),
        variableRate: loanData.variableRate || false,
        interestOnly: loanData.interestOnly || false,
        negativeAmortization: loanData.negativeAmortization || false,
        monthlyPaymentAmount: safeParseFloat(loanData.monthlyPaymentAmount),
        delinquencyDaysAtFiling: safeParseInt(loanData.delinquencyDaysAtFiling),
        mortgageBrokerLicenseNumber: loanData.mortgageBrokerLicenseNumber || "",
        mortgageLoanOriginatorLicenseNumber: loanData.mortgageLoanOriginatorLicenseNumber || "",
        lenderId: loanData.lenderId && loanData.lenderId.trim() !== '' ? loanData.lenderId : null,
        borrowerRequestedLoanModification: loanData.borrowerRequestedLoanModification !== null && loanData.borrowerRequestedLoanModification !== undefined ? loanData.borrowerRequestedLoanModification : false,
        loanModificationRequestFinalized: loanData.loanModificationRequestFinalized !== null && loanData.loanModificationRequestFinalized !== undefined ? loanData.loanModificationRequestFinalized : false
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_LOAN, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update filing entity details
  async updateFilingEntity(petitionId, filingEntityData) {
    const requestBody = {
      petitionId: petitionId,
      petitionFilingEntity: {
        id: filingEntityData.id || null,
        filingEntityLegalName: filingEntityData.filingEntityLegalName || "",
        filingEntityTypeId: filingEntityData.filingEntityTypeId && filingEntityData.filingEntityTypeId.trim() !== '' ? filingEntityData.filingEntityTypeId : null,
        filingEntityStreet1: filingEntityData.filingEntityStreet1 || "",
        filingEntityStreet2: filingEntityData.filingEntityStreet2 || "",
        filingEntityCity: filingEntityData.filingEntityCity || "",
        filingEntityState: filingEntityData.filingEntityState || "",
        filingEntityZip: filingEntityData.filingEntityZip || "",
        filingContactName: filingEntityData.filingContactName || "",
        filingContactEmail: filingEntityData.filingContactEmail || "",
        filingContactPhone: filingEntityData.filingContactPhone || "",
        nmlsLicenseNumber: filingEntityData.nmlsLicenseNumber || "",
        stateLicenseNumber: filingEntityData.stateLicenseNumber || "",
        stateLicenseState: filingEntityData.stateLicenseState || ""
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_FILING_ENTITY, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update borrowers
  async updateBorrowers(petitionId, borrowersData) {
    const requestBody = {
      petitionId: petitionId,
      petitionBorrowers: borrowersData.map(mapBorrowerToApi)
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_BORROWERS, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update affidavit (Form 35B Compliance)
  async updateAffidavit(petitionId, affidavitData) {
    // Convert PDF files to base64 if they are File objects
    const form35bComplianceAffidavitPdf = await fileToBase64(affidavitData.form35bComplianceAffidavitPdf);
    const form35bNonApplicabilityAffidavitPdf = await fileToBase64(affidavitData.form35bNonApplicabilityAffidavitPdf);

    const requestBody = {
      petitionId: petitionId,
      petitionAffidavit: {
        id: affidavitData.id || null,
        certainMortgageLoan: affidavitData.certainMortgageLoan !== null && affidavitData.certainMortgageLoan !== undefined ? affidavitData.certainMortgageLoan : false,
        form35bComplianceAffidavitPdf: form35bComplianceAffidavitPdf,
        form35bNonApplicabilityAffidavitPdf: form35bNonApplicabilityAffidavitPdf,
        affiantName: affidavitData.affiantName || "",
        affiantTitle: affidavitData.affiantTitle || "",
        affidavitExecutionDate: dateToISO(affidavitData.affidavitExecutionDate)
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_AFFIDAVIT, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update right to cures
  async updateRightToCures(petitionId, rightToCuresData) {
    // Map right to cures data, ensuring new entries have id: null
    const mappedRightToCures = rightToCuresData.map(mapRightToCureToApi);

    const requestBody = {
      petitionId: petitionId,
      petitionRightToCures: mappedRightToCures
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_RIGHT_TO_CURE, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update loan assignees
  async updateLoanAssignees(petitionId, loanAssigneesData) {
    // Map loan assignees data, ensuring new entries have id: null
    const mappedLoanAssignees = loanAssigneesData.map(mapLoanAssigneeToApi);

    const requestBody = {
      petitionId: petitionId,
      petitionLoanAssignees: mappedLoanAssignees
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_LOAN_ASSIGNEES, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update signatures
  async updateSignatures(petitionId, signaturesData) {
    // Map signatures data, ensuring new entries have id: null
    const mappedSignatures = signaturesData.map(mapSignatureToApi);

    const requestBody = {
      petitionId: petitionId,
      petitionSignatures: mappedSignatures
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_SIGNATURES, requestBody, {
      headers: SERVICE_HEADERS.JSON
    });
    
    return response.data;
  }

  // Update foreclosure sale
  async updateForeclosure(petitionId, foreclosureData) {

    const requestBody = {
      petitionId: petitionId,
      petitionForeclosureSale: {
        id: foreclosureData.id || null,
        saleDate: safeDateConversion(foreclosureData.saleDate),
        soldToId: foreclosureData.soldToId && foreclosureData.soldToId.trim() !== '' ? foreclosureData.soldToId : null,
        vestingEntityName: foreclosureData.vestingEntityName || "",
        reoEntityName: foreclosureData.reoEntityName || "",
        reoContactFirstName: foreclosureData.reoContactFirstName || "",
        reoContactLastName: foreclosureData.reoContactLastName || "",
        reoBusinessPhone: foreclosureData.reoBusinessPhone || "",
        reoEmergencyPhone: foreclosureData.reoEmergencyPhone || "",
        requestedAlternativeToForeclosure: foreclosureData.requestedAlternativeToForeclosure !== null && foreclosureData.requestedAlternativeToForeclosure !== undefined ? foreclosureData.requestedAlternativeToForeclosure : false,
        foreclosureAlternativeOption: foreclosureData.foreclosureAlternativeOption !== null && foreclosureData.foreclosureAlternativeOption !== undefined 
          ? (typeof foreclosureData.foreclosureAlternativeOption === 'number' 
              ? foreclosureData.foreclosureAlternativeOption 
              : parseInt(foreclosureData.foreclosureAlternativeOption, 10))
          : null
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_FORECLOSURE, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update judgment
  async updateJudgment(petitionId, judgmentData) {

    const requestBody = {
      petitionId: petitionId,
      petitionJudgment: {
        id: judgmentData.id || null,
        petitionId: petitionId,
        judgmentDate: safeDateConversion(judgmentData.judgmentDate),
        judgmentType: judgmentData.judgmentType !== null && judgmentData.judgmentType !== undefined 
          ? (typeof judgmentData.judgmentType === 'number' 
              ? judgmentData.judgmentType 
              : parseInt(judgmentData.judgmentType, 10))
          : 0,
        courtInformation: judgmentData.courtInformation || "",
        docketNumbers: judgmentData.docketNumbers || ""
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_JUDGMENT, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  // Update petition status
  async updateStatus(petitionId, newStatus) {
    if (!petitionId) {
      throw new Error('Petition ID is required to update status.');
    }
    if (!newStatus) {
      throw new Error('New status is required.');
    }

    const requestBody = {
      petitionId: petitionId,
      newStatus: newStatus
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_STATUS, requestBody, {
      headers: SERVICE_HEADERS.JSON_WILDCARD
    });
    
    return response.data;
  }

  /**
   * Get paginated petitions by organization ID or user ID with filters, search, and sorting
   * @param {Object} paginationParams - The pagination and filter parameters
   * @param {string} [paginationParams.organizationId] - Organization ID (for org admins)
   * @param {string} [paginationParams.userId] - User ID (for filers)
   * @param {number} [paginationParams.pageNumber=1] - Page number (1-based)
   * @param {number} [paginationParams.pageSize] - Number of items per page (default: PAGINATION.DEFAULT_PAGE_SIZE)
   * @param {string} [paginationParams.searchText=""] - Search text for filtering
   * @param {number} [paginationParams.status=null] - Status filter (null=all, 0=draft, 1=submitted, etc.)
   * @param {string|Date} [paginationParams.fromDate] - Start date for date range filter
   * @param {string|Date} [paginationParams.toDate] - End date for date range filter
   * @param {string} [paginationParams.sortColumn="CreatedDate"] - Sort column (PetitionNumber, CreatedDate, ModifiedDate)
   * @param {string} [paginationParams.sortDirection="desc"] - Sort direction (asc, desc)
   * @returns {Promise<Object>} API response with paginated petition data
   */
  async getPetitionsPaged(paginationParams) {
    // Use the helper method to create validated parameters
    const validatedParams = this.createPaginationParams(paginationParams);
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.GET_PETITIONS_PAGED, validatedParams, {
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  createPaginationParams(options = {}) {
    const {
      organizationId,
      userId,
      pageNumber = 1,
      pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      searchText = "",
      status = null,
      fromDate = null,
      toDate = null,
      sortColumn = "CreatedDate",
      sortDirection = "desc"
    } = options;

    // Validate that at least one of organizationId or userId is provided
    if (!organizationId && !userId) {
      throw new Error('Either organizationId or userId is required');
    }

    // Validate sort column
    const allowedSortColumns = ["PetitionNumber", "CreatedDate", "ModifiedDate"];
    const validSortColumn = allowedSortColumns.includes(sortColumn) ? sortColumn : "CreatedDate";

    // Validate sort direction
    const allowedSortDirections = ["asc", "desc"];
    const validSortDirection = allowedSortDirections.includes(sortDirection.toLowerCase()) ? sortDirection.toLowerCase() : "desc";

    // Build parameters object
    const params = {
      pageNumber: Math.max(1, parseInt(pageNumber) || 1), // Ensure minimum page 1
      pageSize: Math.max(1, parseInt(pageSize) || PAGINATION.DEFAULT_PAGE_SIZE),
      status: status !== null ? parseInt(status) : null,
      sortColumn: validSortColumn,
      sortDirection: validSortDirection
    };

    // Add organizationId or userId (only one should be sent)
    if (organizationId) {
      params.organizationId = organizationId;
    }
    if (userId) {
      params.userId = userId;
    }

    // Add optional parameters only if they have values
    if (searchText && searchText.trim()) {
      params.searchText = searchText.trim();
    }

    if (fromDate) {
      params.fromDate = new Date(fromDate).toISOString();
    }

    if (toDate) {
      params.toDate = new Date(toDate).toISOString();
    }

    return params;
  }

  // Transform form data to API format
  async transformFormDataToApiFormat(formData, organizationId, petitionId = null, statusString = null) {

    
    const petitionData = {
      id: petitionId,
      status: statusString || null, // Send status string for judgment/foreclosure saves, null for others
      isAllStepsCompleted: formData.isAllStepsCompleted || false,
      organizationId: organizationId,
      duplicateHash: "",
      takeOverToUserId: formData.takeOverToUserId || null, 
      property: {
        propertyStreet1: formData.propertyStreet1 || "",
        propertyStreet2: formData.propertyStreet2 || "",
        propertyCity: formData.propertyCity || "",
        propertyState: formData.propertyState || "MA",
        propertyZip: formData.propertyZip || "",
        propertyCounty: formData.propertyCounty || "",
        assessorParcelId: formData.assessorParcelId || ""
      },
      loan: {
        minNumber: formData.isMinApplicable === "yes" ? (formData.minNumber || "") : "",
        loanNumber: formData.loanNumber || "",
        petitionLoanTypeId: formData.petitionLoanTypeId && formData.petitionLoanTypeId.trim() !== '' ? formData.petitionLoanTypeId : null,
        petitionLoanTypeName: formData.petitionLoanTypeName || "",
        // lienPosition can be 0 (for "First"), so only convert to null if not selected
        lienPosition: (formData.lienPosition === null || formData.lienPosition === undefined || formData.lienPosition === "") 
          ? null 
          : (typeof formData.lienPosition === 'number' ? formData.lienPosition : parseInt(formData.lienPosition)),
        originationDate: safeDateConversion(formData.originationDate),
        originalPrincipalAmount: parseFloat(formData.originalPrincipalAmount) || 0,
        currentPrincipalBalance: parseFloat(formData.currentPrincipalBalance) || 0,
        interestRatePercent: parseFloat(formData.interestRatePercent) || 0,
        variableRate: formData.variableRate || false,
        interestOnly: formData.interestOnly || false,
        negativeAmortization: formData.negativeAmortization || false,
        monthlyPaymentAmount: parseFloat(formData.monthlyPaymentAmount) || 0,
        delinquencyDaysAtFiling: parseInt(formData.delinquencyDaysAtFiling) || 0,
        mortgageBrokerLicenseNumber: formData.mortgageBrokerLicenseNumber || null,
        mortgageLoanOriginatorLicenseNumber: formData.mortgageLoanOriginatorLicenseNumber || null,
        lenderId: formData.lenderId && formData.lenderId.trim() !== '' ? formData.lenderId : null,
        borrowerRequestedLoanModification: formData.borrowerRequestedLoanModification !== null && formData.borrowerRequestedLoanModification !== undefined ? formData.borrowerRequestedLoanModification : false,
        loanModificationRequestFinalized: (formData.borrowerRequestedLoanModification === false || formData.borrowerRequestedLoanModification === null || formData.borrowerRequestedLoanModification === undefined) ? null : (formData.loanModificationRequestFinalized !== null && formData.loanModificationRequestFinalized !== undefined ? formData.loanModificationRequestFinalized : false)
      },
      rightToCures: (() => {
        // If rightToCures array exists and has entries, use it (from edit mode in PetitionTabContent)
        if (formData.rightToCures && Array.isArray(formData.rightToCures) && formData.rightToCures.length > 0) {
          return formData.rightToCures.map(mapRightToCureForSubmission);
        }
        // If old single-object format exists (from wizard form - first submission), convert to array with one object
        if (formData.noticeSent !== null && formData.noticeSent !== undefined) {
          return [mapRightToCureForSubmission({
            id: null,
            noticeSent: formData.noticeSent,
            noticeDate: formData.noticeDate,
            amountInDefault: formData.amountInDefault,
            daysDelinquentAtNotice: formData.daysDelinquentAtNotice,
            cureExpirationDate: formData.cureExpirationDate,
            noticeAddressStreet1: formData.noticeAddressStreet1,
            noticeAddressCity: formData.noticeAddressCity,
            noticeAddressState: formData.noticeAddressState,
            noticeAddressZip: formData.noticeAddressZip,
            manualOverrideReason: formData.manualOverrideReason,
            borrowerRespondedWithin30Days: formData.borrowerRespondedWithin30Days,
            borrowerResponseDate: formData.borrowerResponseDate,
            proceededWithRightToCure: formData.proceededWithRightToCure
          })];
        }
        // Return empty array if no rightToCure data exists
        return [];
      })(),
      // For taken-over petitions, don't send judgment and foreclosure sale data as they need to be redone
      // Check if any rightToCure has noticeSent === true
      foreclosureSale: (formData.takeOverToUserId) ? null : (() => {
        const hasNoticeSent = (formData.rightToCures && Array.isArray(formData.rightToCures) && formData.rightToCures.length > 0 && formData.rightToCures.some(rtc => rtc.noticeSent === true)) ||
          (formData.noticeSent === true);
        return hasNoticeSent && formData.foreclosureSale ? {
        saleDate: safeDateConversion(formData.foreclosureSale.saleDate),
        soldToId: formData.foreclosureSale.soldToId && formData.foreclosureSale.soldToId.trim() !== '' ? formData.foreclosureSale.soldToId : null,
        vestingEntityName: formData.foreclosureSale.vestingEntityName || null,
        reoEntityName: formData.foreclosureSale.reoEntityName || null,
        reoContactFirstName: formData.foreclosureSale.reoContactFirstName || null,
        reoContactLastName: formData.foreclosureSale.reoContactLastName || null,
        reoBusinessPhone: formData.foreclosureSale.reoBusinessPhone || null,
        reoEmergencyPhone: formData.foreclosureSale.reoEmergencyPhone || null,
        requestedAlternativeToForeclosure: formData.foreclosureSale.requestedAlternativeToForeclosure !== null && formData.foreclosureSale.requestedAlternativeToForeclosure !== undefined ? formData.foreclosureSale.requestedAlternativeToForeclosure : false,
        foreclosureAlternativeOption: formData.foreclosureSale.foreclosureAlternativeOption !== null && formData.foreclosureSale.foreclosureAlternativeOption !== undefined 
          ? (typeof formData.foreclosureSale.foreclosureAlternativeOption === 'number' 
              ? formData.foreclosureSale.foreclosureAlternativeOption 
              : parseInt(formData.foreclosureSale.foreclosureAlternativeOption, 10))
          : null
      } : null;
      })(),
      // Include judgment - send null if no data (like foreclosureSale), or full object if data exists
      // For taken-over petitions, don't send judgment data as it needs to be redone
      judgment: (formData.takeOverToUserId) ? null : (formData.judgment && (
        formData.judgment.judgmentDate || 
        (formData.judgment.judgmentType !== null && formData.judgment.judgmentType !== undefined && formData.judgment.judgmentType !== 0) ||
        (formData.judgment.courtInformation && formData.judgment.courtInformation.trim()) || 
        (formData.judgment.docketNumbers && formData.judgment.docketNumbers.trim())
      )) ? {
        id: formData.judgment.id || null,
        petitionId: petitionId || null,
        judgmentDate: safeDateConversion(formData.judgment.judgmentDate),
        judgmentType: typeof formData.judgment.judgmentType === 'number' 
          ? formData.judgment.judgmentType 
          : (formData.judgment.judgmentType !== null && formData.judgment.judgmentType !== undefined && formData.judgment.judgmentType !== ""
              ? parseInt(formData.judgment.judgmentType, 10) 
              : 0),
        courtInformation: formData.judgment.courtInformation || "",
        docketNumbers: formData.judgment.docketNumbers || ""
      } : null,
      affidavit: {
        certainMortgageLoan: formData.certainMortgageLoan !== null && formData.certainMortgageLoan !== undefined ? formData.certainMortgageLoan : false,
        form35bComplianceAffidavitPdf: await fileToBase64(formData.form35bComplianceAffidavitPdf),
        form35bNonApplicabilityAffidavitPdf: await fileToBase64(formData.form35bNonApplicabilityAffidavitPdf),
        affiantName: formData.affiantName || "",
        affiantTitle: formData.affiantTitle || "",
        affidavitExecutionDate: safeDateConversion(formData.affidavitExecutionDate)
      },
      filingEntity: {
        filingEntityLegalName: formData.filingEntityLegalName || "",
        filingEntityTypeId: formData.filingEntityTypeId && `${formData.filingEntityTypeId}`.trim() !== '' ? formData.filingEntityTypeId : null,
        filingEntityStreet1: formData.filingEntityStreet1 || "",
        filingEntityCity: formData.filingEntityCity || "",
        filingEntityState: formData.filingEntityState || "",
        filingEntityZip: formData.filingEntityZip || "",
        filingContactName: formData.filingContactName || "",
        filingContactEmail: formData.filingContactEmail || "",
        filingContactPhone: formData.filingContactPhone || "",
        nmlsLicenseNumber: formData.nmlsLicenseNumber || "",
        stateLicenseNumber: formData.stateLicenseNumber || "",
        stateLicenseState: formData.stateLicenseState || ""
      },
      signatures: (formData.signatures || []).map(mapSignatureForSubmission),
      borrowers: (formData.borrowers || []).map(mapBorrowerForSubmission),
      loanAssignees: (formData.loanAssignees || []).map(mapLoanAssigneeForSubmission),
      documents: (formData.documents || []).map(document => ({
        ...document,
        uploadedOn: safeDateConversion(document.uploadedOn)
      }))
      // Notes are now handled via a separate API endpoint - removed from submit petition
    };

    // Send data directly as dto parameter (not wrapped in object)
    return petitionData;
  }

  // Transform single petition API response to display format
  transformSinglePetitionResponse(apiResponse) {
    if (!apiResponse || !apiResponse.data) {
      return null;
    }

    const petition = apiResponse.data;
    const statusDisplay = getStatusDisplay(petition.status);

    return {
      id: petition.id,
      petitionNumber: petition.petitionNumber,
      status: statusDisplay.text,
      statusClass: statusDisplay.class,
      createdDate: petition.createdDate,
      modifiedDate: petition.modifiedDate,
      createdById: petition.createdById,
      modifiedById: petition.modifiedById,
      isAllStepsCompleted: petition.isAllStepsCompleted,
      organizationId: petition.organizationId,
      duplicateHash: petition.duplicateHash,
      details: {
        property: petition.property,
        loan: petition.loan,
        rightToCures: petition.rightToCures || (petition.rightToCure ? [petition.rightToCure] : []), // Map rightToCures array, fallback to rightToCure (singular) for backward compatibility
        rightToCure: petition.rightToCure, // Keep for backward compatibility
        foreclosureSale: petition.foreclosureSale,
        affidavit: petition.affidavit,
        filingEntity: petition.filingEntity,
        signatures: petition.signatures,
        borrowers: petition.borrowers,
        loanAssignees: petition.loanAssignees,
        documents: petition.documents,
        judgment: petition.judgment || null,
        notes: petition.notes || []
      }
    };
  }

  // Transform API response to display format
  transformApiResponseToDisplayFormat(apiResponse) {
    if (!apiResponse || !apiResponse.data) {
      return [];
    }

    // Handle both single petition and array of petitions
    const petitions = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data];

    const transformedPetitions = petitions.map(petition => {
      const statusInfo = getStatusDisplay(petition.status);
      const borrowerName = getPrimaryBorrowerName(petition.borrowers);
      const loanAmount = formatLoanAmount(petition.loan);
      const propertyAddress = formatPropertyAddress(petition.property);

      return {
        id: petition.id,
        petitionNumber: petition.petitionNumber || 'N/A',
        propertyAddress,
        status: statusInfo.text,
        statusClass: statusInfo.class,
        statusValue: petition.status,
        filingDate: petition.createdDate ? new Date(petition.createdDate).toLocaleDateString() : new Date().toLocaleDateString(),
        lastUpdated: petition.modifiedDate ? new Date(petition.modifiedDate).toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }) : new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
        borrower: borrowerName,
        loanAmount,
        county: petition.property?.propertyCounty || 'N/A',
        details: petition // Store full details for modal view
      };
    });
    
    return transformedPetitions;
  }

  // Get public petitions (no authentication required)
  async getPublicPetitionsPaged(params) {
    const { city, zipCode, pageNumber = 1, pageSize = PAGINATION.DEFAULT_PAGE_SIZE, sortColumn, sortDirection } = params;
    
    const requestBody = {
      city: city || "",
      zipCode: zipCode || "",
      pageNumber,
      pageSize,
      sortColumn: sortColumn || "",
      sortDirection: sortDirection || "",
    };

    // Use plain axios for public endpoint (no auth required)
    const response = await axios.post(
      `${Config.API_URL}${PETITION_ENDPOINTS.GET_PUBLIC_PETITIONS_PAGED}`,
      requestBody,
      {
        headers: SERVICE_HEADERS.JSON
      }
    );
    
    return response.data;
  }
}

// Create and export a singleton instance
const petitionApiService = new PetitionApiService();

export default petitionApiService;
