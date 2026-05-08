import api from './api';

export const login = async (credentials) => {
  const response = await api.post('/auth/login/', credentials);
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
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_refresh');
};
