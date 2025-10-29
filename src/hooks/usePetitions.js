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
      return;
    }


    try {
      const response = await petitionApiService.getPetitionCountByOrganization(userOrganizationId);
      
      if (response.success && response.data) {
        setPetitionCounts(response.data);
      } else {
      }
    } catch (err) {
    }
  };

  // Legacy function for backward compatibility
  const fetchPetitions = async () => {
    await fetchRecentPetitions();
  };

  // Submit a new petition or update existing petition
  const submitPetition = async (formData, isDraft = false, petitionId = null) => {
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
      
      const apiData = await petitionApiService.transformFormDataToApiFormat(formData, organizationId, petitionId);
      
      const response = await petitionApiService.submitPetition(apiData);
      
      if (response.success) {
        if (isDraft) {
          toast.success('Petition saved as draft!');
        } else {
          toast.success('Petition submitted successfully!');
        }
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
    
    if (organizationCheckComplete && hasOrganizationAccess && userOrganizationId) {
      fetchRecentPetitions();
      fetchPetitionCounts();
    } else if (organizationCheckComplete && !hasOrganizationAccess) {
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
