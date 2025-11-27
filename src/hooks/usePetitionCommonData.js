import { useState, useEffect } from 'react';
import commonPetitionService from '../services/commonPetitionService';

export const usePetitionCommonData = () => {
  const [data, setData] = useState({
    enums: {
      petitionStatus: [],
      filingEntityRole: [],
      lienPosition: [],
      addressValidationStatus: [],
      judgmentTypes: [],
      foreclosureAlternativeOptions: []
    },
    loanTypes: [],
    assigneeTypes: [],
    assigneeRoles: [],
    buyerTypes: [],
    lenderTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await commonPetitionService.getAllPetitionCommonData();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error('Failed to fetch petition common data');
        }
      } catch (err) {
        setError(err.message || 'Failed to load petition data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper functions to get specific data
  const getPetitionStatuses = () => data.enums.petitionStatus || [];
  const getFilingEntityRoles = () => data.enums.filingEntityRole || [];
  const getLienPositions = () => data.enums.lienPosition || [];
  const getAddressValidationStatuses = () => data.enums.addressValidationStatus || [];
  const getJudgmentTypes = () => data.enums.judgmentTypes || [];
  const getForeclosureAlternativeOptions = () => data.enums.foreclosureAlternativeOptions || [];
  const getLoanTypes = () => data.loanTypes || [];
  const getAssigneeTypes = () => data.assigneeTypes || [];
  const getAssigneeRoles = () => data.assigneeRoles || [];
  const getBuyerTypes = () => data.buyerTypes || [];
  const getLenderTypes = () => data.lenderTypes || [];

  // Helper function to find option by value
  const findOptionByValue = (options, value) => {
    return options.find(option => option.value === value || option.id === value);
  };

  // Helper function to get option name by value
  const getOptionName = (options, value) => {
    const option = findOptionByValue(options, value);
    return option ? option.name : '';
  };

  return {
    data,
    loading,
    error,
    // Specific data getters
    getPetitionStatuses,
    getFilingEntityRoles,
    getLienPositions,
    getAddressValidationStatuses,
    getJudgmentTypes,
    getForeclosureAlternativeOptions,
    getLoanTypes,
    getAssigneeTypes,
    getAssigneeRoles,
    getBuyerTypes,
    getLenderTypes,
    // Helper functions
    findOptionByValue,
    getOptionName
  };
};
