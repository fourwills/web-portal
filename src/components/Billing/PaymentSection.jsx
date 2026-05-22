import { useRef, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { useApi } from '../../hooks/useApi';
import DataTable from '../UI/DataTable';
import ErrorBanner from '../UI/ErrorBanner';
import { PageLoading } from '../UI/PageState';
import { formatDateTime, formatMoney } from '../../utils/apiHelpers';
import { formatPaymentError } from '../../utils/paymentErrors';
import { CLASSIC_ONLINE_PAYMENT_URL } from '../../constants/portalUrls';
import ClassicStripePayment from './ClassicStripePayment';

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
  const hasPaypal = Boolean(config?.paypal_account?.trim());
  const hasStripe = Boolean(config?.stripe_publisher_key?.trim());
  const parsedAmount = parseFloat(amount);
  const amountValid = parsedAmount > 0;
  const clientName = profile?.company_name ?? profile?.client_name;

  const onStripeSuccess = (result) => {
    const redirectUrl = result?.response ?? result?.redirect_url;
    if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('http')) {
      window.location.href = redirectUrl;
      return;
    }
    setMessage('Payment submitted successfully. Balance updates after the gateway confirms.');
    gatewayQuery.refetch();
  };

  const startPayPal = async () => {
    if (!amountValid) {
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
              client_name: clientName,
            });
            setMessage('PayPal payment recorded successfully.');
            gatewayQuery.refetch();
          } catch (err) {
            setError(formatPaymentError(err));
          } finally {
            setPaying(false);
          }
        },
        onError: (err) => setError(err?.message ?? 'PayPal error'),
      }).render(paypalRef.current);
    } catch {
      setError(
        'PayPal checkout could not load. Confirm PayPal Client ID in system settings or use the classic portal link below.',
      );
    }
  };

  if (configQuery.loading) return <PageLoading label="Loading payment options…" />;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Online payment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Same flow as the{' '}
          <a
            href={CLASSIC_ONLINE_PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 hover:underline"
          >
            classic client portal
          </a>
          : enter amount, card details, and pay (or use PayPal).
        </p>

        <a
          href={CLASSIC_ONLINE_PAYMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:underline"
        >
          Open classic payment page →
        </a>

        {!hasPaypal && !hasStripe && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No gateways configured. Enable PayPal/Stripe in system payment settings and Online Payment on your portal user.
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

        {hasStripe && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-800">Stripe</h3>
            {config.stripe_publisher_key?.startsWith('pk_test') && (
              <p className="mt-1 text-xs text-amber-700">Stripe test mode — use test card numbers only.</p>
            )}
            {amountValid ? (
              <ClassicStripePayment
                amount={parsedAmount}
                clientName={clientName}
                disabled={paying}
                onSuccess={onStripeSuccess}
                onError={setError}
              />
            ) : (
              <p className="mt-2 text-sm text-slate-500">Enter an amount to enable card payment.</p>
            )}
          </div>
        )}

        {hasPaypal && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800">PayPal</h3>
            <button
              type="button"
              disabled={paying || !amountValid}
              onClick={startPayPal}
              className="mt-2 rounded-lg bg-[#0070ba] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#005ea6] disabled:opacity-50"
            >
              Continue with PayPal
            </button>
            {config.paypal_test_mode && (
              <p className="mt-1 text-xs text-amber-700">PayPal test mode is enabled.</p>
            )}
            {paypalReady && <div ref={paypalRef} className="mt-3 max-w-md" />}
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
