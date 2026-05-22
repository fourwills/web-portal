import { useState } from 'react';
import { ratesService } from '../services/ratesService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import DownloadButton from '../components/UI/DownloadButton';
import { PageError, PageLoading } from '../components/UI/PageState';
import { rowsToColumns } from '../utils/tableColumns';
import { isMockMode } from '../utils/apiHelpers';

const ROUTING_PREF = ['trunk_name', 'tech_prefix', 'rate_table_name', 'product_name', 'code', 'trunk_id'];
const TABLE_PREF = ['id', 'name', 'rate_table_id', 'currency', 'effective_date'];
const RATE_PREF = ['code', 'description', 'rate', 'interval', 'currency'];

export default function Rates() {
  const [tab, setTab] = useState('routing');
  const routing = useApi(() => ratesService.getTrunkRoutingRates(), []);
  const tables = useApi(() => ratesService.getRateTables({ per_page: 100 }), []);
  const rates = useApi(() => ratesService.getRates({ per_page: 100 }), []);

  const active =
    tab === 'routing' ? routing : tab === 'tables' ? tables : rates;
  const items = active.data?.items ?? [];
  const pref =
    tab === 'routing' ? ROUTING_PREF : tab === 'tables' ? TABLE_PREF : RATE_PREF;
  const columns = rowsToColumns(items, pref);

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo rate data.
        </p>
      )}

      <p className="text-sm text-slate-600">
        Your assigned rate tables are shown under trunk routing (same as the provider admin). Global rate lists may be empty until shared with your account.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'routing', label: 'My rate tables (trunk routing)' },
            { id: 'tables', label: 'All rate tables' },
            { id: 'rates', label: 'Rate details' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                'rounded-lg px-4 py-2 text-sm font-medium transition',
                tab === id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        <DownloadButton
          label="Download CSV"
          disabled={isMockMode()}
          onDownload={() =>
            tab === 'routing'
              ? ratesService.downloadTrunkRoutingCsv()
              : tab === 'tables'
                ? ratesService.downloadRateTablesCsv()
                : ratesService.downloadRatesCsv()
          }
        />
      </div>

      {active.loading && !active.data ? (
        <PageLoading label="Loading rates…" />
      ) : active.error ? (
        <PageError message={active.error} onRetry={active.refetch} />
      ) : (
        <DataTable
          columns={columns.length ? columns : [{ key: 'trunk_name', label: 'Trunk' }]}
          rows={items}
          emptyMessage={
            tab === 'routing'
              ? 'No rate tables assigned on your trunks.'
              : tab === 'tables'
                ? 'No rate tables in the global list.'
                : 'No rate rows in the global list.'
          }
        />
      )}
    </div>
  );
}
