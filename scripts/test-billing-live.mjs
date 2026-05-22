const PORTAL = 'https://web-portal-azure.vercel.app';
const API_DIRECT = 'https://portal.incorpus.in/api_dnl/v1';
const API_VIA_VERCEL = `${PORTAL}/api_dnl/v1`;
const USER = process.env.TEST_USER || 'ams1';
const PASS = process.env.TEST_PASS || 'test@123';

async function main() {
  console.log('=== Vercel portal ===');
  const page = await fetch(`${PORTAL}/billing`);
  const html = await page.text();
  console.log('GET /billing:', page.status, `(${html.length} bytes)`);
  const jsMatch = html.match(/assets\/index-[^"']+\.js/);
  const bundle = jsMatch?.[0];
  console.log('Bundle:', bundle ?? 'not found');

  if (bundle) {
    const js = await fetch(`${PORTAL}/${bundle}`).then((r) => r.text());
    console.log('Has Stripe Checkout flow:', js.includes('/stripe/checkout') && js.includes('redirectToCheckout'));
    console.log('Has classic portal link:', js.includes('clients/billing/online_payment'));
  }

  for (const [label, API] of [
    ['Direct API', API_DIRECT],
    ['Via Vercel proxy', API_VIA_VERCEL],
  ]) {
    console.log(`\n=== ${label} (${API}) ===`);
    await runBillingApiTests(API);
  }
}

async function runBillingApiTests(API) {
  const authRes = await fetch(`${API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_name: USER, password: PASS }),
  });
  const auth = await authRes.json();
  if (!authRes.ok || !auth.payload?.token) {
    console.log('Login FAILED', authRes.status, JSON.stringify(auth).slice(0, 300));
    process.exit(1);
  }
  const token = auth.payload.token;
  const h = { 'X-Auth-Token': token, Accept: 'application/json' };
  console.log(`Login OK (${USER})`);

  const cfg = await fetch(`${API}/config/public/payment`, { headers: h }).then((r) => r.json());
  const p = cfg.payload ?? {};
  console.log('\nPayment config:');
  console.log('  PayPal:', p.paypal_account ? `${p.paypal_account.slice(0, 14)}…` : '(empty)');
  console.log(
    '  Stripe:',
    (p.stripe_publisher_key || p.stripe_publishable_key || '')
      ? `${(p.stripe_publisher_key || p.stripe_publishable_key).slice(0, 14)}…`
      : '(empty)',
  );

  const fin = await fetch(`${API}/home/client/actual_finance_history`, { headers: h }).then((r) => r.json());
  const row = fin.payload?.items?.[0] ?? fin.payload;
  console.log('\nBalance (actual_finance_history):', row?.actual_balance ?? row?.balance ?? '—');

  const gw = await fetch(`${API}/home/client/gateway_payments?page=0&per_page=5`, { headers: h }).then(
    (r) => r.json(),
  );
  console.log('Gateway payments count:', gw.payload?.total ?? 0);

  const payH = { ...h, 'Content-Type': 'application/json' };

  const checkoutRes = await fetch(`${API}/stripe/checkout`, {
    method: 'POST',
    headers: payH,
    body: JSON.stringify({ base_url: PORTAL, amount: 1 }),
  });
  let checkout = null;
  try {
    checkout = await checkoutRes.json();
  } catch {
    /* may be html error */
  }
  console.log(
    '\nPOST /stripe/checkout:',
    checkoutRes.status,
    checkout?.sessionId ? `sessionId=${checkout.sessionId.slice(0, 14)}…` : '(no sessionId)',
  );

  const directRes = await fetch(`${API}/home/client/payment`, {
    method: 'POST',
    headers: payH,
    body: JSON.stringify({ amount: 1, type: 'paypal', status: 'initial' }),
  });
  console.log(
    'POST /home/client/payment (paypal):',
    directRes.status,
    directRes.status === 403 ? '(expected — Stripe Checkout is the supported flow)' : '',
  );

  const cors = await fetch(`${API}/config/public/payment`, {
    method: 'OPTIONS',
    headers: {
      Origin: PORTAL,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'x-auth-token,content-type',
    },
  });
  console.log('\nCORS preflight from Vercel:', cors.status);
  console.log('  Allow-Origin:', cors.headers.get('access-control-allow-origin') ?? '(none)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
