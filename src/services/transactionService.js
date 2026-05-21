import api from '../config/api';
import { isMockMode, unwrapList } from '../utils/apiHelpers';
import { mockPayments } from './mockData';

export const transactionService = {
  getPayments: async (params = {}) => {
    if (isMockMode()) {
      const page = params.page ?? 0;
      const perPage = params.per_page ?? 10;
      const start = page * perPage;
      const items = mockPayments.items.slice(start, start + perPage);
      return { items, total: mockPayments.total, page, per_page: perPage };
    }
    const res = await api.get('/home/client/payments', {
      params: { order_by: 'paid_on', order_dir: 'desc', ...params },
    });
    return unwrapList(res.data);
  },

  getGatewayPayments: async (params = {}) => {
    if (isMockMode()) return { items: [], total: 0, page: 0, per_page: 0 };
    const res = await api.get('/home/client/gateway_payments', { params });
    return unwrapList(res.data);
  },
};
