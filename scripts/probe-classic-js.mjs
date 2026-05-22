const ORIGIN = 'https://portal.incorpus.in';

async function main() {
  const html = await fetch(`${ORIGIN}/`).then((r) => r.text());
  const urls = new Set();
  for (const re of [/src="([^"]+)"/g, /href="([^"]+\.js[^"]*)"/g, /"(assets\/[^"]+\.js)"/g]) {
    for (const m of html.matchAll(re)) urls.add(m[1]);
  }
  console.log('Found', urls.size, 'asset refs');
  for (const u of [...urls].slice(0, 15)) {
    const url = u.startsWith('http') ? u : `${ORIGIN}/${u.replace(/^\//, '')}`;
    try {
      const text = await fetch(url).then((r) => (r.ok ? r.text() : ''));
      if (!text) continue;
      if (/online_payment|client\/payment|cardnumber|stripe_publisher|gateway_payment/i.test(text)) {
        console.log('\n===', url, 'size', text.length);
        const terms = [
          'online_payment',
          '/home/client/payment',
          'client/payment',
          'cardnumber',
          'cardexpmonth',
          'strip_id',
          'stripe_publisher',
          'createPaymentMethod',
        ];
        for (const t of terms) {
          const i = text.indexOf(t);
          if (i >= 0) console.log(' ', t, '->', text.slice(Math.max(0, i - 40), i + 120).replace(/\s+/g, ' '));
        }
      }
    } catch (e) {
      console.log('skip', url, e.message);
    }
  }
}

main();
