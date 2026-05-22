import api from '../config/api';
import { isMockMode, unwrapList, unwrapPayload } from '../utils/apiHelpers';
import { flattenTrunkHosts, hostsToApiPayload } from '../utils/trunkHosts';
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

  getEgressTrunk: async (resourceId) => {
    if (isMockMode()) {
      const item = mockEgressTrunks.items.find(
        (t) => String(t.resource_id) === String(resourceId) || String(t.trunk_id) === String(resourceId),
      );
      return item ?? mockEgressTrunks.items[0];
    }
    const res = await api.get(`/home/client/egress_trunk/${resourceId}`);
    return unwrapPayload(res.data);
  },

  /** Update authorized hosts on egress trunk (client self-service). */
  updateEgressTrunkHosts: async (resourceId, hosts) => {
    if (isMockMode()) return { success: true };
    const ip = hostsToApiPayload(hosts);
    const res = await api.patch(`/home/client/egress_trunk/${resourceId}`, { ip });
    return unwrapPayload(res.data) ?? res.data;
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
