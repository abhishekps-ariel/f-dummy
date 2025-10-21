import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthData } from '../utils/storage';

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
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);


  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    if (userData.organization) {
      setOrganization(userData.organization);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setOrganization(null);
  };

  const updateOrganization = (orgData) => {
    setOrganization(orgData);
    // Also update user data to include organization
    if (user) {
      setUser({ ...user, organization: orgData });
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    organization,
    login,
    logout,
    updateOrganization,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

