import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import petitionApiService from '../services/petitionApiService';
import { getOrganizationById } from '../services/organizationService';
import { toast } from 'react-toastify';

export const usePetitions = () => {
  const { organization, isAuthenticated, hasOrganizationAccess, organizationCheckComplete } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [petitionCounts, setPetitionCounts] = useState({
    totalRecords: 0,
    totalSubmittedCount: 0,
    totalDraftedCount: 0,
    totalClosedCount: 0
  });

  // Get organization ID from the organization context
  const userOrganizationId = organization?.id || null;


  // Fetch recent petitions for the user's organization (last 5 updated)
  const fetchRecentPetitions = async () => {
    if (!hasOrganizationAccess) {
      setError('User must be part of an organization to view petitions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paginationParams = {
        organizationId: userOrganizationId,
        pageNumber: 1,
        pageSize: 5, // Get only last 5 petitions
        searchText: "",
        status: null, // Get all statuses
        fromDate: null,
        toDate: null,
        sortColumn: "ModifiedDate", // Sort by modification date
        sortDirection: "desc" // Most recent first
      };

      const response = await petitionApiService.getPetitionsPaged(paginationParams);
      
      if (response.success) {
        const formattedPetitions = petitionApiService.transformApiResponseToDisplayFormat(response);
        setPetitions(formattedPetitions);
      } else {
        setError(response.message || 'Failed to fetch petitions');
        toast.error(response.message || 'Failed to fetch petitions');
      }
    } catch (err) {
      console.error('Error fetching recent petitions:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch petitions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch petition counts for the user's organization
  const fetchPetitionCounts = async () => {
    if (!hasOrganizationAccess) {
      console.log('No organization access, skipping petition counts fetch');
      return;
    }

    console.log('Fetching petition counts for organization:', userOrganizationId);

    try {
      const response = await petitionApiService.getPetitionCountByOrganization(userOrganizationId);
      console.log('Petition counts API response:', response);
      
      if (response.success && response.data) {
        console.log('Setting petition counts:', response.data);
        setPetitionCounts(response.data);
      } else {
        console.log('No valid data in response:', response);
      }
    } catch (err) {
      console.error('Error fetching petition counts:', err);
    }
  };

  // Legacy function for backward compatibility
  const fetchPetitions = async () => {
    await fetchRecentPetitions();
  };

  // Submit a new petition
  const submitPetition = async (formData) => {
    if (!hasOrganizationAccess) {
      throw new Error('User must be part of an organization to submit petitions');
    }

    setLoading(true);
    setError(null);

    try {
      // Get the organization ID from the user's organization details
      let organizationId = userOrganizationId;
      
      if (!organizationId) {
        throw new Error('Organization ID not found. Please ensure you are part of an organization.');
      }
      
      const apiData = await petitionApiService.transformFormDataToApiFormat(formData, organizationId);
      
      const response = await petitionApiService.submitPetition(apiData);
      
      if (response.success) {
        toast.success('Petition submitted successfully!');
        // Refresh the petitions list
        await fetchPetitions();
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to submit petition';
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error submitting petition:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit petition';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch petitions and counts when organization access is confirmed
  useEffect(() => {
    console.log('usePetitions useEffect triggered:', {
      organizationCheckComplete,
      hasOrganizationAccess,
      userOrganizationId
    });
    
    if (organizationCheckComplete && hasOrganizationAccess && userOrganizationId) {
      console.log('Fetching petitions and counts...');
      fetchRecentPetitions();
      fetchPetitionCounts();
    } else if (organizationCheckComplete && !hasOrganizationAccess) {
      console.log('No organization access, clearing data');
      setPetitions([]);
      setPetitionCounts({
        totalRecords: 0,
        totalSubmittedCount: 0,
        totalDraftedCount: 0,
        totalClosedCount: 0
      });
      setError(null);
    }
  }, [organizationCheckComplete, hasOrganizationAccess, userOrganizationId]);

  return {
    petitions,
    loading,
    error,
    petitionCounts,
    hasOrganizationAccess,
    fetchPetitions,
    fetchRecentPetitions,
    fetchPetitionCounts,
    submitPetition,
    organization: organization,
    userOrganizationId,
    organizationCheckComplete
  };
};
