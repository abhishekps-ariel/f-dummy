import axios from 'axios';
import { clearAuthData, getAuthData } from '../utils/storage';
import { refreshToken } from '../services/authService';
import Config from '../config/index';

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

// Function to proactively refresh token
const refreshTokenIfNeeded = async () => {
  const { token, refreshToken: storedRefreshToken } = getAuthData();
  
  if (isTokenExpired(token) && storedRefreshToken) {
    try {
      const response = await refreshToken(storedRefreshToken);
      
      if (response.isSuccess && response.data) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        return response.data.token;
      }
    } catch (error) {
    }
  }
  
  return token;
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
      originalRequest._retry = true;
      
      try {
        const { refreshToken: storedRefreshToken } = getAuthData();
        
        if (storedRefreshToken) {
          const response = await refreshToken(storedRefreshToken);
          
          if (response.isSuccess && response.data) {
            // Update the stored tokens
            localStorage.setItem('token', response.data.token);
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
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
