// Example usage of the updated petition API service
import petitionApiService from '../services/petitionApiService';

// Example 1: Basic pagination
const basicPagination = async (organizationId) => {
  try {
    const response = await petitionApiService.getPetitionsPaged({
      organizationId: organizationId,
      pageNumber: 0,
      pageSize: 10
    });
    console.log('Basic pagination response:', response);
    return response;
  } catch (error) {
    console.error('Error in basic pagination:', error);
  }
};

// Example 2: Search with filters
const searchWithFilters = async (organizationId, searchText) => {
  try {
    const response = await petitionApiService.getPetitionsPaged({
      organizationId: organizationId,
      pageNumber: 0,
      pageSize: 20,
      searchText: searchText,
      status: 1, // Only draft petitions
      sortColumn: "PetitionNumber",
      sortDirection: "asc"
    });
    console.log('Search with filters response:', response);
    return response;
  } catch (error) {
    console.error('Error in search with filters:', error);
  }
};

// Example 3: Date range filtering
const dateRangeFilter = async (organizationId, fromDate, toDate) => {
  try {
    const response = await petitionApiService.getPetitionsPaged({
      organizationId: organizationId,
      pageNumber: 0,
      pageSize: 15,
      fromDate: fromDate, // ISO string or Date object
      toDate: toDate,     // ISO string or Date object
      sortColumn: "CreatedDate",
      sortDirection: "desc"
    });
    console.log('Date range filter response:', response);
    return response;
  } catch (error) {
    console.error('Error in date range filter:', error);
  }
};

// Example 4: Using the helper method directly
const usingHelperMethod = async (organizationId) => {
  try {
    // Create parameters using the helper method
    const params = petitionApiService.createPaginationParams({
      organizationId: organizationId,
      pageNumber: 1,
      pageSize: 25,
      searchText: "mortgage",
      status: 2, // Submitted petitions
      sortColumn: "ModifiedDate",
      sortDirection: "desc"
    });
    
    console.log('Created parameters:', params);
    
    // Use the parameters with the API call
    const response = await petitionApiService.getPetitionsPaged(params);
    console.log('Helper method response:', response);
    return response;
  } catch (error) {
    console.error('Error using helper method:', error);
  }
};

// Example 5: All available sort columns and directions
const allSortOptions = {
  sortColumns: ["PetitionNumber", "CreatedDate", "ModifiedDate"],
  sortDirections: ["asc", "desc"]
};

// Example 6: Status values (these depend on your API implementation)
const statusValues = {
  ALL: 0,
  DRAFT: 1,
  SUBMITTED: 2,
  RETURNED: 3,
  RESUBMITTED: 4,
  ACCEPTED: 5,
  CLOSED: 6
};

export {
  basicPagination,
  searchWithFilters,
  dateRangeFilter,
  usingHelperMethod,
  allSortOptions,
  statusValues
};
