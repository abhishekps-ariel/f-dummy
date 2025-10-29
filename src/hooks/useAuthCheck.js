import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthData, clearAuthData } from '../utils/storage';
import { refreshToken } from '../services/authService';
import { ROUTES } from '../constants/routerConstants';

// Function to check if token is expired or about to expire (within 5 minutes)
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

// Function to check if refresh token is expired
const isRefreshTokenExpired = (refreshToken) => {
  if (!refreshToken) return true;
  
  try {
    const payload = JSON.parse(atob(refreshToken.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = payload.exp;
    
    return currentTime >= expirationTime;
  } catch (error) {
    return true;
  }
};

export const useAuthCheck = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { token, refreshToken: storedRefreshToken, user } = getAuthData();
        
        // Case 3: No tokens or user data
        if (!token || !user) {
          setAuthStatus('unauthenticated');
          setIsChecking(false);
          return;
        }

        // Case 1: Access token is still valid
        if (!isTokenExpired(token)) {
          setAuthStatus('authenticated');
          setIsChecking(false);
          
          // Redirect to dashboard if on home page
          if (location.pathname === ROUTES.HOME) {
            navigate(ROUTES.DASHBOARD, { replace: true });
          }
          return;
        }

        // Case 2: Access token expired, check refresh token
        if (storedRefreshToken && !isRefreshTokenExpired(storedRefreshToken)) {
          try {
            const response = await refreshToken(storedRefreshToken);
            
            if (response.isSuccess && response.data) {
              // Update stored tokens
              localStorage.setItem('token', response.data.token);
              if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
              }
              
              setAuthStatus('authenticated');
              setIsChecking(false);
              
              // Redirect to dashboard if on home page
              if (location.pathname === ROUTES.HOME) {
                navigate(ROUTES.DASHBOARD, { replace: true });
              }
              return;
            }
          } catch (error) {
            // Refresh failed, clear auth data
            clearAuthData();
            setAuthStatus('unauthenticated');
            setIsChecking(false);
            return;
          }
        }

        // Both tokens expired or refresh failed
        clearAuthData();
        setAuthStatus('unauthenticated');
        setIsChecking(false);
        
      } catch (error) {
        // Any error during auth check
        clearAuthData();
        setAuthStatus('unauthenticated');
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, [location.pathname, navigate]);

  return {
    isChecking,
    authStatus,
    isAuthenticated: authStatus === 'authenticated',
    isUnauthenticated: authStatus === 'unauthenticated'
  };
};
