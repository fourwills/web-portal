import api from '../config/api';
import { isMockMode, unwrapList } from '../utils/apiHelpers';
import { mockIngressTrunks, mockEgressTrunks } from './mockData';

export const trunkService = {
  getIngressTrunks: async (params = {}) => {
    if (isMockMode()) return mockIngressTrunks;
    const res = await api.get('/home/client/ingress_trunk/list', { params });
    return unwrapList(res.data);
  },

  getEgressTrunks: async (params = {}) => {
    if (isMockMode()) return mockEgressTrunks;
    const res = await api.get('/home/client/egress_trunk/list', { params });
    return unwrapList(res.data);
  },
};
