export const storeAuthData = (authData) => {
  const { token, refreshToken, user } = authData;
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuthData = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  return { token, refreshToken, user };
};
// Track if logout is in progress to prevent multiple simultaneous logouts
let isLogoutInProgress = false;

export const clearAuthData = () => {
  // Prevent multiple simultaneous logout attempts
  if (isLogoutInProgress) {
    console.log('Logout already in progress, skipping...');
    return;
  }
  
  isLogoutInProgress = true;
  
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Dispatch custom event to notify AuthContext
    window.dispatchEvent(new CustomEvent('authDataCleared'));
    
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  } finally {
    // Reset the flag after a short delay
    setTimeout(() => {
      isLogoutInProgress = false;
    }, 1000);
  }
};
