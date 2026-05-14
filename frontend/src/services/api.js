import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const notifyLoggedOut = () => {
  window.dispatchEvent(new Event('auth:logout'));
};

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login/') ||
  url.includes('/auth/register/') ||
  url.includes('/auth/token/refresh/');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

export const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearAuthTokens();
    notifyLoggedOut();
    throw new Error('No refresh token available.');
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/token/refresh/`, { refresh })
      .then((response) => {
        if (!response.data?.access) {
          clearAuthTokens();
          notifyLoggedOut();
          throw new Error('Refresh response did not include an access token.');
        }
        setAuthTokens(response.data);
        return response.data.access;
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          clearAuthTokens();
          notifyLoggedOut();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const access = await refreshAccessToken();
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${access}`,
      };
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

const withAuthorization = (headers = {}, token = getAccessToken()) => (
  token ? { ...headers, Authorization: `Bearer ${token}` } : headers
);

const fetchWithAuthRefresh = async (url, options, retry = true) => {
  const response = await fetch(url, {
    ...options,
    headers: withAuthorization(options.headers),
  });

  if (response.status === 401 && retry && getRefreshToken()) {
    const access = await refreshAccessToken();
    return fetchWithAuthRefresh(
      url,
      {
        ...options,
        headers: withAuthorization(options.headers, access),
      },
      false,
    );
  }

  return response;
};

export async function uploadWithValidationStream(file, onEvent) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAuthRefresh(`${API_BASE_URL}/uploads/stream/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Streaming upload failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Streaming upload response did not include a readable body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalEvent = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const event = JSON.parse(trimmed);
      finalEvent = event;
      onEvent?.(event);
      if (event.type === 'error') {
        throw new Error(event.detail || event.message || 'Streaming validation failed.');
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    const event = JSON.parse(tail);
    finalEvent = event;
    onEvent?.(event);
  }

  return finalEvent;
}

export default api;
