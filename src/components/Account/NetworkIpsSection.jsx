import { getConfiguredPlatformIps } from '../../utils/platformIps';
import { networkService } from '../../services/networkService';
import { useApi } from '../../hooks/useApi';
import DataTable from '../UI/DataTable';
import { PageError, PageLoading } from '../UI/PageState';

const platformColumns = [
  { key: 'ip', label: 'IP address' },
  { key: 'port', label: 'Port' },
];

const defaultColumns = [
  { key: 'ip', label: 'IP address' },
  { key: 'port', label: 'Port' },
  { key: 'mask', label: 'Mask' },
  { key: 'product_id', label: 'Product ID' },
];

export default function NetworkIpsSection() {
  const platformIps = getConfiguredPlatformIps();
  const defaults = useApi(() => networkService.getDefaultIps({ per_page: 50 }), []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Our platform IPs</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configured by your provider (not loaded from the API). Update{' '}
          <code className="rounded bg-slate-100 px-1 text-xs">VITE_PLATFORM_IPS</code> when your server IP is ready.
        </p>
        <div className="mt-4">
          <DataTable
            columns={platformColumns}
            rows={platformIps}
            emptyMessage="No platform IPs configured. Set VITE_PLATFORM_IPS in environment (e.g. 1.1.1.1)."
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your default IPs</h2>
        <p className="mt-1 text-sm text-slate-500">Default IPs registered on your client account (from API).</p>
        {defaults.loading ? (
          <PageLoading label="Loading default IPs…" />
        ) : defaults.error ? (
          <PageError message={defaults.error} onRetry={defaults.refetch} />
        ) : (
          <div className="mt-4">
            <DataTable
              columns={defaultColumns}
              rows={defaults.data?.items ?? []}
              emptyMessage="No default IPs configured yet."
            />
          </div>
        )}
      </div>
    </div>
  );
}
