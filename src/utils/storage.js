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

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
