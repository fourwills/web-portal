import api from '../config/api';
import { isMockMode, unwrapList } from '../utils/apiHelpers';
import { downloadApiCsv } from '../utils/csvDownload';
import { mockRateTables, mockRates } from './mockData';

export const ratesService = {
  getRateTables: async (params = {}) => {
    if (isMockMode()) return mockRateTables;
    const res = await api.get('/home/client/rate_table/list', { params });
    return unwrapList(res.data);
  },

  getRates: async (params = {}) => {
    if (isMockMode()) return mockRates;
    const res = await api.get('/home/client/rate/list', { params });
    return unwrapList(res.data);
  },

  downloadRateTablesCsv: (params = {}) =>
    downloadApiCsv('/home/client/rate_table/list', { per_page: 10000, ...params }, 'rate-tables.csv'),

  downloadRatesCsv: (params = {}) =>
    downloadApiCsv('/home/client/rate/list', { per_page: 10000, ...params }, 'rates.csv'),
};
