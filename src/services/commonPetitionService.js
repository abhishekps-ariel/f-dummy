import axiosInstance from '../api/axiosInstance';
import { COMMON_ENDPOINTS } from '../constants/apiEndpoints';

class CommonPetitionService {
  // Get petition enums (status, filing entity role, lien position, address validation status)
  async getPetitionEnums() {
    try {
      const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_ENUMS);
      return response.data;
    } catch (error) {
      console.error('Error fetching petition enums:', error);
      throw error;
    }
  }

  // Get petition loan types
  async getPetitionLoanTypes() {
    try {
      const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_LOAN_TYPES);
      return response.data;
    } catch (error) {
      console.error('Error fetching petition loan types:', error);
      throw error;
    }
  }

  // Get petition assignee types
  async getPetitionAssigneeTypes() {
    try {
      const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_ASSIGNEE_TYPES);
      return response.data;
    } catch (error) {
      console.error('Error fetching petition assignee types:', error);
      throw error;
    }
  }

  // Get petition assignee roles
  async getPetitionAssigneeRoles() {
    try {
      const response = await axiosInstance.get(COMMON_ENDPOINTS.GET_PETITION_ASSIGNEE_ROLES);
      return response.data;
    } catch (error) {
      console.error('Error fetching petition assignee roles:', error);
      throw error;
    }
  }

  // Get all petition common data in one call
  async getAllPetitionCommonData() {
    try {
      const [enums, loanTypes, assigneeTypes, assigneeRoles] = await Promise.all([
        this.getPetitionEnums(),
        this.getPetitionLoanTypes(),
        this.getPetitionAssigneeTypes(),
        this.getPetitionAssigneeRoles()
      ]);

      return {
        success: true,
        data: {
          enums: enums.data,
          loanTypes: loanTypes.data,
          assigneeTypes: assigneeTypes.data,
          assigneeRoles: assigneeRoles.data
        }
      };
    } catch (error) {
      console.error('Error fetching all petition common data:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const commonPetitionService = new CommonPetitionService();

export default commonPetitionService;
