const ORIGIN = 'https://portal.incorpus.in';
const app = await fetch(ORIGIN + '/static/js/app.b01d8da3f1fad6d81a5f.js').then((r) => r.text());
for (const t of ['getClientParams', 'is_panel_mydid', 'enable_buy', 'buy_did', 'buyDid', '/clients/origination/buy']) {
  let idx = 0;
  let c = 0;
  while ((idx = app.indexOf(t, idx + 1)) !== -1 && c < 4) {
    c++;
    console.log(t, ':', app.slice(idx - 80, idx + 200).replace(/\s+/g, ' '));
  }
}

const API = 'https://portal.incorpus.in/api_dnl/v1';
const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'go2dial', password: 'test@123' }),
}).then((r) => r.json());
const h = { 'X-Auth-Token': auth.payload.token, Accept: 'application/json' };

// search_local with 10-digit pattern (required minLength 10)
for (const pattern of ['2032441150', '2030000000', '12025551234', '0000000000']) {
  const r = await fetch(
    `${API}/did_api/search_local?per_page=50&page=0&pattern=${pattern}&state=CT`,
    { headers: h },
  );
  const j = await r.json();
  console.log('search pattern', pattern, '->', j.payload?.total ?? j.payload?.items?.length ?? j.error?.message ?? JSON.stringify(j).slice(0, 80));
}

// coverage then search flow
const cov = await fetch(`${API}/did_api/coverage_local?state=CT&npa=203`, { headers: h }).then((r) => r.json());
console.log('coverage CT 203:', JSON.stringify(cov.payload ?? cov).slice(0, 500));

const cov2 = await fetch(`${API}/did_api/coverage_local?country=US`, { headers: h }).then((r) => r.json());
console.log('coverage US:', cov2.payload?.items?.length ?? cov2.payload?.total ?? JSON.stringify(cov2).slice(0, 200));
