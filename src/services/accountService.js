import api from '../config/api';
import { isMockMode, unwrapPayload } from '../utils/apiHelpers';
import { mockClient } from './mockData';

export const accountService = {
  getProfile: async () => {
    if (isMockMode()) return mockClient;
    const res = await api.get('/home/client');
    return unwrapPayload(res.data);
  },

  updateProfile: async (data) => {
    if (isMockMode()) return { ...mockClient, ...data };
    const res = await api.patch('/home/client', data);
    return unwrapPayload(res.data);
  },

  createApiKey: async (body = {}) => {
    if (isMockMode()) {
      return { api_key: `mock_key_${Date.now()}`, label: body.label ?? 'default' };
    }
    const res = await api.post('/home/api_key/create', body);
    return unwrapPayload(res.data);
  },

  deleteApiKey: async (body = {}) => {
    if (isMockMode()) return { success: true };
    const res = await api.delete('/home/api_key', { data: body });
    return unwrapPayload(res.data);
  },
};
