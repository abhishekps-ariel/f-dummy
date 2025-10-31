import axiosInstance from '../api/axiosInstance';
import { COMMON_ENDPOINTS } from '../constants/apiEndpoints';

class CommonPetitionService {
  // Get petition enums (status, filing entity role, lien position, address validation status)
  async getPetitionEnums() {
    const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_ENUMS);
    return response.data;
  }

  // Get petition loan types
  async getPetitionLoanTypes() {
    const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_LOAN_TYPES);
    return response.data;
  }

  // Get petition assignee types
  async getPetitionAssigneeTypes() {
    const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_ASSIGNEE_TYPES);
    return response.data;
  }

  // Get petition assignee roles
  async getPetitionAssigneeRoles() {
    const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_ASSIGNEE_ROLES);
    return response.data;
  }

  // Get buyer types
  async getBuyerTypes() {
    const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_BUYER_TYPES, {
      headers: {
        Accept: "text/plain",
      },
    });
    return response.data;
  }

  // Get all petition common data in one call
  async getAllPetitionCommonData() {
    const [enums, loanTypes, assigneeTypes, assigneeRoles, buyerTypes] = await Promise.all([
      this.getPetitionEnums(),
      this.getPetitionLoanTypes(),
      this.getPetitionAssigneeTypes(),
      this.getPetitionAssigneeRoles(),
      this.getBuyerTypes()
    ]);

    return {
      success: true,
      data: {
        enums: enums.data,
        loanTypes: loanTypes.data,
        assigneeTypes: assigneeTypes.data,
        assigneeRoles: assigneeRoles.data,
        buyerTypes: buyerTypes.data || buyerTypes // Handle different response structures
      }
    };
  }
}

// Create and export a singleton instance
const commonPetitionService = new CommonPetitionService();

export default commonPetitionService;
