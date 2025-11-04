import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthData, getUserRole } from '../utils/storage';
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

  // Check organization access based on organizationId in user object
  const checkOrganizationAccess = async () => {
    if (!isAuthenticated || !user) {
      setHasOrganizationAccess(false);
      setOrganizationCheckComplete(true);
      return;
    }

    try {
      const isOrgAdmin = isOrgAdminUser(user);
      
      // For org admins: check organizationId directly
      if (isOrgAdmin) {
        const orgId = user.organizationId;
        if (orgId && typeof orgId === 'string' && orgId.trim() !== '') {
          setHasOrganizationAccess(true);
          // Fetch full organization details
          try {
            const orgResponse = await getOrganizationById(orgId);
            if (orgResponse.isSuccess && orgResponse.data) {
              setOrganization(orgResponse.data);
            } else {
              setOrganization({ id: orgId });
            }
          } catch (error) {
            setOrganization({ id: orgId });
          }
        } else {
          setHasOrganizationAccess(false);
          setOrganization(null);
        }
      } else {
        // For non-org admins: check my-requests to verify active access
        // This ensures that if org admin removes them, they'll be blocked immediately
        try {
          const requestsResponse = await getUserJoinRequests();
          if (requestsResponse.isSuccess && Array.isArray(requestsResponse.data)) {
            // Find approved request (status === 1 means Approved)
            const approvedRequest = requestsResponse.data.find(
              (request) => request.status === 1
            );
            
            // Get user's current organizationId from user object
            const userOrgId = user.organizationId;
            const approvedOrgId = approvedRequest?.organizationId;
            
            // If user has an approved request, grant access
            // Also verify that if user has organizationId, it matches the approved request
            // This ensures that if org admin removes them, their organizationId will be null/empty
            // and they'll be blocked on next check
            if (approvedRequest && approvedOrgId) {
              // Check if user's organizationId matches (if it exists)
              // If userOrgId is null/empty but approved request exists, still grant access
              // (user might not have orgId synced yet but request is approved)
              const orgIdMatches = !userOrgId || 
                (typeof userOrgId === 'string' && userOrgId.trim() !== '' && userOrgId === approvedOrgId);
              
              if (orgIdMatches) {
                // User has approved access
                setHasOrganizationAccess(true);
                
                // Use the approved request's organizationId (more reliable than user's orgId)
                const orgIdToUse = approvedOrgId;
                
                // Fetch full organization details
                try {
                  const orgResponse = await getOrganizationById(orgIdToUse);
                  if (orgResponse.isSuccess && orgResponse.data) {
                    setOrganization(orgResponse.data);
                  } else {
                    setOrganization({ id: orgIdToUse });
                  }
                } catch (error) {
                  setOrganization({ id: orgIdToUse });
                }
              } else {
                // User's organizationId doesn't match approved request - they were removed
                setHasOrganizationAccess(false);
                setOrganization(null);
              }
            } else {
              // No approved request found - user doesn't have access
              setHasOrganizationAccess(false);
              setOrganization(null);
            }
          } else {
            // API call failed or no requests
            setHasOrganizationAccess(false);
            setOrganization(null);
          }
        } catch (error) {
          console.error('Error checking join requests:', error);
          setHasOrganizationAccess(false);
          setOrganization(null);
        }
      }
    } catch (error) {
      setHasOrganizationAccess(false);
      setOrganization(null);
    } finally {
      setOrganizationCheckComplete(true);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { token, user: userData } = getAuthData();
        
        if (token && userData) {
          setIsAuthenticated(true);
          setUser(userData);
          
          // Check organization access using the proper check function
          // This will handle org admins vs regular users correctly
          // We'll check access after user is set in the next useEffect
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
          setHasOrganizationAccess(false);
          setOrganizationCheckComplete(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
        setHasOrganizationAccess(false);
        setOrganizationCheckComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
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

  // Re-check organization access when user changes (important for non-org admins)
  useEffect(() => {
    if (isAuthenticated && user && !organizationCheckComplete) {
      checkOrganizationAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);


  const login = async (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    
    // Check organization access using the proper check function
    // This will handle org admins vs regular users correctly
    await checkOrganizationAccess();
    
    // Store organizationId in localStorage for backward compatibility
    const orgId = userData.organizationId;
    if (orgId && typeof orgId === 'string' && orgId.trim() !== '') {
      localStorage.setItem("organizationId", orgId);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setOrganization(null);
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
      setUser({ ...user, organization: orgData });
    }
  };

  const updateUserSignature = (signatureData) => {
    if (user) {
      const updatedUser = {
        ...user,
        signatureImageName: signatureData.signatureImageName,
        signatureUrl: signatureData.signatureUrl,
      };
      setUser(updatedUser);
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    organization,
    hasOrganizationAccess,
    organizationCheckComplete,
    login,
    logout,
    updateOrganization,
    updateUserSignature,
    isTokenExpired,
    setHasOrganizationAccess,
    setOrganizationCheckComplete,
    setOrganization,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

