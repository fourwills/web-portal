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

  /**
   * Classic DNL portal flow: cardnumber + cardexpmonth + cardexpyear on POST /home/client/payment.
   * Optional strip_id (Stripe token) when using Stripe.js tokenization.
   */
  createStripePayment: async ({
    amount,
    clientName,
    cardnumber,
    cardexpmonth,
    cardexpyear,
    stripId,
  }) => {
    const body = {
      amount,
      type: 'stripe',
      status: 'initial',
      client_name: clientName,
    };
    if (stripId) {
      body.strip_id = stripId;
    } else {
      body.cardnumber = cardnumber;
      body.cardexpmonth = cardexpmonth;
      body.cardexpyear = cardexpyear;
    }
    return paymentService.createGatewayPayment(body);
  },
};
