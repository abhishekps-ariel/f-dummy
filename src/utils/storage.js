export const storeAuthData = (authData) => {
  // Clear all existing data before storing new user data

  localStorage.clear();
  
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

export const clearAuthData = () => {
  // Clear authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Clear petition-related data
  localStorage.removeItem('petitionTabs');
  localStorage.removeItem('activePetitionTab');
  localStorage.removeItem('petitionDrafts');
  
  // Clear any other user-specific data
  localStorage.removeItem('resetEmail');
  
  localStorage.clear();
};

export const setImpersonationState = (isImpersonating, impersonatedUserName = '') => {
  if (isImpersonating) {
    localStorage.setItem('isImpersonating', 'true');
    if (impersonatedUserName) localStorage.setItem('impersonatedUserName', impersonatedUserName);
  } else {
    localStorage.removeItem('isImpersonating');
    localStorage.removeItem('impersonatedUserName');
  }
};

export const getImpersonationState = () => {
  const isImpersonating = localStorage.getItem('isImpersonating') === 'true';
  const impersonatedUserName = localStorage.getItem('impersonatedUserName') || '';
  return { isImpersonating, impersonatedUserName };
};

/**
 * Get user role from user object
 * Checks user.role first, then user.roles array, then returns null if neither exists
 * @param {Object} user - User object from storage
 * @returns {string|null} - User role or null if not found
 */
export const getUserRole = (user) => {
  if (!user) return null;
  
  // Check for single role field first
  if (user.role) {
    return user.role;
  }
  
  // Check for roles array
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0];
  }
  
  return null;
};

