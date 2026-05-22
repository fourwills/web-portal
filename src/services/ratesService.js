import api from '../config/api';
import { isMockMode, unwrapList } from '../utils/apiHelpers';
import { downloadApiCsv } from '../utils/csvDownload';
import { downloadRowsAsCsv } from '../utils/csvExport';
import { trunkService } from './trunkService';
import { mockRateTables, mockRates, mockTrunkRouting } from './mockData';

export const ratesService = {
  /** Primary: rates assigned via trunk routing (how your admin configures clients). */
  getTrunkRoutingRates: async () => {
    if (isMockMode()) return { items: mockTrunkRouting, total: mockTrunkRouting.length };
    return trunkService.getTrunkRouting();
  },

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

  downloadTrunkRoutingCsv: async () => {
    const { items } = await ratesService.getTrunkRoutingRates();
    if (!items?.length) throw new Error('No trunk routing / rate data to export.');
    downloadRowsAsCsv(
      items,
      `trunk-rates-${new Date().toISOString().slice(0, 10)}.csv`,
      ['trunk_name', 'tech_prefix', 'rate_table_name', 'product_name', 'code', 'trunk_id'],
    );
  },

  downloadRateTablesCsv: async (params = {}) => {
    try {
      await downloadApiCsv('/home/client/rate_table/list', { per_page: 10000, ...params }, 'rate-tables.csv');
    } catch {
      const { items } = await ratesService.getTrunkRoutingRates();
      if (!items?.length) throw new Error('Server CSV export failed and no trunk routing data is available.');
      await ratesService.downloadTrunkRoutingCsv();
    }
  },

  downloadRatesCsv: async (params = {}) => {
    try {
      await downloadApiCsv('/home/client/rate/list', { per_page: 10000, ...params }, 'rates.csv');
    } catch {
      await ratesService.downloadTrunkRoutingCsv();
    }
  },
};
