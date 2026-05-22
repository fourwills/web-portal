/** User-facing message for payment API failures (esp. 403 vs config). */
export function formatPaymentError(err) {
  const status = err?.response?.status;
  const apiMsg =
    err?.response?.data?.error?.message ??
    err?.response?.data?.message ??
    err?.message;

  if (status === 403) {
    return [
      'The API rejected this payment (permission denied), even though Stripe may be enabled in admin.',
      'On the carrier side: open Self-Service Portal for this client, ensure Billing → Online Payment → Stripe is checked, click Save, then log out and back in here.',
      'If it still fails, ask your provider to confirm API access to POST /home/client/payment for portal user ams1 (error code 140).',
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
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}
