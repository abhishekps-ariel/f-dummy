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

  // Helper function to check if user is org admin
  const isOrgAdminUser = (userData) => {
    if (!userData) return false;
    
    // Check if isManager is true
    if (userData.isManager === true) {
      return true;
    }
    
    // Check roles array for "Organisation Admin"
    if (userData.roles && Array.isArray(userData.roles)) {
      return userData.roles.some(
        (role) =>
          role === "Organisation Admin" ||
          role === "Organization Admin" ||
          role === "orgAdmin"
      );
    }
    
    // Check single role field
    const userRole = getUserRole(userData);
    if (userRole === "orgAdmin" || userRole === "Organisation Admin" || userRole === "Organization Admin") {
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
        organizationList.some(
          (org) => org?.organizationId && org.organizationId === candidate
        )
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

  const initializeOrganizationsState = (userData, { preferStoredSelection = true } = {}) => {
    const baseList = Array.isArray(userData?.organizations)
      ? userData.organizations.filter((org) => Boolean(org?.organizationId))
      : [];

    const fallbackList =
      baseList.length === 0 && userData?.organizationId
        ? [
            {
              organizationId: userData.organizationId,
              name: userData.organizationName || '',
              isPrimary: true,
              organizationEmail: userData.organizationEmail || '',
              organizationPhone: userData.organizationPhone || '',
            },
          ]
        : [];

    const organizationList = [...baseList, ...fallbackList];
    setOrganizations(organizationList);

    const storedActiveId = preferStoredSelection ? getStoredActiveOrganizationId() : null;
    const fallbackId = userData?.organizationId ?? null;
    const resolvedActiveId = resolveActiveOrganizationId(
      organizationList,
      storedActiveId,
      fallbackId
    );

    persistActiveOrganizationSelection(resolvedActiveId);

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
  }, [activeOrganizationId]);

  // Check organization access based on organizationId in user object
  const checkOrganizationAccess = async (userDataOverride = null) => {
    // Use provided userData or fall back to state user
    const userToCheck = userDataOverride || user;
    
    // If userDataOverride is provided, we're checking during login, so skip isAuthenticated check
    if (!userToCheck) {
      setHasOrganizationAccess(false);
      setOrganizationCheckComplete(true);
      return;
    }
    
    // If using state user, check isAuthenticated
    if (!userDataOverride && !isAuthenticated) {
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

      if (isOrgAdmin) {
        if (hasOrganizations) {
          setHasOrganizationAccess(true);
        } else {
          setHasOrganizationAccess(false);
          setOrganization(null);
          persistActiveOrganizationSelection(null);
        }
        setOrganizationCheckComplete(true);
        return;
      }

      if (hasOrganizations) {
        setHasOrganizationAccess(true);
        setOrganizationCheckComplete(true);
        return;
      }

      try {
        const requestsResponse = await getUserJoinRequests();
        if (requestsResponse.isSuccess && Array.isArray(requestsResponse.data)) {
          const approvedRequest = requestsResponse.data.find(
            (request) => request.status === 1 && request.organizationId
          );

          const userOrgId = userToCheck.organizationId;
          const approvedOrgId = approvedRequest?.organizationId;

          if (approvedRequest && approvedOrgId) {
            const orgIdMatches =
              !userOrgId ||
              (typeof userOrgId === 'string' &&
                userOrgId.trim() !== '' &&
                userOrgId === approvedOrgId);

            if (orgIdMatches) {
              setHasOrganizationAccess(true);
              persistActiveOrganizationSelection(approvedOrgId);
            } else {
              setHasOrganizationAccess(false);
              setOrganization(null);
              persistActiveOrganizationSelection(null);
            }
          } else {
            setHasOrganizationAccess(false);
            setOrganization(null);
            persistActiveOrganizationSelection(null);
          }
        } else {
          setHasOrganizationAccess(false);
          setOrganization(null);
          persistActiveOrganizationSelection(null);
        }
      } catch (error) {
        console.error('Error checking join requests:', error);
        setHasOrganizationAccess(false);
        setOrganization(null);
        persistActiveOrganizationSelection(null);
      }
    } catch (error) {
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
      return currentTime >= (expirationTime - 300);
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
    persistActiveOrganizationSelection(organizationId);
  };

  const syncUserData = (updatedUser) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    updateStoredUser(updatedUser);
    initializeOrganizationsState(updatedUser, { preferStoredSelection: true });
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

