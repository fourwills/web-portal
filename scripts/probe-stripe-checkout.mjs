const API = 'https://portal.incorpus.in/api_dnl/v1';

const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'ams1', password: 'test@123' }),
}).then((r) => r.json());
const token = auth.payload.token;
const h = { 'X-Auth-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' };
console.log('login ok');

const endpoints = [
  '/stripe/checkout',
  '/home/client/stripe/checkout',
  '/home/client/stripe_checkout',
];
for (const ep of endpoints) {
  const body = {
    base_url: 'https://web-portal-azure.vercel.app',
    amount: 1,
  };
  const r = await fetch(API + ep, { method: 'POST', headers: h, body: JSON.stringify(body) });
  console.log(ep, '->', r.status, (await r.text()).slice(0, 300));
}

const get = await fetch(`${API}/home/client`, { headers: h }).then((r) => r.json());
const p = get.payload || {};
console.log('\nclient flags:');
for (const k of Object.keys(p)) {
  if (/enable|payment|stripe|paypal|portal/i.test(k)) console.log(' ', k, '=', p[k]);
}
