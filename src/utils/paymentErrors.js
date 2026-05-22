import { CLASSIC_ONLINE_PAYMENT_URL, CLASSIC_PORTAL_ORIGIN } from '../constants/portalUrls';

/** User-facing message for payment API failures. */
export function formatPaymentError(err) {
  const status = err?.response?.status;
  const apiMsg =
    err?.response?.data?.error?.message ??
    err?.response?.data?.message ??
    err?.message;

  if (status === 403) {
    return [
      'Payment was rejected by the gateway API (permission denied).',
      'On the provider side: open the Self-Service Portal for this client → Billing → Online Payment → enable Stripe/PayPal, then Save.',
      'Until then, you can use the classic portal at the link below.',
      apiMsg ? `Server: ${apiMsg}` : null,
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (status === 400) {
    return apiMsg ?? 'Invalid payment request. Check the amount and card details.';
  }

  return apiMsg ?? 'Payment failed. Please try again.';
}

export function getClassicPortalOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  if (base.startsWith('/')) return CLASSIC_PORTAL_ORIGIN;
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}`;
  } catch {
    return CLASSIC_PORTAL_ORIGIN;
  }
}

export { CLASSIC_ONLINE_PAYMENT_URL };
