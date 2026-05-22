import { useState } from 'react';
import { ratesService } from '../services/ratesService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import DownloadButton from '../components/UI/DownloadButton';
import { PageError, PageLoading } from '../components/UI/PageState';
import { rowsToColumns } from '../utils/tableColumns';
import { isMockMode } from '../utils/apiHelpers';

const TABLE_PREF = ['id', 'name', 'rate_table_id', 'code', 'description', 'rate', 'interval', 'currency', 'effective_date'];

export default function Rates() {
  const [tab, setTab] = useState('tables');
  const tables = useApi(() => ratesService.getRateTables({ per_page: 100 }), []);
  const rates = useApi(() => ratesService.getRates({ per_page: 100 }), []);

  const active = tab === 'tables' ? tables : rates;
  const items = active.data?.items ?? [];
  const columns = rowsToColumns(items, TABLE_PREF);

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo rate data.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          {[
            { id: 'tables', label: 'Rate tables' },
            { id: 'rates', label: 'Rates' },
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
            tab === 'tables'
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
          columns={columns.length ? columns : [{ key: 'id', label: 'ID' }]}
          rows={items}
          emptyMessage={tab === 'tables' ? 'No rate tables found.' : 'No rates found.'}
        />
      )}
    </div>
  );
}
