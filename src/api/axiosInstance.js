import axios from 'axios';
import { clearAuthData } from '../utils/storage';
import Config from '../config/envConfig';

// Track 401 errors to prevent rapid-fire logout attempts
let lastLogoutTime = 0;
const LOGOUT_COOLDOWN = 2000; // 2 seconds cooldown

const client = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Check if this is a login-related endpoint that should NOT trigger logout
      const loginEndpoints = ['/api/Auth/login', '/api/Auth/verify-otp', '/api/Auth/check-mfa', '/api/Auth/register', '/api/Auth/forgot-password', '/api/Auth/reset-password'];
      const isLoginEndpoint = loginEndpoints.some(endpoint => 
        error.config?.url?.includes(endpoint)
      );
      
      // If it's a login endpoint, don't clear auth data
      if (isLoginEndpoint) {
        return Promise.reject(error);
      }
      
      // Check if this is a temporary network error vs actual auth failure
      const isNetworkError = !error.response || error.response.status === 0;
      if (isNetworkError) {
        console.log('Network error - not clearing auth data');
        return Promise.reject(error);
      }

      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;
      
      // Get refresh token from storage
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Attempt to refresh the token - check if endpoint exists first
          const refreshResponse = await axios.post(`${Config.API_URL}/api/Auth/refresh-token`, {
            refreshToken: refreshToken
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 5000 // Short timeout for refresh attempt
          });
          
          if (refreshResponse.data && refreshResponse.data.success) {
            // Update stored tokens
            const newToken = refreshResponse.data.data.accessToken;
            const newRefreshToken = refreshResponse.data.data.refreshToken;
            
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          console.log('Token refresh failed or endpoint not available:', refreshError);
          // If refresh fails (endpoint doesn't exist or token is invalid), clear auth data
        }
      }
      
      // If no refresh token or refresh failed, clear auth data
      // But only if we haven't logged out recently (cooldown period)
      const now = Date.now();
      if (now - lastLogoutTime > LOGOUT_COOLDOWN) {
        console.log('401 Unauthorized - clearing auth data');
        lastLogoutTime = now;
        clearAuthData();
        
        // Only redirect to login if we're not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else {
        console.log('401 Unauthorized - skipping logout due to cooldown');
      }
    }
    
    return Promise.reject(error);
  }
);

export default client;
