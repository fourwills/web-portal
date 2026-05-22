import api from '../config/api';
import { isMockMode, unwrapList } from '../utils/apiHelpers';
import {
  mockClientRegisteredIps,
  mockEgressTrunks,
  mockIngressTrunks,
  mockTrunkRouting,
} from './mockData';

function flattenTrunkHosts(trunks, direction) {
  const rows = [];
  for (const trunk of trunks ?? []) {
    const ips = trunk.ip ?? trunk.host ?? [];
    const list = Array.isArray(ips) ? ips : [];
    for (const entry of list) {
      rows.push({
        trunk_id: trunk.trunk_id ?? trunk.resource_id,
        trunk_name: trunk.trunk_name ?? trunk.ingress_name ?? trunk.egress_name ?? '—',
        direction,
        ip: entry.ip ?? '—',
        port: entry.port ?? 5060,
        addr_type: entry.addr_type ?? 'ip',
        fqdn: entry.fqdn ?? '—',
      });
    }
  }
  return rows;
}

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

  getTrunkPrefixes: async (trunkId) => {
    if (isMockMode()) return mockTrunkRouting;
    const res = await api.get(`/home/client/trunk/${trunkId}/prefix/list`, {
      params: { per_page: 100 },
    });
    return unwrapList(res.data);
  },

  /** Host IPs registered on client trunks (matches admin “Add Host”). */
  getClientRegisteredIps: async () => {
    if (isMockMode()) return { items: mockClientRegisteredIps, total: mockClientRegisteredIps.length };

    const [ingress, egress] = await Promise.all([
      trunkService.getIngressTrunks({ per_page: 100 }),
      trunkService.getEgressTrunks({ per_page: 100 }),
    ]);

    const items = [
      ...flattenTrunkHosts(ingress.items, 'Ingress'),
      ...flattenTrunkHosts(egress.items, 'Egress'),
    ];
    return { items, total: items.length, page: 0, per_page: items.length };
  },

  /** Rate tables / tech prefix / route plan per trunk (matches admin routing table). */
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
