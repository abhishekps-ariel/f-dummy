import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthData } from '../utils/storage';
import { getOrganizationById } from '../services/organizationService';

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

  // Check organization access based on organizationId in user object
  const checkOrganizationAccess = async () => {
    if (!isAuthenticated || !user) {
      setHasOrganizationAccess(false);
      setOrganizationCheckComplete(true);
      return;
    }

    try {
      // Check if user has organizationId
      // Handle both string and null/undefined cases
      const orgId = user.organizationId;
      if (orgId && typeof orgId === 'string' && orgId.trim() !== '') {
        setHasOrganizationAccess(true);
        // Optionally fetch full organization details
        try {
          const orgResponse = await getOrganizationById(orgId);
          if (orgResponse.isSuccess && orgResponse.data) {
            setOrganization(orgResponse.data);
          } else {
            // Fallback to just ID if full details can't be fetched
            setOrganization({ id: orgId });
          }
        } catch (error) {
          // Fallback to just ID if full details can't be fetched
          setOrganization({ id: orgId });
        }
      } else {
        setHasOrganizationAccess(false);
        setOrganization(null);
      }
    } catch (error) {
      setHasOrganizationAccess(false);
      setOrganization(null);
    } finally {
      setOrganizationCheckComplete(true);
    }
  };

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const { token, user: userData } = getAuthData();
        
        if (token && userData) {
          setIsAuthenticated(true);
          setUser(userData);
          
          // Check organization access immediately based on organizationId
          // Handle both string and null/undefined cases
          const orgId = userData.organizationId;
          if (orgId && typeof orgId === 'string' && orgId.trim() !== '') {
            setHasOrganizationAccess(true);
            // Set organization with ID, will fetch full details in useEffect
            setOrganization({ id: orgId });
          } else {
            setHasOrganizationAccess(false);
            setOrganization(null);
          }
          setOrganizationCheckComplete(true);
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

  // Check organization access and fetch full organization details when user is available
  useEffect(() => {
    if (isAuthenticated && user) {
      const orgId = user.organizationId;
      // Check if user has organizationId (handle string and non-string cases)
      if (orgId && typeof orgId === 'string' && orgId.trim() !== '') {
        // Only fetch if organization is not set or only has ID (no full details)
        const needsFullDetails = !organization || (organization && !organization.name && organization.id === orgId);
        
        if (needsFullDetails) {
          // Fetch full organization details if we have organizationId
          const fetchOrgDetails = async () => {
            try {
              const orgResponse = await getOrganizationById(orgId);
              if (orgResponse.isSuccess && orgResponse.data) {
                setOrganization(orgResponse.data);
              } else {
                // Ensure we at least have the ID
                if (!organization || organization.id !== orgId) {
                  setOrganization({ id: orgId });
                }
              }
            } catch (error) {
              // Keep organization with just ID if fetch fails
              console.error('Failed to fetch organization details:', error);
              if (!organization || organization.id !== orgId) {
                setOrganization({ id: orgId });
              }
            }
          };
          fetchOrgDetails();
        }
      } else if (!hasOrganizationAccess && orgId) {
        // If we have orgId but access is false, set it
        setHasOrganizationAccess(true);
        setOrganization({ id: orgId });
      }
    }
  }, [isAuthenticated, user, organization, hasOrganizationAccess]);


  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    
    // Check organization access immediately based on organizationId
    // Handle both string and null/undefined cases
    const orgId = userData.organizationId;
      localStorage.setItem("organizationId", orgId);
    if (orgId && typeof orgId === 'string' && orgId.trim() !== '') {
      setHasOrganizationAccess(true);
      setOrganization({ id: orgId });
      setOrganizationCheckComplete(true);
      // Fetch full organization details
      const fetchOrgDetails = async () => {
        try {
          const orgResponse = await getOrganizationById(orgId);
          if (orgResponse.isSuccess && orgResponse.data) {
            setOrganization(orgResponse.data);
          } else {
            // Ensure we at least have the ID
            setOrganization({ id: orgId });
          }
        } catch (error) {
          // Keep organization with just ID if fetch fails
          console.error('Failed to fetch organization details:', error);
          setOrganization({ id: orgId });
        }
      };
      fetchOrgDetails();
    } else {
      setHasOrganizationAccess(false);
      setOrganization(null);
      setOrganizationCheckComplete(true);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

