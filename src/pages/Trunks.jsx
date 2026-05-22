import { useMemo, useState } from 'react';
import { trunkService } from '../services/trunkService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import ErrorBanner from '../components/UI/ErrorBanner';
import { PageError, PageLoading } from '../components/UI/PageState';
import EgressIpEditorModal from '../components/Trunks/EgressIpEditorModal';
import { enrichTrunkRow } from '../utils/trunkHosts';
import { isMockMode } from '../utils/apiHelpers';

const HOST_COLS_BASE = [
  { key: 'trunk_name', label: 'Trunk' },
  { key: 'ip', label: 'Your IP' },
  { key: 'port', label: 'Port' },
  { key: 'addr_type', label: 'Type' },
];

function egressColumns(onEdit) {
  return [
    { key: 'trunk_name', label: 'Egress trunk' },
    { key: 'client_ip', label: 'Your registered IP' },
    { key: 'client_ports', label: 'Port' },
    { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
    {
      key: '_edit',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
        >
          Edit IP
        </button>
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
  const egress = useApi(() => trunkService.getEgressTrunks({ per_page: 50 }), []);

  const hostItems = (hosts.data?.items ?? []).filter((r) => r.direction === 'Egress');
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

  const handleSaveIps = async (resourceId, hostList) => {
    setSavingIps(true);
    setActionError('');
    setActionMsg('');
    try {
      await trunkService.updateEgressTrunkHosts(resourceId, hostList);
      setActionMsg('Your egress IP has been updated.');
      setEditTrunk(null);
      egress.refetch();
      hosts.refetch();
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Failed to update IP');
    } finally {
      setSavingIps(false);
    }
  };

  const hostCols = [
    ...HOST_COLS_BASE,
    {
      key: '_edit',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => openEdit(row)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
        >
          Edit IP
        </button>
      ),
    },
  ];

  const egressCols = egressColumns(openEdit);

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo trunk data.
        </p>
      )}

      <p className="text-sm text-slate-600">
        Your <strong>egress trunk IP</strong> is the address you send DID traffic from. Update it here when your public
        IP changes.
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
          { id: 'egress', label: 'Egress trunk' },
          { id: 'hosts', label: 'Registered IPs' },
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

      {tab === 'egress' && (
        egress.loading && !egress.data ? (
          <PageLoading label="Loading egress trunk…" />
        ) : egress.error ? (
          <PageError message={egress.error} onRetry={egress.refetch} />
        ) : (
          <>
            {egressRows.some((r) => r.client_ip === '—') && egressRows.length > 0 && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                No IP registered yet. Click <strong>Edit IP</strong> to add your public IP for DID traffic.
              </p>
            )}
            <DataTable
              columns={egressCols}
              rows={egressRows}
              emptyMessage="No egress trunk found on your account."
            />
          </>
        )
      )}

      {tab === 'hosts' && (
        hosts.loading && !hosts.data ? (
          <PageLoading label="Loading registered IPs…" />
        ) : hosts.error ? (
          <PageError message={hosts.error} onRetry={hosts.refetch} />
        ) : (
          <DataTable
            columns={hostCols}
            rows={hostItems}
            emptyMessage="No egress IP registered yet. Use Edit IP on the Egress trunk tab."
          />
        )
      )}
    </div>
  );
}
