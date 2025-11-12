import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuthData,
  getUserRole,
  getActiveOrganizationId as getStoredActiveOrganizationId,
  setActiveOrganizationId as persistActiveOrganizationId,
  updateStoredUser,
} from '../utils/storage';
import { getOrganizationById, getUserJoinRequests } from '../services/organizationService';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [hasOrganizationAccess, setHasOrganizationAccess] = useState(false);
  const [organizationCheckComplete, setOrganizationCheckComplete] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState(null);

  const resetPetitionTabsAfterOrgSwitch = () => {
    try {
      localStorage.removeItem('petitionTabs');
      localStorage.removeItem('activePetitionTab');
    } catch (error) {
      console.error('Failed to clear petition tabs from storage on organization switch:', error);
    }

    try {
      window.dispatchEvent(new Event('filir:petition-tabs-reset'));
    } catch (error) {
      console.error('Failed to dispatch petition tabs reset event:', error);
    }
  };

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

  const resolveActiveOrganizationId = (organizationList, ...preferredIds) => {
    if (!Array.isArray(organizationList) || organizationList.length === 0) {
      return null;
    }

    for (const candidate of preferredIds) {
      if (
        candidate &&
        organizationList.some((org) => org?.organizationId && org.organizationId === candidate)
      ) {
        return candidate;
      }
    }

    const primaryOrganization = organizationList.find((org) => org?.isPrimary);
    if (primaryOrganization?.organizationId) {
      return primaryOrganization.organizationId;
    }

    return organizationList[0]?.organizationId ?? null;
  };

  const persistActiveOrganizationSelection = (organizationId) => {
    console.log('[AuthContext] Persisting active organization id:', organizationId);
    setActiveOrganizationIdState(organizationId ?? null);
    persistActiveOrganizationId(organizationId ?? null);
  };

  const buildFallbackOrganization = (organizationId, name = 'Organization') => ({
    organizationId,
    name,
    isPrimary: true,
    organizationEmail: '',
    organizationPhone: '',
  });

  const initializeOrganizationsState = (userData, { preferStoredSelection = true } = {}) => {
    const storedActiveId = preferStoredSelection ? getStoredActiveOrganizationId() : null;
    console.log('[AuthContext] initializeOrganizationsState', {
      userOrganizations: userData?.organizations,
      storedActiveId,
      userOrganizationId: userData?.organizationId,
    });

    let baseList = Array.isArray(userData?.organizations)
      ? userData.organizations.filter((org) => Boolean(org?.organizationId))
      : [];

    if (baseList.length === 0 && storedActiveId) {
      console.log('[AuthContext] Rebuilding org list from stored active id');
      baseList = [buildFallbackOrganization(storedActiveId)];
    }

    const fallbackList =
      baseList.length === 0 && userData?.organizationId
        ? [
            buildFallbackOrganization(
              userData.organizationId,
              userData.organizationName || 'Organization'
            ),
          ]
        : [];

    const organizationList = [...baseList, ...fallbackList];
    console.log('[AuthContext] Final organization list after initialization', organizationList);
    setOrganizations(organizationList);

    const fallbackId = userData?.organizationId ?? null;
    const resolvedActiveId = resolveActiveOrganizationId(
      organizationList,
      storedActiveId,
      fallbackId
    );

    console.log('[AuthContext] Resolved active organization id:', resolvedActiveId);
    if (resolvedActiveId) {
      persistActiveOrganizationSelection(resolvedActiveId);
    }

    return {
      organizationList,
      resolvedActiveId,
    };
  };

  useEffect(() => {
    const fetchActiveOrganizationDetails = async () => {
      if (!activeOrganizationId) {
        setOrganization(null);
        return;
      }

      const fromList = organizations.find(
        (org) => org.organizationId === activeOrganizationId
      );
      if (fromList) {
        setOrganization(fromList);
        return;
      }

      try {
        const response = await getOrganizationById(activeOrganizationId);
        if (response.isSuccess && response.data) {
          setOrganization(response.data);
        } else {
          setOrganization({ id: activeOrganizationId });
        }
      } catch (error) {
        setOrganization({ id: activeOrganizationId });
      }
    };

    fetchActiveOrganizationDetails();
  }, [activeOrganizationId, organizations]);

  const applyJoinRequestFallback = async (userToCheck) => {
    try {
      const requestsResponse = await getUserJoinRequests();
      if (requestsResponse.isSuccess && Array.isArray(requestsResponse.data)) {
        const approvedRequest = requestsResponse.data.find(
          (request) => request.status === 1 && request.organizationId
        );

        const userOrgId = userToCheck?.organizationId;
        const approvedOrgId = approvedRequest?.organizationId;

        console.log('[AuthContext] Join request fallback result', {
          approvedRequest,
          approvedOrgId,
          userOrgId,
        });

        if (approvedRequest && approvedOrgId) {
          const orgDetail = approvedRequest.organizationDetail || {};
          const fallbackOrganization = {
            organizationId: approvedOrgId,
            name: orgDetail.name || 'Organization',
            type: orgDetail.type || '',
            addressStreet1: orgDetail.addressStreet1 || '',
            addressStreet2: orgDetail.addressStreet2 || '',
            addressCity: orgDetail.addressCity || '',
            addressState: orgDetail.addressState || '',
            addressZip: orgDetail.addressZip || '',
            primaryContactName: orgDetail.primaryContactName || '',
            primaryContactEmail: orgDetail.primaryContactEmail || '',
            primaryContactPhone: orgDetail.primaryContactPhone || '',
            isPrimary: true,
          };

          setOrganizations([fallbackOrganization]);
          setOrganization(fallbackOrganization);

          const orgIdMatches =
            !userOrgId ||
            (typeof userOrgId === 'string' &&
              userOrgId.trim() !== '' &&
              userOrgId === approvedOrgId);

          if (orgIdMatches) {
            console.log('[AuthContext] Join request fallback succeeded');
            setHasOrganizationAccess(true);
            persistActiveOrganizationSelection(approvedOrgId);
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Error checking join requests:', error);
    }

    console.log('[AuthContext] Join request fallback failed');
    return false;
  };

  // Check organization access based on organizationId in user object
  const checkOrganizationAccess = async (userDataOverride = null) => {
    const userToCheck = userDataOverride || user;

    if (!userToCheck) {
      console.log('[AuthContext] No user data available for organization access check');
      setHasOrganizationAccess(false);
      setOrganizationCheckComplete(true);
      return;
    }

    if (!userDataOverride && !isAuthenticated) {
      console.log('[AuthContext] User not authenticated during access check');
      setHasOrganizationAccess(false);
      setOrganizationCheckComplete(true);
      return;
    }

    try {
      const isOrgAdmin = isOrgAdminUser(userToCheck);
      const { organizationList, resolvedActiveId } = initializeOrganizationsState(userToCheck, {
        preferStoredSelection: true,
      });
      const hasOrganizations = organizationList.length > 0 && Boolean(resolvedActiveId);

      console.log('[AuthContext] access check summary', {
        isOrgAdmin,
        hasOrganizations,
        resolvedActiveId,
        organizationList,
      });

      if (hasOrganizations) {
        setHasOrganizationAccess(true);
        setOrganizationCheckComplete(true);
        return;
      }

      const fallbackApplied = await applyJoinRequestFallback(userToCheck);
      if (!fallbackApplied) {
        setHasOrganizationAccess(false);
        setOrganization(null);
        persistActiveOrganizationSelection(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error during organization access check', error);
      setHasOrganizationAccess(false);
      setOrganization(null);
      persistActiveOrganizationSelection(null);
    } finally {
      setOrganizationCheckComplete(true);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { token, user: userData, activeOrganizationId: storedActiveOrgId } = getAuthData();

        console.log('[AuthContext] checkAuthStatus', {
          tokenPresent: Boolean(token),
          storedActiveOrgId,
        });

        if (token && userData) {
          setIsAuthenticated(true);
          setUser(userData);
          if (storedActiveOrgId) {
            persistActiveOrganizationSelection(storedActiveOrgId);
          }

          await checkOrganizationAccess(userData);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
          setOrganizations([]);
          setActiveOrganizationIdState(null);
          setHasOrganizationAccess(false);
          setOrganizationCheckComplete(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error during auth status check', error);
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
        setOrganizations([]);
        setActiveOrganizationIdState(null);
        setHasOrganizationAccess(false);
        setOrganizationCheckComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to validate token expiry
  const isTokenExpired = (token) => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;

      // Consider token expired if it expires within 5 minutes (300 seconds)
      return currentTime >= expirationTime - 300;
    } catch (error) {
      return true;
    }
  };

  const login = async (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    initializeOrganizationsState(userData, { preferStoredSelection: false });
    updateStoredUser(userData);

    await checkOrganizationAccess(userData);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
    setActiveOrganizationIdState(null);
    setHasOrganizationAccess(false);
    setOrganizationCheckComplete(false);

    // Clear petition form data from localStorage on logout
    try {
      localStorage.removeItem('petitionFormData');
    } catch (error) {
      console.error('Error clearing petition form data on logout:', error);
    }
  };

  const updateOrganization = (orgData) => {
    setOrganization(orgData);
    setHasOrganizationAccess(true);
    // Also update user data to include organization
    if (user) {
      const updatedUser = { ...user, organization: orgData };
      setUser(updatedUser);
      updateStoredUser(updatedUser);
    }
  };

  const setActiveOrganization = (organizationId) => {
    const normalizedId = organizationId ?? null;
    const isChangingOrganization = normalizedId !== activeOrganizationId;

    persistActiveOrganizationSelection(normalizedId);
    setHasOrganizationAccess(Boolean(normalizedId));

    if (normalizedId) {
      const match = organizations.find((org) => org.organizationId === normalizedId);
      setOrganization(match || { organizationId: normalizedId });
    } else {
      setOrganization(null);
    }

    if (isChangingOrganization) {
      resetPetitionTabsAfterOrgSwitch();
    }
  };

  const syncUserData = (updatedUser) => {
    if (!updatedUser) return;

    setUser((prevUser) => {
      const mergedUser = {
        ...(prevUser || {}),
        ...updatedUser,
        organizations:
          updatedUser.organizations !== undefined
            ? updatedUser.organizations
            : prevUser?.organizations || [],
      };

      console.log('[AuthContext] syncUserData merged result', mergedUser);
      updateStoredUser(mergedUser);
      initializeOrganizationsState(mergedUser, { preferStoredSelection: true });
      return mergedUser;
    });
  };

  const updateUserSignature = (signatureData) => {
    if (user) {
      const updatedUser = {
        ...user,
        signatureImageName: signatureData.signatureImageName,
        signatureUrl: signatureData.signatureUrl,
      };
      setUser(updatedUser);
      updateStoredUser(updatedUser);
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    organization,
    hasOrganizationAccess,
    organizationCheckComplete,
    organizations,
    activeOrganizationId,
    login,
    logout,
    updateOrganization,
    updateUserSignature,
    setActiveOrganization,
    syncUserData,
    isTokenExpired,
    setHasOrganizationAccess,
    setOrganizationCheckComplete,
    setOrganization,
    checkOrganizationAccess, // Expose for manual re-checking
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

