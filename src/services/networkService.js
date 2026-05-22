import api from '../config/api';
import { isMockMode, unwrapList } from '../utils/apiHelpers';

const mockUniqueIps = {
  items: [{ ip: '88.99.103.106', port: 5060 }],
  total: 1,
  page: 0,
  per_page: 10,
};

const mockDefaultIps = {
  items: [{ id: 1, ip: '203.0.113.10', port: 5060, mask: 32 }],
  total: 1,
  page: 0,
  per_page: 10,
};

export const networkService = {
  /** Provider/platform IPs (our side — where clients send traffic) */
  getUniqueIps: async (params = {}) => {
    if (isMockMode()) return mockUniqueIps;
    const res = await api.get('/home/client/unique_ip/list', { params });
    return unwrapList(res.data);
  },

  /** Client default IPs */
  getDefaultIps: async (params = {}) => {
    if (isMockMode()) return mockDefaultIps;
    const res = await api.get('/home/client/default_ip/list', { params });
    return unwrapList(res.data);
  },

  /** Trunk/resource IPs (may require extra permission on some accounts) */
  getResourceIps: async (params = {}) => {
    if (isMockMode()) return { items: [], total: 0, page: 0, per_page: 0 };
    const res = await api.get('/home/client/ip/list', { params });
    return unwrapList(res.data);
  },
};
