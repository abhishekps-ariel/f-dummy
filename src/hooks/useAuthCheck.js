import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthData, clearAuthData } from '../utils/storage';
import { refreshToken } from '../services/authService';
import { ROUTES } from '../constants/routerConstants';
import { isTokenExpired, isRefreshTokenExpired } from '../utils/tokenParser';
import { TOKEN } from '../constants/appConstants';

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
        if (!isTokenExpired(token, TOKEN.EXPIRY_BUFFER)) {
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
            
           if (response?.isSuccess && response?.data?.token && response?.data?.refreshToken){
              // Update stored tokens (both are always returned in the response)
              localStorage.setItem('token', response.data.token);
              localStorage.setItem('refreshToken', response.data.refreshToken);
              
              setAuthStatus('authenticated');
              setIsChecking(false);
              
              // Redirect to dashboard if on home page
              if (location.pathname === ROUTES.HOME) {
                navigate(ROUTES.DASHBOARD, { replace: true });
              }
              return;
            }
          } catch {
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
        
      } catch {
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
