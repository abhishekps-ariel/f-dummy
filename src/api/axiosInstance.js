import axios from 'axios';
import { clearAuthData, getAuthData } from '../utils/storage';
import { refreshToken } from '../services/authService';
import Config from '../config/index';

// Refresh token lock to prevent concurrent refresh calls
let refreshTokenPromise = null;

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

// Function to proactively refresh token with lock mechanism
const refreshTokenIfNeeded = async () => {
  const { token, refreshToken: storedRefreshToken } = getAuthData();
  
  // If token is still valid, return it immediately
  if (!isTokenExpired(token)) {
    return token;
  }
  
  // If no refresh token available, return current token
  if (!storedRefreshToken) {
    return token;
  }
  
  // If a refresh is already in progress, wait for it
  if (refreshTokenPromise) {
    try {
      const newToken = await refreshTokenPromise;
      return newToken || token;
    } catch (error) {
      // If refresh failed, return current token
      return token;
    }
  }
  
  // Start a new refresh
  refreshTokenPromise = (async () => {
    try {
      const response = await refreshToken(storedRefreshToken);
      
      if (response.isSuccess && response.data) {
        // Update both access token and refresh token (both are returned in the response)
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        return response.data.token;
      }
      throw new Error('Refresh token failed');
    } catch (error) {
      // Clear the promise on error so next request can retry
      throw error;
    } finally {
      // Clear the promise after completion (success or failure)
      refreshTokenPromise = null;
    }
  })();
  
  try {
    const newToken = await refreshTokenPromise;
    return newToken || token;
  } catch (error) {
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
    // Skip token refresh for auth endpoints to avoid infinite loops
    if (!config.url?.includes('/Auth/') && !config.url?.includes('/Account/')) {
      const token = await refreshTokenIfNeeded();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // For auth endpoints, just use the current token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid redirecting away from impersonation handler while it's processing
      const currentPath = window.location?.pathname || '';
      if (currentPath.startsWith('/request-impersonate-user')) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      
      try {
        const { refreshToken: storedRefreshToken } = getAuthData();
        
        if (storedRefreshToken) {
          let newToken;
          
          // If a refresh is already in progress, wait for it
          if (refreshTokenPromise) {
            try {
              newToken = await refreshTokenPromise;
            } catch (refreshError) {
              // Refresh failed, will handle below
            }
          } else {
            // Start a new refresh
            refreshTokenPromise = (async () => {
              try {
                const response = await refreshToken(storedRefreshToken);
                
                if (response.isSuccess && response.data) {
                  // Update both access token and refresh token (both are returned in the response)
                  localStorage.setItem('token', response.data.token);
                  if (response.data.refreshToken) {
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                  }
                  return response.data.token;
                }
                throw new Error('Refresh token failed');
              } catch (error) {
                throw error;
              } finally {
                refreshTokenPromise = null;
              }
            })();
            
            try {
              newToken = await refreshTokenPromise;
            } catch (refreshError) {
              // Refresh failed, will handle below
            }
          }
          
          if (newToken) {
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        }
      } catch (refreshError) {
      }
      
      // If refresh fails, clear auth data and redirect to login
      clearAuthData();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default client;
