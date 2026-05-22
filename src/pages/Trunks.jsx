import { useState } from 'react';
import { trunkService } from '../services/trunkService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import { PageError, PageLoading } from '../components/UI/PageState';
import { rowsToColumns } from '../utils/tableColumns';
import { isMockMode } from '../utils/apiHelpers';

const HOST_COLS = [
  { key: 'trunk_name', label: 'Trunk' },
  { key: 'direction', label: 'Direction' },
  { key: 'ip', label: 'Host IP' },
  { key: 'port', label: 'Port' },
  { key: 'addr_type', label: 'Type' },
];

const ROUTING_PREF = ['trunk_name', 'tech_prefix', 'rate_table_name', 'product_name', 'code', 'trunk_id'];
const INGRESS_PREF = ['trunk_id', 'trunk_name', 'ingress_name', 'is_active', 'call_limit', 'cps_limit'];
const EGRESS_PREF = ['trunk_id', 'egress_name', 'is_active', 'call_limit', 'cps_limit'];

export default function Trunks() {
  const [tab, setTab] = useState('hosts');
  const hosts = useApi(() => trunkService.getClientRegisteredIps(), []);
  const routing = useApi(() => trunkService.getTrunkRouting(), []);
  const ingress = useApi(() => trunkService.getIngressTrunks({ per_page: 50 }), []);
  const egress = useApi(() => trunkService.getEgressTrunks({ per_page: 50 }), []);

  const hostItems = hosts.data?.items ?? [];
  const routingItems = routing.data?.items ?? [];
  const routingCols = rowsToColumns(routingItems, ROUTING_PREF);

  const trunkTab = tab === 'ingress' ? ingress : tab === 'egress' ? egress : null;
  const ingressItems = ingress.data?.items ?? [];
  const egressItems = egress.data?.items ?? [];

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo trunk data.
        </p>
      )}

      <p className="text-sm text-slate-600">
        Registered host IPs and rate tables match what your provider configures in the admin portal (trunk hosts and routing).
      </p>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {[
          { id: 'hosts', label: 'Registered IPs' },
          { id: 'routing', label: 'Routing & rates' },
          { id: 'ingress', label: 'Ingress trunks' },
          { id: 'egress', label: 'Egress trunks' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'border-b-2 px-4 py-2 text-sm font-medium transition',
              tab === id
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'hosts' && (
        hosts.loading && !hosts.data ? (
          <PageLoading label="Loading registered IPs…" />
        ) : hosts.error ? (
          <PageError message={hosts.error} onRetry={hosts.refetch} />
        ) : (
          <DataTable
            columns={HOST_COLS}
            rows={hostItems}
            emptyMessage="No host IPs registered on your trunks yet."
          />
        )
      )}

      {tab === 'routing' && (
        routing.loading && !routing.data ? (
          <PageLoading label="Loading trunk routing…" />
        ) : routing.error ? (
          <PageError message={routing.error} onRetry={routing.refetch} />
        ) : (
          <DataTable
            columns={routingCols.length ? routingCols : [{ key: 'trunk_name', label: 'Trunk' }]}
            rows={routingItems}
            emptyMessage="No routing / rate table assignments on ingress trunks."
          />
        )
      )}

      {(tab === 'ingress' || tab === 'egress') && (
        trunkTab.loading && !trunkTab.data ? (
          <PageLoading label="Loading trunks…" />
        ) : trunkTab.error ? (
          <PageError message={trunkTab.error} onRetry={trunkTab.refetch} />
        ) : tab === 'ingress' ? (
          <DataTable
            columns={rowsToColumns(ingressItems, INGRESS_PREF)}
            rows={ingressItems}
            emptyMessage="No ingress trunks found."
          />
        ) : (
          <DataTable
            columns={rowsToColumns(egressItems, EGRESS_PREF)}
            rows={egressItems}
            emptyMessage="No egress trunks found."
          />
        )
      )}
    </div>
  );
}
