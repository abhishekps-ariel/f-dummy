import axiosInstance from '../api/axiosInstance';
import { PETITION_ENDPOINTS } from '../constants/apiEndpoints';
import axios from 'axios';
import Config from '../config/index';

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
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  async deletePetitionById(petitionId) {
    if (!petitionId) {
      throw new Error('Petition ID is required to delete a petition.');
    }
 
    const response = await axiosInstance.delete(PETITION_ENDPOINTS.DELETE_PETITION_BY_ID(petitionId), {
      headers: {
        'Accept': 'text/plain'
      }
    });
 
    return response.data;
  }

  // Get petition by ID
  async getPetitionById(petitionId) {
    const response = await axiosInstance.get(PETITION_ENDPOINTS.GET_PETITION_BY_ID(petitionId), {
      headers: {
        'Accept': 'text/plain'
      }
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
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update property details
  async updateProperty(petitionId, propertyData) {
    const requestBody = {
      petitionId: petitionId,
      petitionProperty: {
        id: propertyData.id || null,
        propertyStreet1: propertyData.propertyStreet1 || "",
        propertyStreet2: propertyData.propertyStreet2 || "",
        propertyCity: propertyData.propertyCity || "",
        propertyState: propertyData.propertyState || "MA",
        propertyZip: propertyData.propertyZip || "",
        propertyCounty: propertyData.propertyCounty || "",
        assessorParcelId: propertyData.assessorParcelId || ""
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_PROPERTY, requestBody, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
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
        originationDate: loanData.originationDate ? new Date(loanData.originationDate).toISOString() : null,
        originalPrincipalAmount: parseFloat(loanData.originalPrincipalAmount) || 0,
        currentPrincipalBalance: parseFloat(loanData.currentPrincipalBalance) || 0,
        interestRatePercent: parseFloat(loanData.interestRatePercent) || 0,
        variableRate: loanData.variableRate || false,
        interestOnly: loanData.interestOnly || false,
        negativeAmortization: loanData.negativeAmortization || false,
        monthlyPaymentAmount: parseFloat(loanData.monthlyPaymentAmount) || 0,
        delinquencyDaysAtFiling: parseInt(loanData.delinquencyDaysAtFiling) || 0,
        mortgageBrokerLicenseNumber: loanData.mortgageBrokerLicenseNumber || "",
        mortgageLoanOriginatorLicenseNumber: loanData.mortgageLoanOriginatorLicenseNumber || "",
        lenderId: loanData.lenderId && loanData.lenderId.trim() !== '' ? loanData.lenderId : null,
        borrowerRequestedLoanModification: loanData.borrowerRequestedLoanModification !== null && loanData.borrowerRequestedLoanModification !== undefined ? loanData.borrowerRequestedLoanModification : false,
        loanModificationRequestFinalized: loanData.loanModificationRequestFinalized !== null && loanData.loanModificationRequestFinalized !== undefined ? loanData.loanModificationRequestFinalized : false
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_LOAN, requestBody, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
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
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update borrowers
  async updateBorrowers(petitionId, borrowersData) {
    const requestBody = {
      petitionId: petitionId,
      petitionBorrowers: borrowersData.map(borrower => ({
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
      }))
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_BORROWERS, requestBody, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update affidavit (Form 35B Compliance)
  async updateAffidavit(petitionId, affidavitData) {
    // Helper function to convert File object to base64 string
    const fileToBase64 = (file) => {
      if (!file || typeof file === 'string') {
        return file || "";
      }
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove the data URL prefix (data:application/pdf;base64,) to get just the base64 string
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => {
          resolve("");
        };
        reader.readAsDataURL(file);
      });
    };

    // Convert PDF files to base64 if they are File objects
    const form35bComplianceAffidavitPdf = await fileToBase64(affidavitData.form35bComplianceAffidavitPdf);
    const form35bNonApplicabilityAffidavitPdf = await fileToBase64(affidavitData.form35bNonApplicabilityAffidavitPdf);

    // Helper function to safely convert dates
    const safeDateConversion = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    };

    const requestBody = {
      petitionId: petitionId,
      petitionAffidavit: {
        id: affidavitData.id || null,
        certainMortgageLoan: affidavitData.certainMortgageLoan !== null && affidavitData.certainMortgageLoan !== undefined ? affidavitData.certainMortgageLoan : false,
        form35bComplianceAffidavitPdf: form35bComplianceAffidavitPdf,
        form35bNonApplicabilityAffidavitPdf: form35bNonApplicabilityAffidavitPdf,
        affiantName: affidavitData.affiantName || "",
        affiantTitle: affidavitData.affiantTitle || "",
        affidavitExecutionDate: safeDateConversion(affidavitData.affidavitExecutionDate)
      }
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_AFFIDAVIT, requestBody, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update right to cures
  async updateRightToCures(petitionId, rightToCuresData) {
    // Helper function to safely convert dates
    const safeDateConversion = (dateString) => {
      if (!dateString || !dateString.trim()) return null;
      try {
        // If already in ISO format, return as is
        if (dateString.includes('T')) {
          return dateString;
        }
        // Otherwise, convert to ISO format
        const date = new Date(dateString + 'T00:00:00');
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    };

    // Map right to cures data, ensuring new entries have id: null
    const mappedRightToCures = rightToCuresData.map((rtc) => {
      // Determine ID: if it's a number (temporary) or not a valid UUID, set to null
      let rtcId = null;
      if (rtc.id && typeof rtc.id === 'string' && rtc.id.includes('-')) {
        // It's a UUID string, use it
        rtcId = rtc.id;
      } else if (rtc.id && typeof rtc.id === 'number') {
        // It's a temporary ID (number), set to null for new entries
        rtcId = null;
      }

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
        borrowerRespondedWithin30Days: (rtc.noticeSent === false || rtc.noticeSent === null || rtc.noticeSent === undefined) ? null : (rtc.borrowerRespondedWithin30Days !== null && rtc.borrowerRespondedWithin30Days !== undefined ? rtc.borrowerRespondedWithin30Days : false),
        borrowerResponseDate: safeDateConversion(rtc.borrowerResponseDate),
        proceededWithRightToCure: (rtc.noticeSent === false || rtc.noticeSent === null || rtc.noticeSent === undefined) ? null : (rtc.proceededWithRightToCure !== null && rtc.proceededWithRightToCure !== undefined ? rtc.proceededWithRightToCure : false)
      };
    });

    const requestBody = {
      petitionId: petitionId,
      petitionRightToCures: mappedRightToCures
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_RIGHT_TO_CURE, requestBody, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update loan assignees
  async updateLoanAssignees(petitionId, loanAssigneesData) {
    // Map loan assignees data, ensuring new entries have id: null
    const mappedLoanAssignees = loanAssigneesData.map((assignee) => {
      // Determine ID: if it's a number (temporary) or not a valid UUID, set to null
      let assigneeId = null;
      if (assignee.id && typeof assignee.id === 'string' && assignee.id.includes('-')) {
        // It's a UUID string, use it
        assigneeId = assignee.id;
      } else if (assignee.id && typeof assignee.id === 'number') {
        // It's a temporary ID (number), set to null for new entries
        assigneeId = null;
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
    });

    const requestBody = {
      petitionId: petitionId,
      petitionLoanAssignees: mappedLoanAssignees
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_LOAN_ASSIGNEES, requestBody, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update signatures
  async updateSignatures(petitionId, signaturesData) {
    // Helper function to safely convert dates
    const safeDateConversion = (dateString) => {
      if (!dateString || !dateString.trim()) return null;
      try {
        // If already in ISO format, return as is
        if (dateString.includes('T')) {
          return dateString;
        }
        // Otherwise, convert to ISO format
        const date = new Date(dateString + 'T00:00:00');
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    };

    // Map signatures data, ensuring new entries have id: null
    const mappedSignatures = signaturesData.map((signature) => {
      // Determine ID: if it's a number (temporary) or not a valid UUID, set to null
      let signatureId = null;
      if (signature.id && typeof signature.id === 'string' && signature.id.includes('-')) {
        // It's a UUID string, use it
        signatureId = signature.id;
      } else if (signature.id && typeof signature.id === 'number') {
        // It's a temporary ID (number), set to null for new entries
        signatureId = null;
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
    });

    const requestBody = {
      petitionId: petitionId,
      petitionSignatures: mappedSignatures
    };
    
    const response = await axiosInstance.post(PETITION_ENDPOINTS.UPDATE_SIGNATURES, requestBody, {
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update foreclosure sale
  async updateForeclosure(petitionId, foreclosureData) {
    // Helper function to safely convert dates
    const safeDateConversion = (dateString) => {
      if (!dateString || !dateString.trim()) return null;
      try {
        // If already in ISO format, return as is
        if (dateString.includes('T')) {
          return dateString;
        }
        // Otherwise, convert to ISO format
        const date = new Date(dateString + 'T00:00:00');
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    };

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
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Update judgment
  async updateJudgment(petitionId, judgmentData) {
    // Helper function to safely convert dates
    const safeDateConversion = (dateString) => {
      if (!dateString || !dateString.trim()) return null;
      try {
        // If already in ISO format, return as is
        if (dateString.includes('T')) {
          return dateString;
        }
        // Otherwise, convert to ISO format
        const date = new Date(dateString + 'T00:00:00');
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    };

    const requestBody = {
      petitionId: petitionId,
      petitionJudgment: {
        id: judgmentData.id || null,
        petitionId: petitionId,
        judgmentDate: safeDateConversion(judgmentData.judgmentDate),
        judgmentAmount: parseFloat(judgmentData.judgmentAmount) || 0,
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
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
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
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  /**
   * Get paginated petitions by organization ID or user ID with filters, search, and sorting
   * @param {Object} paginationParams - The pagination and filter parameters
   * @param {string} [paginationParams.organizationId] - Organization ID (for org admins)
   * @param {string} [paginationParams.userId] - User ID (for filers)
   * @param {number} [paginationParams.pageNumber=1] - Page number (1-based)
   * @param {number} [paginationParams.pageSize=10] - Number of items per page
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
      pageSize = 10,
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
      pageSize: Math.max(1, parseInt(pageSize) || 10),
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
    // Helper function to safely convert dates
    const safeDateConversion = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    };

    // Helper function to convert File object to base64 string
    const fileToBase64 = (file) => {
      if (!file || typeof file === 'string') {
        return file || "";
      }
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove the data URL prefix (data:application/pdf;base64,) to get just the base64 string
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => {
          resolve("");
        };
        reader.readAsDataURL(file);
      });
    };

    
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
          return formData.rightToCures.map(rightToCure => ({
            id: rightToCure.id || null,
            noticeSent: rightToCure.noticeSent !== null && rightToCure.noticeSent !== undefined ? rightToCure.noticeSent : null,
            noticeDate: safeDateConversion(rightToCure.noticeDate),
            amountInDefault: parseFloat(rightToCure.amountInDefault) || 0,
            daysDelinquentAtNotice: parseInt(rightToCure.daysDelinquentAtNotice) || 0,
            cureExpirationDate: safeDateConversion(rightToCure.cureExpirationDate),
            noticeAddressStreet1: rightToCure.noticeAddressStreet1 || "",
            noticeAddressCity: rightToCure.noticeAddressCity || "",
            noticeAddressState: rightToCure.noticeAddressState || "",
            noticeAddressZip: rightToCure.noticeAddressZip || "",
            manualOverrideReason: rightToCure.manualOverrideReason || "",
            borrowerRespondedWithin30Days: (rightToCure.noticeSent === false || rightToCure.noticeSent === null || rightToCure.noticeSent === undefined) ? null : (rightToCure.borrowerRespondedWithin30Days !== null && rightToCure.borrowerRespondedWithin30Days !== undefined ? rightToCure.borrowerRespondedWithin30Days : false),
            borrowerResponseDate: safeDateConversion(rightToCure.borrowerResponseDate),
            proceededWithRightToCure: (rightToCure.noticeSent === false || rightToCure.noticeSent === null || rightToCure.noticeSent === undefined) ? null : (rightToCure.proceededWithRightToCure !== null && rightToCure.proceededWithRightToCure !== undefined ? rightToCure.proceededWithRightToCure : false)
          }));
        }
        // If old single-object format exists (from wizard form - first submission), convert to array with one object
        if (formData.noticeSent !== null && formData.noticeSent !== undefined) {
          return [{
            id: null,
            noticeSent: formData.noticeSent,
            noticeDate: safeDateConversion(formData.noticeDate),
            amountInDefault: parseFloat(formData.amountInDefault) || 0,
            daysDelinquentAtNotice: parseInt(formData.daysDelinquentAtNotice) || 0,
            cureExpirationDate: safeDateConversion(formData.cureExpirationDate),
            noticeAddressStreet1: formData.noticeAddressStreet1 || "",
            noticeAddressCity: formData.noticeAddressCity || "",
            noticeAddressState: formData.noticeAddressState || "",
            noticeAddressZip: formData.noticeAddressZip || "",
            manualOverrideReason: formData.manualOverrideReason || "",
            borrowerRespondedWithin30Days: (formData.noticeSent === false || formData.noticeSent === null || formData.noticeSent === undefined) ? null : (formData.borrowerRespondedWithin30Days !== null && formData.borrowerRespondedWithin30Days !== undefined ? formData.borrowerRespondedWithin30Days : false),
            borrowerResponseDate: safeDateConversion(formData.borrowerResponseDate),
            proceededWithRightToCure: (formData.noticeSent === false || formData.noticeSent === null || formData.noticeSent === undefined) ? null : (formData.proceededWithRightToCure !== null && formData.proceededWithRightToCure !== undefined ? formData.proceededWithRightToCure : false)
          }];
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
        (formData.judgment.judgmentAmount && formData.judgment.judgmentAmount > 0) || 
        (formData.judgment.judgmentType !== null && formData.judgment.judgmentType !== undefined && formData.judgment.judgmentType !== 0) ||
        (formData.judgment.courtInformation && formData.judgment.courtInformation.trim()) || 
        (formData.judgment.docketNumbers && formData.judgment.docketNumbers.trim())
      )) ? {
        id: formData.judgment.id || null,
        petitionId: petitionId || null,
        judgmentDate: safeDateConversion(formData.judgment.judgmentDate),
        judgmentAmount: typeof formData.judgment.judgmentAmount === 'number' 
          ? formData.judgment.judgmentAmount 
          : (formData.judgment.judgmentAmount ? parseFloat(formData.judgment.judgmentAmount) : 0),
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
      signatures: (formData.signatures || []).map(signature => ({
        ...signature,
        signedAt: safeDateConversion(signature.signedAt)
      })),
      borrowers: (formData.borrowers || []).map(borrower => ({
        firstName: borrower.firstName,
        middleName: borrower.middleName,
        lastName: borrower.lastName,
        suffix: borrower.suffix,
        borrowerIsPrimary: borrower.borrowerIsPrimary,
        mailingStreet1: borrower.mailingStreet1,
        mailingCity: borrower.mailingCity,
        mailingState: borrower.mailingState,
        mailingZip: borrower.mailingZip,
        phone: borrower.phone,
        email: borrower.email
      })),
      loanAssignees: (formData.loanAssignees || []).map(assignee => {
        return {
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
        };
      }),
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

    // Map status number to readable status
    const getStatusDisplay = (status) => {
      switch (status) {
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
      // Map status number to readable status
      const getStatusDisplay = (status) => {
        switch (status) {
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

      const statusInfo = getStatusDisplay(petition.status);

      // Get borrower name from the primary borrower
      // This ensures that the borrower column in tables shows the primary borrower's name
      let borrowerName = 'N/A';
      if (petition.borrowers && petition.borrowers.length > 0) {
        // Find the primary borrower first (borrowerIsPrimary === true)
        let borrower = petition.borrowers.find(b => b.borrowerIsPrimary === true);
        
        // If no primary borrower found, fall back to the first borrower
        if (!borrower) {
          borrower = petition.borrowers[0];
        }
        
        const nameParts = [borrower.firstName, borrower.middleName, borrower.lastName, borrower.suffix]
          .filter(part => part && part.trim())
          .map(part => part.trim());
        borrowerName = nameParts.join(' ') || 'N/A';
      }

      // Format loan amount
      let loanAmount = 'N/A';
      if (petition.loan?.currentPrincipalBalance) {
        loanAmount = `$${parseFloat(petition.loan.currentPrincipalBalance).toLocaleString()}`;
      } else if (petition.loan?.originalPrincipalAmount) {
        loanAmount = `$${parseFloat(petition.loan.originalPrincipalAmount).toLocaleString()}`;
      }

      // Format property address
      const addressParts = [
        petition.property?.propertyStreet1,
        petition.property?.propertyStreet2,
        petition.property?.propertyCity,
        petition.property?.propertyState,
        petition.property?.propertyZip
      ].filter(part => part && part.trim());
      const propertyAddress = addressParts.join(', ') || 'N/A';

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
    const { city, zipCode, pageNumber = 1, pageSize = 10, sortColumn, sortDirection } = params;
    
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
        headers: {
          'Accept': 'text/plain',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  }
}

// Create and export a singleton instance
const petitionApiService = new PetitionApiService();

export default petitionApiService;
