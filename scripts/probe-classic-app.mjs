const ORIGIN = 'https://portal.incorpus.in';
const ASSETS = [
  '/static/js/app.b01d8da3f1fad6d81a5f.js',
  '/static/js/vendor.31d85eedd1f86caaa799.js',
  '/static/js/manifest.d473d6b721d91b0f3249.js',
];

for (const path of ASSETS) {
  const res = await fetch(ORIGIN + path);
  const text = await res.text();
  console.log(`\n=== ${path} (${text.length} bytes) ===`);

  const terms = [
    'online_payment',
    '/home/client/payment',
    'client/payment',
    'cardnumber',
    'cardexpmonth',
    'cardexpyear',
    'strip_id',
    'strip_transaction_id',
    'stripe_publisher',
    'paypal_account',
    'createPaymentMethod',
    'createToken',
    'stripe.js',
    'Stripe(',
    'paypal_transaction_id',
    'paypal-button',
  ];
  for (const t of terms) {
    let idx = -1;
    let count = 0;
    while ((idx = text.indexOf(t, idx + 1)) !== -1) {
      count++;
      if (count <= 3) {
        const snippet = text.slice(Math.max(0, idx - 60), idx + 200).replace(/\s+/g, ' ');
        console.log(`  ${t} @${idx}: …${snippet}…`);
      }
    }
    if (count > 3) console.log(`  ${t}: ${count} more occurrences`);
  }
}
