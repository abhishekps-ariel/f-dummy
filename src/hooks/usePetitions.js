import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import petitionApiService from '../services/petitionApiService';
import { getOrganizationById } from '../services/organizationService';
import { toast } from 'react-toastify';
import { getActiveOrganizationId, getUserRole } from '../utils/storage';

// Helper function to check if user is org admin
const isOrgAdminUser = (userData) => {
  if (!userData) return false;
  if (userData.isManager === true) return true;
  if (userData.roles && Array.isArray(userData.roles)) {
    return userData.roles.some(
      (role) =>
        role === 'Organisation Admin' ||
        role === 'Organization Admin' ||
        role === 'orgAdmin'
    );
  }
  const userRole = getUserRole(userData);
  return (
    userRole === 'orgAdmin' ||
    userRole === 'Organisation Admin' ||
    userRole === 'Organization Admin'
  );
};

export const usePetitions = () => {
  const {
    organization,
    user,
    isAuthenticated,
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

  // Determine if user is org admin or filer
  const isOrgAdmin = isOrgAdminUser(user);
  
  // Get organization ID from user object or active organization context (for org admins)
  // Priority: activeOrganizationId > user.organizationId > organization.id
  const storedActiveOrganizationId = getActiveOrganizationId();
  const userOrganizationId =
    storedActiveOrganizationId || user?.organizationId || organization?.id || null;
  
  // For filers, use userId; for org admins, use organizationId
  const userId = user?.id || null;


  // Fetch recent petitions for the user's organization (last 5 updated)
  const fetchRecentPetitions = async () => {
    setLoading(true);
    setError(null);

    try {
      const paginationParams = {
        pageNumber: 1,
        pageSize: 5, // Get only last 5 petitions
        searchText: "",
        status: null, // Get all statuses
        fromDate: null,
        toDate: null,
        sortColumn: "ModifiedDate", // Sort by modification date
        sortDirection: "desc" // Most recent first
      };

      // For filers, send userId; for org admins, send organizationId
      if (isOrgAdmin && userOrganizationId) {
        paginationParams.organizationId = userOrganizationId;
      } else if (!isOrgAdmin && userId) {
        paginationParams.userId = userId;
      }

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

  // Fetch petition counts for the user's organization or user
  const fetchPetitionCounts = async () => {
    try {
      const params = {};
      // For filers, send userId; for org admins, send organizationId
      if (isOrgAdmin && userOrganizationId) {
        params.organizationId = userOrganizationId;
      } else if (!isOrgAdmin && userId) {
        params.userId = userId;
      } else {
        return; // No valid ID to fetch counts
      }

      const response = await petitionApiService.getPetitionCount(params);
      
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
  const submitPetition = async (formData, isDraft = false, petitionId = null, suppressToast = false, statusString = null) => {
    setLoading(true);
    setError(null);
    let errorAlreadyShown = false; // Track if we've already shown the error toast

    try {
      // Get the organization ID - prioritize from formData (for filers who select org), then fall back to user's org
      let organizationId = formData?.organizationId || userOrganizationId;
      
      if (!organizationId) {
        throw new Error('Organization ID not found. Please select an organization or ensure you are part of an organization.');
      }
      
      const apiData = await petitionApiService.transformFormDataToApiFormat(formData, organizationId, petitionId, statusString);
      
      const response = await petitionApiService.submitPetition(apiData);
      
      if (response.success) {
        if (!suppressToast) {
          if (isDraft) {
            toast.success('Draft saved successfully.');
          } else {
            toast.success('Petition submitted successfully!');
          }
        }
        // Refresh the petitions list
        await fetchPetitions();
        return response.data;
      } else {
        // Check if this is a duplicate with take-over option
        if (response.isDuplicate && response.duplicateInfo?.canTakeOver) {
          // Return the duplicate info so the component can show the modal
          const duplicateError = new Error(response.message || 'A petition with the same property already exists.');
          duplicateError.isDuplicate = true;
          duplicateError.duplicateInfo = response.duplicateInfo;
          throw duplicateError;
        }
        
        const errorMessage = response.message || 'Failed to submit petition';
        setError(errorMessage);
        toast.error(errorMessage);
        errorAlreadyShown = true; // Mark that we've already shown the toast
        throw new Error(errorMessage);
      }
    } catch (err) {
      // If it's a duplicate error with take-over option, re-throw it as-is
      if (err.isDuplicate && err.duplicateInfo) {
        throw err;
      }
      
      // Check if the error response contains duplicate info
      const responseData = err.response?.data;
      if (responseData?.isDuplicate && responseData?.duplicateInfo?.canTakeOver) {
        const duplicateError = new Error(responseData.message || 'A petition with the same property already exists.');
        duplicateError.isDuplicate = true;
        duplicateError.duplicateInfo = responseData.duplicateInfo;
        throw duplicateError;
      }
      
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

  // Auto-fetch petitions and counts when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // For filers, check userId; for org admins, check organizationId
      if ((isOrgAdmin && userOrganizationId) || (!isOrgAdmin && userId)) {
        fetchRecentPetitions();
        fetchPetitionCounts();
      }
    }
  }, [isAuthenticated, isOrgAdmin, userOrganizationId, userId]);

  return {
    petitions,
    loading,
    error,
    petitionCounts,
    fetchPetitions,
    fetchRecentPetitions,
    fetchPetitionCounts,
    submitPetition,
    organization: organization,
    userOrganizationId,
  };
};
