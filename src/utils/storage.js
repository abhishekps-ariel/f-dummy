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

