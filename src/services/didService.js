import api from '../config/api';
import { isMockMode, unwrapList, unwrapPayload } from '../utils/apiHelpers';
import { mockDids, mockFreeDids } from './mockData';

export const didService = {
  getMyDids: async (params = {}) => {
    if (isMockMode()) return mockDids;
    const res = await api.get('/home/client/did/list', { params });
    return unwrapList(res.data);
  },

  getFreeDids: async (params = {}) => {
    if (isMockMode()) return mockFreeDids;
    const res = await api.get('/home/client/did/free/list', { params });
    return unwrapList(res.data);
  },

  searchLocal: async (params = {}) => {
    if (isMockMode()) return { items: mockFreeDids.items, total: mockFreeDids.total };
    const res = await api.get('/did_api/search_local', { params });
    const payload = unwrapPayload(res.data);
    if (Array.isArray(payload)) return { items: payload, total: payload.length };
    return unwrapList(res.data);
  },

  orderLocal: async (items) => {
    if (isMockMode()) return { success: true, items };
    const res = await api.post('/did_api/order_local', { items });
    return unwrapPayload(res.data);
  },
};
