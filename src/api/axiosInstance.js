import axios from 'axios';
import { clearAuthData, getAuthData } from '../utils/storage';
import { refreshToken } from '../services/authService';
import Config from '../config/index';
import { isTokenExpired } from '../utils/tokenParser';
import { TOKEN } from '../constants/appConstants';

let refreshTokenPromise = null;

const refreshTokenIfNeeded = async () => {
  const { token, refreshToken: storedRefreshToken } = getAuthData();
  
  if (!isTokenExpired(token, TOKEN.EXPIRY_BUFFER)) {
    return token;
  }
  
  if (!storedRefreshToken) {
    return token;
  }
  
  if (refreshTokenPromise) {
    try {
      const newToken = await refreshTokenPromise;
      return newToken || token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return token;
    }
  }
  
  refreshTokenPromise = (async () => {
    try {
      const response = await refreshToken(storedRefreshToken);
      
      if (response?.isSuccess && response?.data?.token && response?.data?.refreshToken) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return response.data.token;
      }
      throw new Error('Refresh token failed');
    } catch (err) {
      console.error('Token refresh error:', err);
      throw err;
    } finally {
      refreshTokenPromise = null;
    }
  })();
  
  try {
    const newToken = await refreshTokenPromise;
    return newToken || token;
  } catch (error) {
    console.error('Token refresh promise error:', error);
    return token;
  }
};

const client = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

client.interceptors.request.use(
  async (config) => {
    if (!config.url?.includes('/Auth/') && !config.url?.includes('/Account/')) {
      const token = await refreshTokenIfNeeded();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    throw error;
  }
);

const handleTokenRefresh = async (storedRefreshToken) => {
  if (refreshTokenPromise) {
    try {
      return await refreshTokenPromise;
    } catch (refreshError) {
      console.error('Token refresh promise error:', refreshError);
      return null;
    }
  }

  refreshTokenPromise = (async () => {
    try {
      const response = await refreshToken(storedRefreshToken);
      
      if (response?.isSuccess && response?.data?.token && response?.data?.refreshToken) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return response.data.token;
      }
      throw new Error('Refresh token failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  try {
    return await refreshTokenPromise;
  } catch (refreshError) {
    console.error('Token refresh promise error:', refreshError);
    return null;
  }
};

const shouldSkipImpersonationRedirect = () => {
  const currentPath = globalThis.location?.pathname || '';
  return currentPath.startsWith('/request-impersonate-user');
};

const redirectToLogin = () => {
  clearAuthData();
  globalThis.location.href = '/login';
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (shouldSkipImpersonationRedirect()) {
        throw error;
      }
      
      originalRequest._retry = true;
      
      try {
        const { refreshToken: storedRefreshToken } = getAuthData();
        
        if (storedRefreshToken) {
          const newToken = await handleTokenRefresh(storedRefreshToken);
          
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      redirectToLogin();
    }
    
    throw error;
  }
);

export default client;
