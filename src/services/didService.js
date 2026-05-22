import api from '../config/api';
import { isMockMode, unwrapList, unwrapPayload } from '../utils/apiHelpers';
import { mockDids, mockFreeDids } from './mockData';

const PLACEHOLDER_PATTERN = /^x+$/i;

function normalizeDidNumber(row) {
  const raw = row?.number ?? row?.did ?? '';
  return String(raw).replace(/\D/g, '');
}

function cleanLocalSearchParams(params = {}) {
  const out = {
    page: params.page ?? 0,
    per_page: params.per_page ?? 50,
  };
  if (params.state?.trim()) out.state = params.state.trim().toUpperCase();
  if (params.npa?.trim()) out.npa = params.npa.trim();
  if (params.lata?.trim()) out.lata = params.lata.trim();
  if (params.country?.trim()) out.country = params.country.trim();
  const patternRaw = params.pattern?.trim() ?? '';
  const digits = patternRaw.replace(/\D/g, '');
  if (digits.length === 10 && !PLACEHOLDER_PATTERN.test(patternRaw)) {
    out.pattern = digits;
  }
  if (params.is_sms != null) out.is_sms = params.is_sms;
  return out;
}

function buildTollFreePattern(prefix, suffix) {
  const pre = String(prefix ?? '1800').replace(/\D/g, '');
  let suf = String(suffix ?? '').replace(/\D/g, '');
  const pad = 'xxxxxxx';
  if (pre.length + suf.length < 10) {
    suf = (suf + pad).slice(0, Math.max(0, 10 - pre.length));
  }
  return pre + suf;
}

export const didService = {
  getMyDids: async (params = {}) => {
    if (isMockMode()) return mockDids;
    const res = await api.get('/home/client/did/list', {
      params: { per_page: 50, page: 0, order_by: 'assigned_date', order_dir: 'desc', ...params },
    });
    return unwrapList(res.data);
  },

  /** Classic portal: ListGetter clientFreeDids with end_date_isnull=true, per_page=999 */
  getFreeDids: async (params = {}) => {
    if (isMockMode()) return mockFreeDids;
    const res = await api.get('/home/client/did/free/list', {
      params: {
        per_page: 999,
        page: 0,
        end_date_isnull: true,
        ...params,
      },
    });
    return unwrapList(res.data);
  },

  getBillingRules: async (params = {}) => {
    if (isMockMode()) return { items: [{ id: 1, name: 'Standard DID' }], total: 1 };
    const res = await api.get('/home/client/did/billing_rule/list', {
      params: { per_page: 100, page: 0, ...params },
    });
    return unwrapList(res.data);
  },

  getCoverageLocal: async (params = {}) => {
    if (isMockMode()) return { items: [{ state: 'CT', tn_count: 10 }], total: 1 };
    const res = await api.get('/did_api/coverage_local', { params });
    return unwrapList(res.data);
  },

  getCoverageTollFree: async (params = {}) => {
    if (isMockMode()) return { items: [], total: 0 };
    const res = await api.get('/did_api/coverage_toll_free', { params });
    return unwrapList(res.data);
  },

  searchLocal: async (params = {}) => {
    if (isMockMode()) return { items: mockFreeDids.items, total: mockFreeDids.total };
    const res = await api.get('/did_api/search_local', { params: cleanLocalSearchParams(params) });
    return unwrapList(res.data);
  },

  searchTollFree: async ({ prefix, suffix, page = 0, per_page = 50 } = {}) => {
    if (isMockMode()) return { items: [], total: 0 };
    const pattern = buildTollFreePattern(prefix, suffix);
    const res = await api.get('/did_api/search_toll_free', {
      params: { pattern, page, per_page },
    });
    return unwrapList(res.data);
  },

  /** Classic buy_did: POST order_local with items [{ number }] only */
  orderLocal: async (numbers) => {
    if (isMockMode()) return { success: true };
    const items = numbers.map((n) => ({ number: normalizeDidNumber({ number: n }) }));
    const res = await api.post('/did_api/order_local', { items });
    return unwrapPayload(res.data) ?? res.data;
  },

  orderTollFree: async (numbers) => {
    if (isMockMode()) return { success: true };
    const items = numbers.map((n) => ({ number: normalizeDidNumber({ number: n }) }));
    const res = await api.post('/did_api/order_toll_free', { items });
    return unwrapPayload(res.data) ?? res.data;
  },

  /** Release DID from account — POST /did_api/release */
  releaseDid: async (row) => {
    if (isMockMode()) return { success: true };
    const number = normalizeDidNumber(row);
    const res = await api.post('/did_api/release', {
      items: [{ number }],
    });
    return unwrapPayload(res.data) ?? res.data;
  },

  /** Fallback when release API fails on some accounts */
  disableDid: async (row) => {
    if (isMockMode()) return { success: true };
    const id = row.id ?? row.did_id;
    if (!id) throw new Error('Cannot disable: missing DID id.');
    const res = await api.patch(`/home/client/did/${id}/disable`);
    return unwrapPayload(res.data) ?? res.data;
  },

  /**
   * Release, then disable if release fails (e.g. go2dial server config).
   * Returns { method: 'release' | 'disable' }.
   */
  releaseOrDisableDid: async (row) => {
    if (isMockMode()) return { success: true, method: 'release' };
    try {
      await didService.releaseDid(row);
      return { success: true, method: 'release' };
    } catch (releaseErr) {
      if (!row.id && !row.did_id) throw releaseErr;
      try {
        await didService.disableDid(row);
        return {
          success: true,
          method: 'disable',
          releaseError: releaseErr.response?.data?.error?.message ?? releaseErr.message,
        };
      } catch {
        throw releaseErr;
      }
    }
  },
};

export { normalizeDidNumber };
