import { useMemo, useState } from 'react';
import { didService, normalizeDidNumber } from '../services/didService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import ErrorBanner from '../components/UI/ErrorBanner';
import { PageError, PageLoading } from '../components/UI/PageState';
import { isMockMode } from '../utils/apiHelpers';

export default function DIDs() {
  const mine = useApi(() => didService.getMyDids({ per_page: 100 }), []);

  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [releasing, setReleasing] = useState(false);

  const mineItems = mine.data?.items ?? [];

  const handleReleaseConfirm = async () => {
    if (!releaseTarget) return;
    setReleasing(true);
    setActionError('');
    setActionMsg('');
    const display = releaseTarget.did ?? releaseTarget.number ?? normalizeDidNumber(releaseTarget);
    try {
      const result = await didService.releaseOrDisableDid(releaseTarget);
      setActionMsg(
        result.method === 'disable'
          ? `${display} has been removed from your account.`
          : `${display} has been released.`,
      );
      setReleaseTarget(null);
      mine.refetch();
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Release failed');
    } finally {
      setReleasing(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'did', label: 'Number', render: (r) => r.did ?? r.number ?? '—' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' },
      {
        key: 'created_at',
        label: 'Assigned',
        render: (r) => r.created_at ?? r.assigned_date ?? '—',
      },
      {
        key: '_release',
        label: 'Action',
        render: (row) => (
          <button
            type="button"
            onClick={() => setReleaseTarget(row)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Release
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo DID data.
        </p>
      )}

      <h2 className="text-lg font-semibold text-slate-900">My DIDs</h2>

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-600">
          Your assigned numbers. Use <strong>Release</strong> on any number you are no longer using.
        </p>
        <button
          type="button"
          onClick={() => {
            mine.refetch();
            setActionMsg('Refreshed.');
            setTimeout(() => setActionMsg(''), 2000);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <ErrorBanner message={actionError} />
      {actionMsg && <p className="text-sm text-emerald-700">{actionMsg}</p>}

      <ConfirmDialog
        open={Boolean(releaseTarget)}
        title="Release this number?"
        message={
          releaseTarget
            ? `Release ${releaseTarget.did ?? releaseTarget.number ?? 'this number'}? It will be removed from your account.`
            : ''
        }
        confirmLabel="Release"
        danger
        busy={releasing}
        onConfirm={handleReleaseConfirm}
        onCancel={() => !releasing && setReleaseTarget(null)}
      />

      {mine.loading && !mine.data ? (
        <PageLoading label="Loading your DIDs…" />
      ) : mine.error ? (
        <PageError message={mine.error} onRetry={mine.refetch} />
      ) : (
        <DataTable
          columns={columns}
          rows={mineItems}
          emptyMessage="No DIDs on your account."
        />
      )}
    </div>
  );
}
