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
    return unwrapPayload(res.data);
  },

  createGatewayPayment: async (body) => {
    if (isMockMode()) {
      return { id: Date.now(), ...body, status: 'initial' };
    }
    const res = await api.post('/home/client/payment', body);
    return unwrapPayload(res.data);
  },
};
