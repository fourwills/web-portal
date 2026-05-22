import axios from 'axios';

function normalizeBaseUrl(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error(
      'VITE_API_BASE_URL is missing. Set it in .env (local) or Vercel Environment Variables, then rebuild.',
    );
  }
  let url = raw.trim().replace(/\/+$/, '');
  // Common mistake: base URL ending with /auth — login path must be POST /auth not /auth/login
  if (url.endsWith('/auth')) {
    url = url.slice(0, -'/auth'.length);
  }
  return url;
}

export const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && token !== 'dev-mock-token') {
    config.headers['X-Auth-Token'] = token;
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
