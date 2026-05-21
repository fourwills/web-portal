import api from '../config/api';
import { isMockMode, unwrapList, unwrapPayload } from '../utils/apiHelpers';
import { mockFinance, mockInvoices } from './mockData';

export const billingService = {
  getFinanceHistory: async () => {
    if (isMockMode()) return mockFinance;
    const res = await api.get('/home/client/actual_finance_history');
    const payload = unwrapPayload(res.data);
    if (Array.isArray(payload)) return payload[0] ?? payload;
    return payload;
  },

  getInvoices: async (params = {}) => {
    if (isMockMode()) {
      const page = params.page ?? 0;
      const perPage = params.per_page ?? 10;
      const start = page * perPage;
      const items = mockInvoices.items.slice(start, start + perPage);
      return { items, total: mockInvoices.total, page, per_page: perPage };
    }
    const res = await api.get('/home/client/invoice/list', { params });
    return unwrapList(res.data);
  },

  getOrigInvoices: async (params = {}) => {
    if (isMockMode()) return { items: [], total: 0, page: 0, per_page: 0 };
    const res = await api.get('/home/client/orig_invoice/list', { params });
    return unwrapList(res.data);
  },
};
