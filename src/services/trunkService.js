import api from '../config/api';
import { isMockMode, unwrapList } from '../utils/apiHelpers';
import { flattenTrunkHosts } from '../utils/trunkHosts';
import {
  mockClientRegisteredIps,
  mockEgressTrunks,
  mockIngressTrunks,
  mockTrunkRouting,
} from './mockData';

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

  /** All resource IPs registered on the client account (egress hosts for DID). */
  getClientIpList: async (params = {}) => {
    if (isMockMode()) {
      return {
        items: mockClientRegisteredIps.map((r) => ({
          ip: r.ip,
          port: r.port,
          addr_type: r.addr_type,
          resource_id: r.trunk_id,
        })),
        total: mockClientRegisteredIps.length,
      };
    }
    const res = await api.get('/home/client/ip/list', { params: { per_page: 100, page: 0, ...params } });
    return unwrapList(res.data);
  },

  getTrunkPrefixes: async (trunkId) => {
    if (isMockMode()) return mockTrunkRouting;
    const res = await api.get(`/home/client/trunk/${trunkId}/prefix/list`, {
      params: { per_page: 100 },
    });
    return unwrapList(res.data);
  },

  /** Host IPs registered on client trunks (ingress + egress “Add Host” in admin). */
  getClientRegisteredIps: async () => {
    if (isMockMode()) return { items: mockClientRegisteredIps, total: mockClientRegisteredIps.length };

    const [ingress, egress, ipList] = await Promise.all([
      trunkService.getIngressTrunks({ per_page: 100 }),
      trunkService.getEgressTrunks({ per_page: 100 }),
      trunkService.getClientIpList().catch(() => ({ items: [] })),
    ]);

    const fromTrunks = [
      ...flattenTrunkHosts(ingress.items, 'Ingress'),
      ...flattenTrunkHosts(egress.items, 'Egress'),
    ];

    if (fromTrunks.length) {
      return { items: fromTrunks, total: fromTrunks.length, page: 0, per_page: fromTrunks.length };
    }

    const fromIpList = (ipList.items ?? []).map((row) => ({
      trunk_id: row.resource_id,
      trunk_name: row.trunk_name ?? '—',
      direction: 'Egress',
      ip: row.ip ?? '—',
      port: row.port ?? 5060,
      addr_type: row.addr_type ?? 'ip',
      fqdn: row.fqdn ?? '—',
      trunk_type2: row.trunk_type2 ?? '—',
    }));

    return { items: fromIpList, total: fromIpList.length, page: 0, per_page: fromIpList.length };
  },

  getTrunkRouting: async () => {
    if (isMockMode()) return { items: mockTrunkRouting, total: mockTrunkRouting.length };

    const ingress = await trunkService.getIngressTrunks({ per_page: 100 });
    const all = [];

    for (const trunk of ingress.items ?? []) {
      const trunkId = trunk.trunk_id ?? trunk.resource_id;
      if (!trunkId) continue;
      try {
        const prefixes = await trunkService.getTrunkPrefixes(trunkId);
        for (const row of prefixes.items ?? []) {
          all.push({
            ...row,
            trunk_id: trunkId,
            trunk_name: row.trunk_name ?? trunk.trunk_name ?? '—',
          });
        }
      } catch {
        /* skip trunk if prefix list forbidden */
      }
    }

    return { items: all, total: all.length, page: 0, per_page: all.length };
  },
};
