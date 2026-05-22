import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { User, ArrowLeftRight, Receipt, Network, Table2, Phone } from 'lucide-react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { billingService } from '../services/billingService';
import StatCard from '../components/UI/StatCard';
import DataTable from '../components/UI/DataTable';
import { PageError, PageLoading } from '../components/UI/PageState';
import { formatDateTime, formatMoney, isMockMode } from '../utils/apiHelpers';

const cards = [
  { to: '/account', title: 'Account', description: 'Profile, API keys, and account settings', icon: User, color: 'bg-sky-50 text-sky-700' },
  { to: '/transactions', title: 'Transactions', description: 'Payments and transaction history', icon: ArrowLeftRight, color: 'bg-emerald-50 text-emerald-700' },
  { to: '/billing', title: 'Billing', description: 'Invoices, payments, PayPal/Stripe', icon: Receipt, color: 'bg-amber-50 text-amber-700' },
  { to: '/trunks', title: 'Trunks', description: 'Ingress, egress, routing, and registered IPs', icon: Network, color: 'bg-violet-50 text-violet-700' },
  { to: '/rates', title: 'Rates', description: 'Rate tables and CSV download', icon: Table2, color: 'bg-rose-50 text-rose-700' },
  { to: '/dids', title: 'DIDs', description: 'My numbers, search, and release', icon: Phone, color: 'bg-teal-50 text-teal-700' },
];

const paymentColumns = [
  { key: 'paid_on', label: 'Date', render: (r) => formatDateTime(r.paid_on) },
  { key: 'payment_type', label: 'Type' },
  { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
];

const invoiceColumns = [
  { key: 'invoice_time', label: 'Date', render: (r) => formatDateTime(r.invoice_time ?? r.created_at) },
  { key: 'invoice_number', label: 'Invoice', render: (r) => r.invoice_number ?? r.id ?? '—' },
  { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount ?? r.total) },
  { key: 'status', label: 'Status', render: (r) => r.status ?? r.invoice_status ?? '—' },
];

export default function Dashboard() {
  const [state, setState] = useState({ loading: true, error: null, client: null, finance: null, payments: [], invoices: [] });

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([
      accountService.getProfile(),
      billingService.getFinanceHistory(),
      transactionService.getPayments({ page: 0, per_page: 5 }),
      billingService.getInvoices({ page: 0, per_page: 5 }),
    ])
      .then(([client, finance, payments, invoices]) => {
        setState({
          loading: false,
          error: null,
          client,
          finance,
          payments: payments.items ?? [],
          invoices: invoices.items ?? [],
        });
      })
      .catch((err) => {
        setState({
          loading: false,
          error: err.response?.data?.error?.message ?? err.message ?? 'Failed to load dashboard',
          client: null,
          finance: null,
          payments: [],
          invoices: [],
        });
      });
  };

  useEffect(() => {
    load();
  }, []);

  if (state.loading) return <PageLoading label="Loading dashboard…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const clientName = state.client?.client_name ?? state.client?.name ?? 'Client';
  const status = state.client?.status ?? '—';
  const balance = state.finance?.balance ?? state.client?.balance;
  const currency = state.finance?.currency ?? state.client?.currency ?? 'USD';

  return (
    <div className="space-y-8">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Showing demo data. Set <code className="font-mono">VITE_DEV_MOCK_AUTH=false</code> and use real credentials for live API data.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Client" value={clientName} sub={`Status: ${status}`} />
        <StatCard label="Balance" value={formatMoney(balance, currency)} accent="emerald" />
        <StatCard label="Recent payments" value={String(state.payments.length)} sub="Last 5" accent="sky" />
        <StatCard label="Recent invoices" value={String(state.invoices.length)} sub="Last 5" accent="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ to, title, description, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md"
          >
            <div className={`mb-4 inline-flex rounded-lg p-3 ${color}`}>
              <Icon size={24} aria-hidden />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-sky-700">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent transactions</h2>
            <Link to="/transactions" className="text-sm font-medium text-sky-600 hover:text-sky-700">
              View all
            </Link>
          </div>
          <DataTable columns={paymentColumns} rows={state.payments} emptyMessage="No recent payments." />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent invoices</h2>
            <Link to="/billing" className="text-sm font-medium text-sky-600 hover:text-sky-700">
              View all
            </Link>
          </div>
          <DataTable columns={invoiceColumns} rows={state.invoices} emptyMessage="No recent invoices." />
        </section>
      </div>
    </div>
  );
}
