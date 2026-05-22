import api from '../config/api';
import { isMockMode, unwrapPayload } from '../utils/apiHelpers';

export const paymentService = {
  getPublicConfig: async () => {
    if (isMockMode()) {
      return {
        paypal_account: 'mock-paypal-client-id',
        stripe_publisher_key: 'pk_test_mock',
        paypal_test_mode: true,
      };
    }
    const res = await api.get('/config/public/payment');
    const raw = unwrapPayload(res.data);
    return {
      ...raw,
      stripe_publisher_key:
        raw?.stripe_publisher_key ??
        raw?.stripe_publishable_key ??
        raw?.stripe_public_key ??
        '',
      paypal_account: raw?.paypal_account ?? raw?.paypal_client_id ?? '',
    };
  },

  /**
   * Stripe Checkout (same as classic portal):
   *   POST /stripe/checkout → { sessionId }, then redirect with Stripe.js.
   * Optional invoice_id when paying a specific invoice.
   */
  createStripeCheckoutSession: async ({ amount, invoiceId, baseUrl }) => {
    if (isMockMode()) {
      return { sessionId: 'mock_session', success: true };
    }
    const body = {
      base_url: baseUrl ?? window.location.origin,
      amount: Number(amount),
    };
    if (invoiceId) body.invoice_id = Number(invoiceId);
    const res = await api.post('/stripe/checkout', body);
    return unwrapPayload(res.data) ?? res.data;
  },

  /**
   * Direct gateway record (legacy). Most accounts return 403 here — Stripe Checkout
   * is the supported flow on the live portal.
   */
  createGatewayPayment: async (body) => {
    if (isMockMode()) {
      return { id: Date.now(), ...body, status: 'initial' };
    }
    const res = await api.post('/home/client/payment', body);
    return unwrapPayload(res.data);
  },
};
