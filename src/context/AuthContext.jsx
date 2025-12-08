import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuthData,
  getUserRole,
  getActiveOrganizationId as getStoredActiveOrganizationId,
  setActiveOrganizationId as persistActiveOrganizationId,
  updateStoredUser,
} from '../utils/storage';
import { getOrganizationById, getUserJoinRequests } from '../services/organizationService';

// Default context value to prevent errors during initialization
const defaultAuthValue = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  organization: null,
  organizations: [],
  activeOrganizationId: null,
  login: async () => {},
  logout: () => {},
  updateOrganization: () => {},
  updateUserSignature: () => {},
  setActiveOrganization: () => {},
  syncUserData: () => {},
  isTokenExpired: () => true,
  setOrganization: () => {},
};

const AuthContext = createContext(defaultAuthValue);

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
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState(null);

  const resetPetitionTabsAfterOrgSwitch = () => {
    try {
      sessionStorage.removeItem('petitionTabs');
      sessionStorage.removeItem('activePetitionTab');
    } catch {
      // Failed to clear petition tabs from storage - non-critical
    }

    try {
      window.dispatchEvent(new Event('filir:petition-tabs-reset'));
    } catch {
      // Failed to dispatch petition tabs reset event - non-critical
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

    let baseList = Array.isArray(userData?.organizations)
      ? userData.organizations.filter((org) => Boolean(org?.organizationId))
      : [];

    if (baseList.length === 0 && storedActiveId) {
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
    setOrganizations(organizationList);

    const fallbackId = userData?.organizationId ?? null;
    const resolvedActiveId = resolveActiveOrganizationId(
      organizationList,
      storedActiveId,
      fallbackId
    );

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
      } catch {
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
            setHasOrganizationAccess(true);
            persistActiveOrganizationSelection(approvedOrgId);
            return true;
          }
        }
      }
    } catch {
      // Error checking join requests - non-critical
    }

    return false;
  };


  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { token, user: userData, activeOrganizationId: storedActiveOrgId } = getAuthData();

        if (token && userData) {
          setIsAuthenticated(true);
          setUser(userData);
          if (storedActiveOrgId) {
            persistActiveOrganizationSelection(storedActiveOrgId);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
          setOrganizations([]);
          setActiveOrganizationIdState(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
        setOrganizations([]);
        setActiveOrganizationIdState(null);
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
    } catch {
      return true;
    }
  };

  const login = async (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    initializeOrganizationsState(userData, { preferStoredSelection: false });
    updateStoredUser(userData);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
    setActiveOrganizationIdState(null);

    // Clear petition form data from localStorage on logout
    try {
      sessionStorage.removeItem('petitionFormData');
    } catch {
      // Error clearing petition form data on logout - non-critical
    }
  };

  const updateOrganization = (orgData) => {
    setOrganization(orgData);
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
        signatureBase64: signatureData.signatureBase64,
        signatureUrl: signatureData.signatureUrl, // Keep for backward compatibility
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
    organizations,
    activeOrganizationId,
    login,
    logout,
    updateOrganization,
    updateUserSignature,
    setActiveOrganization,
    syncUserData,
    isTokenExpired,
    setOrganization,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

