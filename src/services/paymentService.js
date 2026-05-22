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

  createGatewayPayment: async (body) => {
    if (isMockMode()) {
      return { id: Date.now(), ...body, status: 'initial' };
    }
    const res = await api.post('/home/client/payment', body);
    return unwrapPayload(res.data);
  },

  /** DNL API uses typo field names strip_id / strip_transaction_id in swagger. */
  createStripePayment: async ({ amount, paymentMethodId, clientName }) =>
    paymentService.createGatewayPayment({
      amount,
      type: 'stripe',
      status: 'initial',
      strip_id: paymentMethodId,
      client_name: clientName,
    }),
};
