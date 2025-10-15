import axios from 'axios';
import { clearAuthData } from '../utils/storage';
import Config from '../config/envConfig';

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
      const loginEndpoints = ['/api/Auth/login', '/api/Auth/verify-otp', '/api/Auth/check-mfa'];
      const isLoginEndpoint = loginEndpoints.some(endpoint => 
        error.config?.url?.includes(endpoint)
      );
      
      // If it's a login endpoint, don't clear auth data
      if (isLoginEndpoint) {
        return Promise.reject(error);
      }

      // For other 401 errors, add a small delay before clearing auth data
      // This helps with temporary network issues or server hiccups
      originalRequest._retry = true;
      
      // Wait a bit before clearing auth data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('401 Unauthorized - clearing auth data after delay');
      clearAuthData();
    }
    
    return Promise.reject(error);
  }
);

export default client;
