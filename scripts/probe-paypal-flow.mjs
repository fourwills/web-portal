const ORIGIN = 'https://portal.incorpus.in';

const text = await fetch(`${ORIGIN}/static/js/83.5f9bdf81e6660e80d890.js`).then((r) => r.text());

const terms = [
  'paypalPayment',
  'paypalSuccess',
  'paypalReturn',
  'paypal_account',
  'paypal_test_mode',
  'paypal_transaction_id',
  '/home/client/payment',
  'paypal_id',
  'experience',
  'capture',
  'authorize',
  'sandbox',
  'production',
  'paypal-button',
  'enable_paypal',
  'createOrder',
  'onApprove',
];
for (const t of terms) {
  let idx = -1;
  let count = 0;
  while ((idx = text.indexOf(t, idx + 1)) !== -1) {
    count++;
    if (count <= 4) {
      const snippet = text.slice(Math.max(0, idx - 80), idx + 300).replace(/\s+/g, ' ');
      console.log(`${t} @${idx}: …${snippet}…`);
    }
  }
  if (count > 4) console.log(`${t}: +${count - 4} more`);
  console.log();
}

const API = 'https://portal.incorpus.in/api_dnl/v1';
const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'ams1', password: 'test@123' }),
}).then((r) => r.json());
const token = auth.payload.token;
const h = { 'X-Auth-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' };

for (const ep of ['/paypal/checkout', '/paypal/order', '/home/client/paypal']) {
  const r = await fetch(API + ep, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ amount: 1, base_url: 'https://web-portal-azure.vercel.app' }),
  });
  console.log('POST', ep, '->', r.status, (await r.text()).slice(0, 200));
}
