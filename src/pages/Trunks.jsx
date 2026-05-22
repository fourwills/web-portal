import { useMemo, useState } from 'react';
import { trunkService } from '../services/trunkService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import ErrorBanner from '../components/UI/ErrorBanner';
import { PageError, PageLoading } from '../components/UI/PageState';
import EgressIpEditorModal from '../components/Trunks/EgressIpEditorModal';
import { rowsToColumns } from '../utils/tableColumns';
import { enrichTrunkRow } from '../utils/trunkHosts';
import { isMockMode } from '../utils/apiHelpers';

const ROUTING_PREF = ['trunk_name', 'tech_prefix', 'rate_table_name', 'product_name', 'code', 'trunk_id'];

const INGRESS_COLS = [
  { key: 'trunk_name', label: 'Trunk name' },
  { key: 'client_ip', label: 'Your registered IP(s)' },
  { key: 'client_ports', label: 'Port(s)' },
  { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  { key: 'call_limit', label: 'Call limit' },
  { key: 'cps_limit', label: 'CPS limit' },
];

function egressColumns(onEdit) {
  return [
    { key: 'trunk_name', label: 'Trunk name' },
    { key: 'client_ip', label: 'Your registered IP(s)' },
    { key: 'client_ports', label: 'Port(s)' },
    { key: 'trunk_type2', label: 'Trunk type' },
    { key: 'auth_type', label: 'Auth' },
    { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
    {
      key: '_edit',
      label: '',
      render: (row) => (
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
        >
          Edit IPs
        </button>
      ),
    },
  ];
}

function hostColumns(onEdit) {
  return [
    { key: 'trunk_name', label: 'Trunk' },
    { key: 'direction', label: 'Direction' },
    { key: 'ip', label: 'Your registered IP' },
    { key: 'port', label: 'Port' },
    { key: 'addr_type', label: 'Type' },
    { key: 'trunk_type2', label: 'Trunk type' },
    {
      key: '_edit',
      label: '',
      render: (row) =>
        row.direction === 'Egress' ? (
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Edit
          </button>
        ) : (
          '—'
        ),
    },
  ];
}

export default function Trunks() {
  const [tab, setTab] = useState('egress');
  const [editTrunk, setEditTrunk] = useState(null);
  const [savingIps, setSavingIps] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

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

  const egressById = useMemo(() => {
    const map = new Map();
    for (const row of egress.data?.items ?? []) {
      const id = row.trunk_id ?? row.resource_id;
      if (id != null) map.set(String(id), row);
    }
    return map;
  }, [egress.data]);

  const openEdit = async (rowOrHost) => {
    setActionError('');
    const trunkId = rowOrHost.trunk_id ?? rowOrHost.resource_id;
    if (!trunkId) {
      setActionError('Cannot edit: trunk id missing.');
      return;
    }
    try {
      const trunk = await trunkService.getEgressTrunk(trunkId);
      setEditTrunk(trunk);
    } catch (err) {
      const fallback = egressById.get(String(trunkId));
      if (fallback) setEditTrunk(fallback);
      else setActionError(err.response?.data?.error?.message ?? err.message ?? 'Could not load trunk');
    }
  };

  const handleSaveIps = async (resourceId, hosts) => {
    setSavingIps(true);
    setActionError('');
    setActionMsg('');
    try {
      await trunkService.updateEgressTrunkHosts(resourceId, hosts);
      setActionMsg('Registered IPs updated.');
      setEditTrunk(null);
      egress.refetch();
      hosts.refetch();
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Failed to update IPs');
    } finally {
      setSavingIps(false);
    }
  };

  const egressCols = egressColumns(openEdit);
  const hostCols = hostColumns(openEdit);

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo trunk data.
        </p>
      )}

      <p className="text-sm text-slate-600">
        For DID origination, register <strong>your IP address</strong> on the egress trunk. Use{' '}
        <strong>Edit IPs</strong> to update authorized hosts from this portal.
      </p>

      <ErrorBanner message={actionError} />
      {actionMsg && <p className="text-sm text-emerald-700">{actionMsg}</p>}

      <EgressIpEditorModal
        open={Boolean(editTrunk)}
        trunk={editTrunk}
        busy={savingIps}
        onSave={handleSaveIps}
        onClose={() => !savingIps && setEditTrunk(null)}
      />

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
            columns={hostCols}
            rows={hostItems}
            emptyMessage="No host IPs registered on your egress trunk yet. Use Edit IPs on the egress trunk tab to add your public IP."
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
                No registered IP on this egress trunk yet. Click <strong>Edit IPs</strong> to add your public IP for
                DID traffic.
              </p>
            )}
            <DataTable
              columns={egressCols}
              rows={egressRows}
              emptyMessage="No egress trunks found."
            />
          </>
        )
      )}
    </div>
  );
}
