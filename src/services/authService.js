import api from '../config/api';

const MOCK_ENABLED = import.meta.env.VITE_DEV_MOCK_AUTH === 'true';
const MOCK_USER = import.meta.env.VITE_TEST_EMAIL_OR_NAME || 'demo';
const MOCK_PASS = import.meta.env.VITE_TEST_PASSWORD || 'demo';

function extractToken(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (data.token) return data.token;
  if (data.payload?.token) return data.payload.token;
  if (data.auth_token) return data.auth_token;
  if (data.payload?.auth_token) return data.payload.auth_token;
  return null;
}

function extractUser(data, emailOrName) {
  const payload = data?.payload ?? data;
  return payload?.user ?? payload?.client ?? {
    email_or_name: emailOrName,
    displayName: emailOrName,
  };
}

export const authService = {
  login: async (emailOrName, password) => {
    if (MOCK_ENABLED && emailOrName === MOCK_USER && password === MOCK_PASS) {
      return {
        token: 'dev-mock-token',
        user: { email_or_name: emailOrName, displayName: 'Demo Client' },
      };
    }

    const res = await api.post('/auth', { email_or_name: emailOrName, password });
    const token = extractToken(res.data);
    const user = extractUser(res.data, emailOrName);
    return { token, user, raw: res.data };
  },

  logout: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    try {
      await api.post('/auth/check-token');
    } catch {
      /* session may already be cleared */
    }
  },

  checkToken: async () => {
    const res = await api.post('/auth/check-token');
    return { token: extractToken(res.data), user: extractUser(res.data), raw: res.data };
  },
};
