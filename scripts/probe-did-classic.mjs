const ORIGIN = 'https://portal.incorpus.in';
const app = await fetch(ORIGIN + '/static/js/app.b01d8da3f1fad6d81a5f.js').then((r) => r.text());
const terms = [
  'did/free',
  'free/list',
  'search_local',
  'order_local',
  'coverage_local',
  'buy_billing',
  'billing_rule',
  'enable_did',
  'did_api',
  'FreeDid',
  'buyDid',
];
for (const t of terms) {
  let idx = 0;
  let c = 0;
  while ((idx = app.indexOf(t, idx + 1)) !== -1 && c < 3) {
    c++;
    console.log(t, '@', idx, ':', app.slice(Math.max(0, idx - 50), idx + 120).replace(/\s+/g, ' '));
  }
}
