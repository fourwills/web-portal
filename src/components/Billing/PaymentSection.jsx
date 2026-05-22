import { useEffect, useRef, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { useApi } from '../../hooks/useApi';
import DataTable from '../UI/DataTable';
import ErrorBanner from '../UI/ErrorBanner';
import { PageLoading } from '../UI/PageState';
import { formatDateTime, formatMoney } from '../../utils/apiHelpers';
import { formatPaymentError } from '../../utils/paymentErrors';
import { loadStripeJs } from '../../utils/stripeLoader';

const gatewayColumns = [
  { key: 'paid_on', label: 'Date', render: (r) => formatDateTime(r.paid_on ?? r.entered_on) },
  { key: 'type', label: 'Gateway', render: (r) => r.type ?? '—' },
  { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
  { key: 'status', label: 'Status' },
];

const TAB_PAYPAL = 'paypal';
const TAB_STRIPE = 'stripe';

function loadPayPalScript(clientId, sandbox) {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }
    const env = sandbox ? '&intent=capture' : '';
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD${env}`;
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
  const refetchGateway = gatewayQuery.refetch;

  const config = configQuery.data;
  const profile = profileQuery.data;
  const hasPaypal = Boolean(config?.paypal_account?.trim());
  const hasStripe = Boolean(config?.stripe_publisher_key?.trim());
  const showTabs = hasPaypal && hasStripe;

  const [tab, setTab] = useState(TAB_STRIPE);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const paypalRef = useRef(null);

  const parsedAmount = parseFloat(amount);
  const amountValid = parsedAmount > 0;
  const activeGateway = showTabs ? tab : hasStripe ? TAB_STRIPE : TAB_PAYPAL;

  useEffect(() => {
    if (configQuery.loading) return;
    if (hasStripe) setTab(TAB_STRIPE);
    else if (hasPaypal) setTab(TAB_PAYPAL);
  }, [configQuery.loading, hasStripe, hasPaypal]);

  const payWithStripe = async () => {
    if (!amountValid) {
      setError('Enter a valid amount first.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const session = await paymentService.createStripeCheckoutSession({ amount: parsedAmount });
      if (!session?.sessionId) {
        throw new Error('Gateway did not return a Stripe session.');
      }
      const stripe = await loadStripeJs(config.stripe_publisher_key);
      const { error: redirectError } = await stripe.redirectToCheckout({ sessionId: session.sessionId });
      if (redirectError) throw new Error(redirectError.message);
    } catch (err) {
      setError(formatPaymentError(err));
      setBusy(false);
    }
  };

  useEffect(() => {
    if (activeGateway !== TAB_PAYPAL || !hasPaypal || !amountValid || !config?.paypal_account) return;

    let cancelled = false;
    if (paypalRef.current) paypalRef.current.innerHTML = '';

    (async () => {
      try {
        const paypal = await loadPayPalScript(config.paypal_account, config.paypal_test_mode);
        if (cancelled || !paypalRef.current) return;
        paypal
          .Buttons({
            createOrder: (_d, actions) =>
              actions.order.create({
                purchase_units: [
                  { amount: { value: parsedAmount.toFixed(2), currency_code: 'USD' } },
                ],
              }),
            onApprove: async (data) => {
              setBusy(true);
              setError('');
              try {
                await paymentService.createGatewayPayment({
                  amount: parsedAmount,
                  type: 'paypal',
                  status: 'success',
                  paypal_transaction_id: data.orderID,
                  client_name: profile?.company_name ?? profile?.client_name,
                });
                setMessage('PayPal payment recorded successfully.');
                refetchGateway();
              } catch (err) {
                setError(formatPaymentError(err));
              } finally {
                setBusy(false);
              }
            },
            onError: (err) => setError(err?.message ?? 'PayPal error'),
            onCancel: () => {
              setError('');
              setMessage('');
            },
          })
          .render(paypalRef.current);
      } catch {
        if (!cancelled) {
          setError('PayPal checkout could not load. Check payment settings with your provider.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeGateway,
    hasPaypal,
    amountValid,
    parsedAmount,
    config?.paypal_account,
    config?.paypal_test_mode,
    profile,
    refetchGateway,
  ]);

  if (configQuery.loading) return <PageLoading label="Loading payment options…" />;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Make a payment</h2>

        {!hasPaypal && !hasStripe ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No online payment gateways are configured on your account.
          </p>
        ) : (
          <>
            {showTabs && (
              <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200">
                {[
                  { id: TAB_STRIPE, label: 'Stripe' },
                  { id: TAB_PAYPAL, label: 'PayPal' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTab(id);
                      setError('');
                      setMessage('');
                    }}
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
            )}

            <div className="max-w-xs">
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
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {activeGateway === TAB_STRIPE && hasStripe && (
              <div className="mt-4">
                {config.stripe_publisher_key?.startsWith('pk_test') && (
                  <p className="mb-2 text-xs text-amber-700">Stripe test mode — use test card numbers only.</p>
                )}
                <button
                  type="button"
                  disabled={!amountValid || busy}
                  onClick={payWithStripe}
                  className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {busy ? 'Redirecting…' : `Pay $${amountValid ? parsedAmount.toFixed(2) : '0.00'} with Stripe`}
                </button>
                <p className="mt-2 text-sm text-slate-500">
                  You will be redirected to Stripe to enter card details securely.
                </p>
              </div>
            )}

            {activeGateway === TAB_PAYPAL && hasPaypal && (
              <div className="mt-4">
                {config.paypal_test_mode && (
                  <p className="mb-2 text-xs text-amber-700">PayPal sandbox mode is enabled.</p>
                )}
                {amountValid ? (
                  <div ref={paypalRef} className="max-w-md" />
                ) : (
                  <p className="text-sm text-slate-500">Enter an amount to show PayPal buttons.</p>
                )}
              </div>
            )}

            <ErrorBanner message={error} />
            {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">PayPal / Stripe history</h2>
        <DataTable
          columns={gatewayColumns}
          rows={gatewayQuery.data?.items ?? []}
          emptyMessage="No gateway payments yet."
        />
      </section>
    </div>
  );
}
