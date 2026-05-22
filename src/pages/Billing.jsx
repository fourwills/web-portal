import { useState } from 'react';
import { billingService } from '../services/billingService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import StatCard from '../components/UI/StatCard';
import { PageError, PageLoading } from '../components/UI/PageState';
import { formatDateTime, formatMoney, isMockMode } from '../utils/apiHelpers';
import PaymentSection from '../components/Billing/PaymentSection';

function StatusBadge({ status }) {
  const s = String(status ?? '').toLowerCase();
  const styles = {
    paid: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    overdue: 'bg-red-100 text-red-800',
  };
  const cls = styles[s] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status ?? '—'}
    </span>
  );
}

const columns = [
  { key: 'invoice_time', label: 'Date', render: (r) => formatDateTime(r.invoice_time ?? r.created_at) },
  { key: 'invoice_number', label: 'Invoice #', render: (r) => r.invoice_number ?? r.id ?? '—' },
  { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount ?? r.total) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status ?? r.invoice_status} /> },
];

export default function Billing() {
  const [page, setPage] = useState(0);
  const perPage = 15;

  const finance = useApi(() => billingService.getFinanceHistory(), []);
  const invoices = useApi(
    () => billingService.getInvoices({ page, per_page: perPage }),
    [page],
  );

  if (finance.loading && invoices.loading && !invoices.data) {
    return <PageLoading label="Loading billing…" />;
  }

  const err = finance.error ?? invoices.error;
  if (err && !invoices.data) {
    return <PageError message={err} onRetry={() => { finance.refetch(); invoices.refetch(); }} />;
  }

  const balance = finance.data?.balance;
  const currency = finance.data?.currency ?? 'USD';
  const items = invoices.data?.items ?? [];
  const total = invoices.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo billing data.
        </p>
      )}

      <PaymentSection />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Current balance" value={formatMoney(balance, currency)} accent="emerald" />
        {finance.data?.credit != null && (
          <StatCard label="Credit limit" value={formatMoney(finance.data.credit, currency)} accent="sky" />
        )}
        <StatCard label="Invoices" value={String(total)} sub="Total on account" accent="amber" />
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Invoices</h2>
        {invoices.loading && !items.length ? (
          <PageLoading label="Loading invoices…" />
        ) : (
          <>
            <DataTable columns={columns} rows={items} emptyMessage="No invoices found." />
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 0 || invoices.loading}
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
                disabled={page >= totalPages - 1 || invoices.loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
