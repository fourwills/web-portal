import { useMemo, useState } from 'react';
import { trunkService } from '../services/trunkService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import { PageError, PageLoading } from '../components/UI/PageState';
import { rowsToColumns } from '../utils/tableColumns';
import { enrichTrunkRow } from '../utils/trunkHosts';
import { isMockMode } from '../utils/apiHelpers';

const HOST_COLS = [
  { key: 'trunk_name', label: 'Trunk' },
  { key: 'direction', label: 'Direction' },
  { key: 'ip', label: 'Your registered IP' },
  { key: 'port', label: 'Port' },
  { key: 'addr_type', label: 'Type' },
  { key: 'trunk_type2', label: 'Trunk type' },
];

const ROUTING_PREF = ['trunk_name', 'tech_prefix', 'rate_table_name', 'product_name', 'code', 'trunk_id'];

const INGRESS_COLS = [
  { key: 'trunk_name', label: 'Trunk name' },
  { key: 'client_ip', label: 'Your registered IP(s)' },
  { key: 'client_ports', label: 'Port(s)' },
  { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  { key: 'call_limit', label: 'Call limit' },
  { key: 'cps_limit', label: 'CPS limit' },
];

const EGRESS_COLS = [
  { key: 'trunk_name', label: 'Trunk name' },
  { key: 'client_ip', label: 'Your registered IP(s)' },
  { key: 'client_ports', label: 'Port(s)' },
  { key: 'trunk_type2', label: 'Trunk type' },
  { key: 'auth_type', label: 'Auth' },
  { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  { key: 'call_limit', label: 'Call limit' },
  { key: 'cps_limit', label: 'CPS limit' },
];

export default function Trunks() {
  const [tab, setTab] = useState('egress');
  const hosts = useApi(() => trunkService.getClientRegisteredIps(), []);
  const routing = useApi(() => trunkService.getTrunkRouting(), []);
  const ingress = useApi(() => trunkService.getIngressTrunks({ per_page: 50 }), []);
  const egress = useApi(() => trunkService.getEgressTrunks({ per_page: 50 }), []);

  const hostItems = hosts.data?.items ?? [];
  const routingItems = routing.data?.items ?? [];
  const routingCols = rowsToColumns(routingItems, ROUTING_PREF);

  const ingressRows = useMemo(
    () => (ingress.data?.items ?? []).map(enrichTrunkRow),
    [ingress.data],
  );
  const egressRows = useMemo(
    () => (egress.data?.items ?? []).map(enrichTrunkRow),
    [egress.data],
  );

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo trunk data.
        </p>
      )}

      <p className="text-sm text-slate-600">
        For DID origination, your provider registers <strong>your IP address</strong> on the egress trunk (authorized
        hosts). That IP is shown below — not the platform switch IP from Account.
      </p>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {[
          { id: 'egress', label: 'Egress trunks' },
          { id: 'hosts', label: 'Registered IPs' },
          { id: 'ingress', label: 'Ingress trunks' },
          { id: 'routing', label: 'Routing & rates' },
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
            emptyMessage="No host IPs registered on your egress trunk yet. Ask your provider to add your IP under the egress trunk for DID traffic."
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

      {tab === 'ingress' && (
        ingress.loading && !ingress.data ? (
          <PageLoading label="Loading ingress trunks…" />
        ) : ingress.error ? (
          <PageError message={ingress.error} onRetry={ingress.refetch} />
        ) : (
          <DataTable
            columns={INGRESS_COLS}
            rows={ingressRows}
            emptyMessage="No ingress trunks found."
          />
        )
      )}

      {tab === 'egress' && (
        egress.loading && !egress.data ? (
          <PageLoading label="Loading egress trunks…" />
        ) : egress.error ? (
          <PageError message={egress.error} onRetry={egress.refetch} />
        ) : (
          <>
            {egressRows.some((r) => r.client_ip === '—') && egressRows.length > 0 && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                This egress trunk has no registered IP yet. Your provider must add your public IP as an authorized host
                before DID traffic can work.
              </p>
            )}
            <DataTable
              columns={EGRESS_COLS}
              rows={egressRows}
              emptyMessage="No egress trunks found."
            />
          </>
        )
      )}
    </div>
  );
}
