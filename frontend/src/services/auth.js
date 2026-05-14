import api, { clearAuthTokens, setAuthTokens } from './api';

export const login = async (credentials) => {
  const response = await api.post('/auth/login/', credentials);
  setAuthTokens(response.data);
  return response.data;
};

export const register = async (data) => {
  const response = await api.post('/auth/register/', data);
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get('/auth/me/');
  return response.data;
};

export const logout = () => {
  clearAuthTokens();
};
