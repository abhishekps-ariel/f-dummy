import axiosInstance from '../api/axiosInstance';
import { PETITION_ENDPOINTS } from '../constants/apiEndpoints';

class PetitionApiService {
  // Submit a new petition
  async submitPetition(petitionData) {
    const response = await axiosInstance.post(PETITION_ENDPOINTS.SUBMIT_PETITION, petitionData);
    return response.data;
  }


  // Get petition count by organization ID
  async getPetitionCountByOrganization(organizationId) {
    const url = `/api/Petition/get-petition-count-by-organisationId/${organizationId}`;
    
    const response = await axiosInstance.post(url, {}, {
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
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
   * Get paginated petitions by organization ID with filters, search, and sorting
   * @param {Object} paginationParams - The pagination and filter parameters
   * @param {string} paginationParams.organizationId - Required organization ID
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

  /**
   * Helper method to create pagination parameters with validation
   * @param {Object} options - The pagination options
   * @param {string} options.organizationId - Required organization ID
   * @param {number} [options.pageNumber=1] - Page number (1-based)
   * @param {number} [options.pageSize=10] - Number of items per page
   * @param {string} [options.searchText=""] - Search text for filtering
   * @param {number} [options.status=null] - Status filter
   * @param {string|Date} [options.fromDate] - Start date for date range filter
   * @param {string|Date} [options.toDate] - End date for date range filter
   * @param {string} [options.sortColumn="CreatedDate"] - Sort column
   * @param {string} [options.sortDirection="desc"] - Sort direction
   * @returns {Object} Validated pagination parameters
   * @throws {Error} If organizationId is not provided
   */
  createPaginationParams(options = {}) {
    const {
      organizationId,
      pageNumber = 1,
      pageSize = 10,
      searchText = "",
      status = null,
      fromDate = null,
      toDate = null,
      sortColumn = "CreatedDate",
      sortDirection = "desc"
    } = options;

    // Validate required parameters
    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    // Validate sort column
    const allowedSortColumns = ["PetitionNumber", "CreatedDate", "ModifiedDate"];
    const validSortColumn = allowedSortColumns.includes(sortColumn) ? sortColumn : "CreatedDate";

    // Validate sort direction
    const allowedSortDirections = ["asc", "desc"];
    const validSortDirection = allowedSortDirections.includes(sortDirection.toLowerCase()) ? sortDirection.toLowerCase() : "desc";

    // Build parameters object
    const params = {
      organizationId,
      pageNumber: Math.max(1, parseInt(pageNumber) || 1), // Ensure minimum page 1
      pageSize: Math.max(1, parseInt(pageSize) || 10),
      status: status !== null ? parseInt(status) : null,
      sortColumn: validSortColumn,
      sortDirection: validSortDirection
    };

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
  async transformFormDataToApiFormat(formData, organizationId) {
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
      isAllStepsCompleted: formData.isAllStepsCompleted || false,
      organizationId: organizationId,
      duplicateHash: "", // This will be generated by the backend
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
        minNumber: formData.minNumber || "",
        loanNumber: formData.loanNumber || "",
        petitionLoanTypeId: formData.petitionLoanTypeId && formData.petitionLoanTypeId.trim() !== '' ? formData.petitionLoanTypeId : null,
        petitionLoanTypeName: formData.petitionLoanTypeName || "",
        lienPosition: parseInt(formData.lienPosition) || 0,
        originationDate: safeDateConversion(formData.originationDate),
        originalPrincipalAmount: parseFloat(formData.originalPrincipalAmount) || 0,
        currentPrincipalBalance: parseFloat(formData.currentPrincipalBalance) || 0,
        interestRatePercent: parseFloat(formData.interestRatePercent) || 0,
        variableRate: formData.variableRate || false,
        interestOnly: formData.interestOnly || false,
        negativeAmortization: formData.negativeAmortization || false,
        monthlyPaymentAmount: parseFloat(formData.monthlyPaymentAmount) || 0,
        delinquencyDaysAtFiling: parseInt(formData.delinquencyDaysAtFiling) || 0
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
        filingEntityTypeId: formData.filingEntityTypeId || "",
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
        affidavit: petition.affidavit,
        filingEntity: petition.filingEntity,
        signatures: petition.signatures,
        borrowers: petition.borrowers,
        loanAssignees: petition.loanAssignees,
        documents: petition.documents
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
}

// Create and export a singleton instance
const petitionApiService = new PetitionApiService();

export default petitionApiService;
