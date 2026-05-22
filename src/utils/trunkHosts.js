/** Normalize host entries from trunk.ip, trunk.host, or /home/client/ip/list rows. */
export function extractTrunkHostEntries(trunk) {
  const raw = trunk?.ip ?? trunk?.host ?? [];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        return { ip: entry, port: 5060, addr_type: 'ip', fqdn: null };
      }
      return {
        ip: entry.ip ?? entry.host ?? null,
        port: entry.port ?? 5060,
        addr_type: entry.addr_type ?? 'ip',
        fqdn: entry.fqdn ?? null,
        resource_ip_id: entry.resource_ip_id ?? null,
        direction: entry.direction ?? null,
        trunk_type2: entry.trunk_type2 ?? trunk?.trunk_type2 ?? null,
      };
    })
    .filter((e) => e?.ip);
}

export function formatHostEndpoint(entry) {
  if (!entry?.ip) return '';
  const port = entry.port != null && entry.port !== '' ? `:${entry.port}` : '';
  const fqdn = entry.fqdn ? ` (${entry.fqdn})` : '';
  return `${entry.ip}${port}${fqdn}`;
}

export function formatHostList(entries) {
  const list = Array.isArray(entries) ? entries : extractTrunkHostEntries(entries);
  const formatted = list.map(formatHostEndpoint).filter(Boolean);
  return formatted.length ? formatted.join(', ') : '—';
}

export function enrichTrunkRow(trunk) {
  const hosts = extractTrunkHostEntries(trunk);
  return {
    ...trunk,
    client_ip: formatHostList(hosts),
    client_ip_count: hosts.length,
    client_ports: [...new Set(hosts.map((h) => h.port).filter((p) => p != null))].join(', ') || '—',
  };
}

/** Payload for PATCH /home/client/egress_trunk/{id} ip array. */
export function hostsToApiPayload(hosts) {
  return (hosts ?? [])
    .map((entry) => {
      const ip = String(entry.ip ?? '').trim();
      if (!ip) return null;
      const out = {
        ip,
        port: Number(entry.port) || 5060,
        addr_type: entry.addr_type ?? 'ip',
        fqdn: entry.fqdn || null,
      };
      if (entry.resource_ip_id != null) out.resource_ip_id = entry.resource_ip_id;
      if (entry.direction != null) out.direction = entry.direction;
      return out;
    })
    .filter(Boolean);
}

export function flattenTrunkHosts(trunks, direction) {
  const rows = [];
  for (const trunk of trunks ?? []) {
    const hosts = extractTrunkHostEntries(trunk);
    const trunkId = trunk.trunk_id ?? trunk.resource_id;
    const trunkName = trunk.trunk_name ?? trunk.ingress_name ?? trunk.egress_name ?? '—';
    if (!hosts.length) {
      rows.push({
        trunk_id: trunkId,
        trunk_name: trunkName,
        direction,
        ip: '—',
        port: '—',
        addr_type: '—',
        fqdn: '—',
        trunk_type2: trunk.trunk_type2 ?? '—',
      });
      continue;
    }
    for (const entry of hosts) {
      rows.push({
        trunk_id: trunkId,
        trunk_name: trunkName,
        direction,
        ip: entry.ip,
        port: entry.port ?? 5060,
        addr_type: entry.addr_type ?? 'ip',
        fqdn: entry.fqdn ?? '—',
        trunk_type2: entry.trunk_type2 ?? trunk.trunk_type2 ?? '—',
      });
    }
  }
  return rows;
}
