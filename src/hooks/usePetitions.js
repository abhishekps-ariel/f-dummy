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

  // Get organization ID from the organization context
  const userOrganizationId = organization?.id || null;


  // Fetch petitions for the user's organization
  const fetchPetitions = async () => {
    if (!hasOrganizationAccess) {
      setError('User must be part of an organization to view petitions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await petitionApiService.getPetitionsByOrganization(userOrganizationId);
      
      if (response.success) {
        const formattedPetitions = petitionApiService.transformApiResponseToDisplayFormat(response);
        setPetitions(formattedPetitions);
      } else {
        setError(response.message || 'Failed to fetch petitions');
        toast.error(response.message || 'Failed to fetch petitions');
      }
    } catch (err) {
      console.error('Error fetching petitions:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch petitions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
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

  // Auto-fetch petitions when organization access is confirmed
  useEffect(() => {
    if (organizationCheckComplete && hasOrganizationAccess && userOrganizationId) {
      fetchPetitions();
    } else if (organizationCheckComplete && !hasOrganizationAccess) {
      setPetitions([]);
      setError(null);
    }
  }, [organizationCheckComplete, hasOrganizationAccess, userOrganizationId]);

  return {
    petitions,
    loading,
    error,
    hasOrganizationAccess,
    fetchPetitions,
    submitPetition,
    organization: organization,
    userOrganizationId,
    organizationCheckComplete
  };
};
