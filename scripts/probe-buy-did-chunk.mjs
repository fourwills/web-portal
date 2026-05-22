const ORIGIN = 'https://portal.incorpus.in';
const manifest = await fetch(ORIGIN + '/static/js/manifest.d473d6b721d91b0f3249.js').then((r) => r.text());
const hash = manifest.match(/149:"([a-f0-9]+)"/)?.[1];
console.log('chunk 149 hash:', hash);
if (!hash) process.exit(1);

const text = await fetch(`${ORIGIN}/static/js/149.${hash}.js`).then((r) => r.text());
console.log('size', text.length);

const terms = [
  'search_local',
  'free/list',
  'coverage_local',
  'order_local',
  'billing_rule',
  'buy_billing',
  'clientFreeDids',
  'end_date_isnull',
  'pattern',
  'per_page',
  'getEndpointUrl',
  'dnlTableRef',
  'buyDid',
];
for (const t of terms) {
  let idx = 0;
  let c = 0;
  while ((idx = text.indexOf(t, idx + 1)) !== -1 && c < 4) {
    c++;
    console.log(`\n${t} @${idx}:`, text.slice(Math.max(0, idx - 70), idx + 180).replace(/\s+/g, ' '));
  }
}
