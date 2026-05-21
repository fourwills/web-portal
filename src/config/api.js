import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && token !== 'dev-mock-token') {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['Auth-Token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isMock = localStorage.getItem('auth_token') === 'dev-mock-token';
    if (isMock) return Promise.reject(err);
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
