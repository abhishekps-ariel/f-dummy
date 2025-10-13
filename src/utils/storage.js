// Helper function to store auth data in localStorage
export const storeAuthData = (authData) => {
  const { token, refreshToken, user } = authData;
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

// Helper function to get auth data from localStorage
export const getAuthData = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  return { token, refreshToken, user };
};

// Helper function to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
