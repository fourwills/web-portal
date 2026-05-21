import { useState } from 'react';
import { Download } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import { PageError, PageLoading } from '../components/UI/PageState';
import { formatDateTime, formatMoney, isMockMode } from '../utils/apiHelpers';

const columns = [
  { key: 'paid_on', label: 'Date', render: (r) => formatDateTime(r.paid_on) },
  { key: 'client_payment_id', label: 'ID' },
  { key: 'payment_type', label: 'Type' },
  { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
];

function exportCsv(rows) {
  const header = ['Date', 'ID', 'Type', 'Amount'];
  const lines = rows.map((r) =>
    [formatDateTime(r.paid_on), r.client_payment_id, r.payment_type, r.amount]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Transactions() {
  const [page, setPage] = useState(0);
  const perPage = 15;

  const { data, loading, error, refetch } = useApi(
    () => transactionService.getPayments({ page, per_page: perPage }),
    [page],
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (loading && !data) return <PageLoading label="Loading transactions…" />;
  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo transaction data.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {total} transaction{total !== 1 ? 's' : ''} total
        </p>
        <button
          type="button"
          onClick={() => exportCsv(items)}
          disabled={!items.length}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <DataTable columns={columns} rows={items} />

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 0 || loading}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1 || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
