const API = 'https://portal.incorpus.in/api_dnl/v1';
const USER = 'ams1';
const PASS = 'test@123';

async function login() {
  const auth = await fetch(`${API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_name: USER, password: PASS }),
  }).then((r) => r.json());
  return auth.payload?.token;
}

async function main() {
  const token = await login();
  if (!token) throw new Error('login failed');
  const h = { 'X-Auth-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' };

  const bodies = [
    { amount: 1, type: 'stripe', status: 'initial' },
    {
      amount: 1,
      type: 'stripe',
      status: 'initial',
      cardnumber: '4242424242424242',
      cardexpmonth: '12',
      cardexpyear: '2030',
    },
    { amount: 1, type: 'stripe' },
    { amount: 1, type: 'undefined', status: 'initial' },
  ];

  for (const body of bodies) {
    const r = await fetch(`${API}/home/client/payment`, { method: 'POST', headers: h, body: JSON.stringify(body) });
    console.log(JSON.stringify(body), '->', r.status, (await r.text()).slice(0, 180));
  }

  // Search swagger paths with payment in client home
  const s = await fetch(`${API}/swagger.json`).then((r) => r.json());
  const paths = Object.keys(s.paths).filter((p) => /payment|stripe|gateway|billing/i.test(p) && /client/i.test(p));
  console.log('\nClient payment-related paths:', paths.join('\n  '));
}

main();
