import { useRef, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { useApi } from '../../hooks/useApi';
import DataTable from '../UI/DataTable';
import ErrorBanner from '../UI/ErrorBanner';
import { PageLoading } from '../UI/PageState';
import { formatDateTime, formatMoney } from '../../utils/apiHelpers';

const gatewayColumns = [
  { key: 'paid_on', label: 'Date', render: (r) => formatDateTime(r.paid_on ?? r.entered_on) },
  { key: 'type', label: 'Gateway', render: (r) => r.type ?? '—' },
  { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
  { key: 'status', label: 'Status' },
];

function loadPayPalScript(clientId) {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function PaymentSection() {
  const configQuery = useApi(() => paymentService.getPublicConfig(), []);
  const profileQuery = useApi(() => accountService.getProfile(), []);
  const gatewayQuery = useApi(
    () => transactionService.getGatewayPayments({ page: 0, per_page: 10 }),
    [],
  );

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalRef = useRef(null);

  const config = configQuery.data;
  const profile = profileQuery.data;
  const hasPaypal = Boolean(config?.paypal_account);
  const hasStripe = Boolean(config?.stripe_publisher_key?.trim());
  const parsedAmount = parseFloat(amount);

  const startPayPal = async () => {
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid amount first.');
      return;
    }
    setError('');
    setMessage('');
    setPaypalReady(false);
    if (paypalRef.current) paypalRef.current.innerHTML = '';

    try {
      const paypal = await loadPayPalScript(config.paypal_account);
      setPaypalReady(true);
      await paypal.Buttons({
        createOrder: (_data, actions) =>
          actions.order.create({
            purchase_units: [{ amount: { value: parsedAmount.toFixed(2), currency_code: 'USD' } }],
          }),
        onApprove: async (data) => {
          setPaying(true);
          try {
            await paymentService.createGatewayPayment({
              amount: parsedAmount,
              type: 'paypal',
              status: 'success',
              paypal_transaction_id: data.orderID,
              client_name: profile?.company_name ?? profile?.client_name,
            });
            setMessage('PayPal payment recorded successfully.');
            gatewayQuery.refetch();
          } catch (err) {
            setError(err.response?.data?.error?.message ?? err.message ?? 'Failed to record payment');
          } finally {
            setPaying(false);
          }
        },
        onError: (err) => setError(err?.message ?? 'PayPal error'),
      }).render(paypalRef.current);
    } catch {
      setError('Could not load PayPal. Check ad blockers or try again.');
    }
  };

  const handleStripePay = async () => {
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setPaying(true);
    setError('');
    setMessage('');
    try {
      await paymentService.createGatewayPayment({
        amount: parsedAmount,
        type: 'stripe',
        status: 'initial',
        client_name: profile?.company_name ?? profile?.client_name,
      });
      setMessage('Stripe payment initiated. Complete checkout if prompted.');
      gatewayQuery.refetch();
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Stripe payment failed';
      setError(
        err.response?.status === 403
          ? `${msg} — ask your provider to enable client payment permissions.`
          : msg,
      );
    } finally {
      setPaying(false);
    }
  };

  if (configQuery.loading) return <PageLoading label="Loading payment options…" />;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Make a payment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pay by PayPal or Stripe when enabled on your account. Payments are recorded via the DNL API gateway.
        </p>

        {!hasPaypal && !hasStripe && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No online payment gateways are configured yet. Your provider must enable PayPal and/or Stripe in system payment settings.
          </p>
        )}

        {(hasPaypal || hasStripe) && (
          <div className="mt-4 max-w-xs">
            <label htmlFor="pay-amount" className="mb-1 block text-sm font-medium text-slate-700">
              Amount (USD)
            </label>
            <input
              id="pay-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="0.00"
            />
          </div>
        )}

        {hasPaypal && (
          <div className="mt-4">
            <button
              type="button"
              disabled={paying || !parsedAmount || parsedAmount <= 0}
              onClick={startPayPal}
              className="rounded-lg bg-[#0070ba] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#005ea6] disabled:opacity-50"
            >
              Continue with PayPal
            </button>
            {config.paypal_test_mode && (
              <p className="mt-1 text-xs text-amber-700">PayPal test mode is enabled.</p>
            )}
            {paypalReady && <div ref={paypalRef} className="mt-3 max-w-md" />}
          </div>
        )}

        {hasStripe && (
          <div className="mt-4">
            <button
              type="button"
              disabled={paying || !parsedAmount || parsedAmount <= 0}
              onClick={handleStripePay}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {paying ? 'Processing…' : 'Pay with Stripe'}
            </button>
          </div>
        )}

        <ErrorBanner message={error} />
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      </div>

      <section>
        <h3 className="mb-3 font-semibold text-slate-900">PayPal / Stripe history</h3>
        <DataTable
          columns={gatewayColumns}
          rows={gatewayQuery.data?.items ?? []}
          emptyMessage="No gateway payments yet."
        />
      </section>
    </div>
  );
}
