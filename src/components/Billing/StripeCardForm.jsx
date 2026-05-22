import { useEffect, useRef, useState } from 'react';
import { loadStripeJs } from '../../utils/stripeLoader';

export default function StripeCardForm({
  publishableKey,
  amount,
  disabled,
  onPay,
  onLoadError,
}) {
  const mountRef = useRef(null);
  const stripeRef = useRef(null);
  const cardRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        const stripe = await loadStripeJs(publishableKey);
        if (cancelled || !mountRef.current) return;

        stripeRef.current = stripe;
        const elements = stripe.elements();
        const card = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#0f172a',
              '::placeholder': { color: '#94a3b8' },
            },
          },
        });
        card.mount(mountRef.current);
        cardRef.current = card;
        setReady(true);
      } catch (err) {
        if (!cancelled) onLoadError?.(err?.message ?? 'Could not load Stripe.');
      }
    })();

    return () => {
      cancelled = true;
      cardRef.current?.destroy();
      cardRef.current = null;
      stripeRef.current = null;
    };
  }, [publishableKey, onLoadError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripeRef.current || !cardRef.current || processing) return;

    setProcessing(true);
    try {
      const { paymentMethod, error } = await stripeRef.current.createPaymentMethod({
        type: 'card',
        card: cardRef.current,
      });
      if (error) throw new Error(error.message);
      await onPay(paymentMethod.id);
    } catch (err) {
      onLoadError?.(err?.message ?? 'Card payment failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 max-w-md space-y-3">
      <div ref={mountRef} className="rounded-lg border border-slate-200 bg-white p-3" />
      <button
        type="submit"
        disabled={disabled || !ready || processing}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {processing ? 'Processing…' : `Pay $${Number(amount).toFixed(2)} with card`}
      </button>
    </form>
  );
}
