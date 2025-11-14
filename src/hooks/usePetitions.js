import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import petitionApiService from '../services/petitionApiService';
import { getOrganizationById } from '../services/organizationService';
import { toast } from 'react-toastify';
import { getActiveOrganizationId, getUserRole } from '../utils/storage';

export const usePetitions = () => {
  const {
    organization,
    user,
    isAuthenticated,
    hasOrganizationAccess,
    organizationCheckComplete,
  } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [petitionCounts, setPetitionCounts] = useState({
    totalRecords: 0,
    totalSubmittedCount: 0,
    totalDraftedCount: 0,
    totalClosedCount: 0
  });

  // Helper function to check if user is org admin
  const isOrgAdminUser = (userData) => {
    if (!userData) return false;
    if (userData.isManager === true) {
      return true;
    }
    if (userData.roles && Array.isArray(userData.roles)) {
      return userData.roles.some(
        (role) =>
          role === 'Organisation Admin' ||
          role === 'Organization Admin' ||
          role === 'orgAdmin'
      );
    }
    const userRole = getUserRole(userData);
    if (userRole === 'orgAdmin' || userRole === 'Organisation Admin' || userRole === 'Organization Admin') {
      return true;
    }
    return false;
  };

  // Get organization ID from user object or active organization context
  // Priority: activeOrganizationId > user.organizationId > organization.id
  const storedActiveOrganizationId = getActiveOrganizationId();
  const userOrganizationId =
    storedActiveOrganizationId || user?.organizationId || organization?.id || null;
  
  // Determine if user is org admin or filer
  const isOrgAdmin = isOrgAdminUser(user);


  // Fetch recent petitions for the user's organization (last 5 updated)
  const fetchRecentPetitions = async () => {
    if (!hasOrganizationAccess) {
      setError('User must be part of an organization to view petitions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For org admin: send organizationId and userId as null
      // For filer: send userId and organizationId as null
      const paginationParams = {
        organizationId: isOrgAdmin ? userOrganizationId : null,
        userId: isOrgAdmin ? null : (user?.id || null),
        pageNumber: 1, // API uses 1-based indexing
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
      // For org admin: send organizationId and userId as null
      // For filer: send userId and organizationId as null
      const countParams = {
        organizationId: isOrgAdmin ? userOrganizationId : null,
        userId: isOrgAdmin ? null : (user?.id || null)
      };
      
      const response = await petitionApiService.getPetitionCount(countParams);
      
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
    let errorAlreadyShown = false; // Track if we've already shown the error toast

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
          toast.success('Draft saved successfully.');
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
        errorAlreadyShown = true; // Mark that we've already shown the toast
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit petition';
      setError(errorMessage);
      
      // Only show toast if we haven't already shown it in the else block above
      if (!errorAlreadyShown) {
        toast.error(errorMessage);
      }
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
