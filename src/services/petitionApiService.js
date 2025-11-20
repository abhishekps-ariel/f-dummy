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
 
    const response = await axiosInstance.post(PETITION_ENDPOINTS.DELETE_PETITION_BY_ID(petitionId), {
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
        mortgageLoanOriginatorLicenseNumber: formData.mortgageLoanOriginatorLicenseNumber || null
      },
      rightToCure: {
        noticeSent: formData.noticeSent || false,
        noticeDate: safeDateConversion(formData.noticeDate),
        amountInDefault: parseFloat(formData.amountInDefault) || 0,
        daysDelinquentAtNotice: parseInt(formData.daysDelinquentAtNotice) || 0,
        cureExpirationDate: safeDateConversion(formData.cureExpirationDate),
        noticeAddressStreet1: formData.noticeAddressStreet1 || "",
        noticeAddressCity: formData.noticeAddressCity || "",
        noticeAddressState: formData.noticeAddressState || "",
        noticeAddressZip: formData.noticeAddressZip || "",
        manualOverrideReason: formData.manualOverrideReason || ""
      },
      foreclosureSale: formData.noticeSent === true && formData.foreclosureSale ? {
        saleDate: safeDateConversion(formData.foreclosureSale.saleDate),
        soldToId: formData.foreclosureSale.soldToId && formData.foreclosureSale.soldToId.trim() !== '' ? formData.foreclosureSale.soldToId : null,
        vestingEntityName: formData.foreclosureSale.vestingEntityName || null,
        reoEntityName: formData.foreclosureSale.reoEntityName || null,
        reoContactFirstName: formData.foreclosureSale.reoContactFirstName || null,
        reoContactLastName: formData.foreclosureSale.reoContactLastName || null,
        reoBusinessPhone: formData.foreclosureSale.reoBusinessPhone || null,
        reoEmergencyPhone: formData.foreclosureSale.reoEmergencyPhone || null
      } : null,
      // Include judgment object - send empty object if no data, or full object if data exists
      judgment: formData.judgment ? {
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
      } : {
        id: null,
        petitionId: petitionId || null,
        judgmentDate: null,
        judgmentAmount: 0,
        judgmentType: 0,
        courtInformation: "",
        docketNumbers: ""
      },
      affidavit: {
        certainMortgageLoan: formData.certainMortgageLoan || false,
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
        // Debug logging for assignee data
        console.log('Processing assignee:', assignee);
        console.log('assigneeName:', assignee.assigneeName, 'Type:', typeof assignee.assigneeName);
        console.log('assigneeTypeId:', assignee.assigneeTypeId, 'Type:', typeof assignee.assigneeTypeId);
        console.log('assigneeRoleId:', assignee.assigneeRoleId, 'Type:', typeof assignee.assigneeRoleId);
        
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
      })),
      notes: (formData.notes || []).map(note => ({
        id: note.id || null,
        noteText: note.noteText || note.content || ""
      }))
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
        case "2": return { text: "Returned", class: "Returned" };
        case "3": return { text: "Resubmitted", class: "Resubmitted" };
        case "4": return { text: "Accepted", class: "Accepted" };
        case "5": return { text: "Closed", class: "Closed" };
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
        rightToCure: petition.rightToCure,
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
          case "2": return { text: "Returned", class: "Returned" };
          case "3": return { text: "Resubmitted", class: "Resubmitted" };
          case "4": return { text: "Accepted", class: "Accepted" };
          case "5": return { text: "Closed", class: "Closed" };
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
