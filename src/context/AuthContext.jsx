import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthData } from '../utils/storage';
import { getUserJoinRequests, getOrganizationById } from '../services/organizationService';

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

  // Check organization access when user is authenticated
  const checkOrganizationAccess = async () => {
    if (!isAuthenticated) {
      setHasOrganizationAccess(false);
      setOrganizationCheckComplete(true);
      return;
    }

    try {
      const response = await getUserJoinRequests();
      
      if (response.isSuccess && response.data) {
        // Look for approved join request (status: 1)
        const approvedRequest = response.data.find(request => request.status === 1);
        if (approvedRequest) {
          setHasOrganizationAccess(true);
          // Fetch full organization details
          try {
            const orgResponse = await getOrganizationById(approvedRequest.organizationId);
            if (orgResponse.isSuccess && orgResponse.data) {
              setOrganization(orgResponse.data);
            } else {
              // Fallback to just ID if full details can't be fetched
              setOrganization({ id: approvedRequest.organizationId });
            }
          } catch (error) {
            console.error('Error fetching organization details:', error);
            // Fallback to just ID if full details can't be fetched
            setOrganization({ id: approvedRequest.organizationId });
          }
        } else {
          setHasOrganizationAccess(false);
        }
      } else {
        setHasOrganizationAccess(false);
      }
    } catch (error) {
      console.error('Error checking organization access:', error);
      setHasOrganizationAccess(false);
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
          // Set organization if available in user data
          if (userData.organization) {
            setOrganization(userData.organization);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setOrganization(null);
          setHasOrganizationAccess(false);
          setOrganizationCheckComplete(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
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

  // Check organization access when authentication status changes
  useEffect(() => {
    if (isAuthenticated && !organizationCheckComplete) {
      checkOrganizationAccess();
    }
  }, [isAuthenticated]);


  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    if (userData.organization) {
      setOrganization(userData.organization);
    }
    // Reset organization check states for new login
    setOrganizationCheckComplete(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setOrganization(null);
    setHasOrganizationAccess(false);
    setOrganizationCheckComplete(false);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

