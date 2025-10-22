import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import petitionApiService from '../services/petitionApiService';
import { getUserJoinRequests, getOrganizationById } from '../services/organizationService';
import { toast } from 'react-toastify';

export const usePetitions = () => {
  const { organization, isAuthenticated } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [userOrganizationId, setUserOrganizationId] = useState(null);
  const [organizationCheckComplete, setOrganizationCheckComplete] = useState(false);

  // Check if user has organization access by looking for approved join requests
  const hasOrganizationAccess = isAuthenticated && userOrganizationId;

  // Check user's join requests to determine organization membership
  const checkOrganizationMembership = async () => {
    if (!isAuthenticated) {
      setOrganizationCheckComplete(true);
      setLoading(false);
      return;
    }

    try {
      const response = await getUserJoinRequests();
      
      if (response.isSuccess && response.data) {
        // Look for approved join request (status: 1)
        const approvedRequest = response.data.find(request => request.status === 1);
        if (approvedRequest) {
          setUserOrganizationId(approvedRequest.organizationId);
        } else {
          setUserOrganizationId(null);
        }
      } else {
        setUserOrganizationId(null);
      }
    } catch (error) {
      console.error('Error checking organization membership:', error);
      setUserOrganizationId(null);
    } finally {
      setOrganizationCheckComplete(true);
      setLoading(false);
    }
  };


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
      
      const apiData = petitionApiService.transformFormDataToApiFormat(formData, organizationId);
      
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

  // Check organization membership when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      checkOrganizationMembership();
    } else {
      setUserOrganizationId(null);
      setPetitions([]);
      setError(null);
      setOrganizationCheckComplete(true);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Auto-fetch petitions when organization ID changes
  useEffect(() => {
    if (hasOrganizationAccess) {
      fetchPetitions();
    } else {
      setPetitions([]);
      setError(null);
    }
  }, [userOrganizationId, isAuthenticated]);

  return {
    petitions,
    loading,
    error,
    hasOrganizationAccess,
    fetchPetitions,
    submitPetition,
    organization: userOrganizationId ? { id: userOrganizationId } : null,
    userOrganizationId,
    organizationCheckComplete
  };
};
