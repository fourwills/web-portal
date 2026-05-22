const ORIGIN = 'https://portal.incorpus.in';

const manifest = await fetch(ORIGIN + '/static/js/manifest.d473d6b721d91b0f3249.js').then((r) => r.text());

const match = manifest.match(/\{0:\s*"[^"]+",[^}]+\}/) || manifest.match(/\{(?:\d+:"[^"]+",?){2,}\}/);
console.log('Manifest snippet:', match?.[0]?.slice(0, 3000) ?? '(not found)');

const mapMatch = manifest.match(/(\d+):"([0-9a-f]{16,})"/g);
const map = {};
for (const pair of mapMatch ?? []) {
  const [, id, hash] = pair.match(/(\d+):"([0-9a-f]{16,})"/);
  map[id] = hash;
}
console.log('Chunks mapped:', Object.keys(map).length);

const chunk83 = map['83'];
console.log('Chunk 83 hash:', chunk83);

if (chunk83) {
  const url = `${ORIGIN}/static/js/83.${chunk83}.js`;
  console.log('\nFetching:', url);
  const res = await fetch(url);
  const text = await res.text();
  console.log('Status:', res.status, 'Bytes:', text.length);

  if (res.ok) {
    const terms = [
      'online_payment',
      'home/client/payment',
      'cardnumber',
      'cardexpmonth',
      'cardexpyear',
      'strip_id',
      'strip_transaction_id',
      'paypal_account',
      'paypal_transaction_id',
      'amount',
      'stripe_publisher_key',
      'stripe',
      'paypal',
      'config/public/payment',
      'this.$http',
      'axios',
    ];
    for (const t of terms) {
      let idx = -1;
      let count = 0;
      while ((idx = text.indexOf(t, idx + 1)) !== -1) {
        count++;
        if (count <= 5) {
          const snippet = text.slice(Math.max(0, idx - 80), idx + 250).replace(/\s+/g, ' ');
          console.log(`  ${t} @${idx}: …${snippet}…`);
        }
      }
      if (count > 5) console.log(`  ${t}: +${count - 5} more`);
    }
  }
}
