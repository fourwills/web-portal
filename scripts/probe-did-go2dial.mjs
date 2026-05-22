const API = 'https://portal.incorpus.in/api_dnl/v1';
const USER = 'go2dial';
const PASS = 'test@123';

const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: USER, password: PASS }),
}).then((r) => r.json());

if (!auth.payload?.token) {
  console.log('LOGIN FAILED', JSON.stringify(auth));
  process.exit(1);
}

const token = auth.payload.token;
const h = { 'X-Auth-Token': token, Accept: 'application/json' };
console.log('Login OK', USER);

const client = await fetch(`${API}/home/client`, { headers: h }).then((r) => r.json());
const p = client.payload || {};
console.log('\nClient:', p.company_name, 'client_id?', p.client_id);
const didKeys = Object.keys(p).filter((k) => /did|vendor|portal|permission|enable/i.test(k));
for (const k of didKeys) console.log(' ', k, '=', p[k]);

const endpoints = [
  '/home/client/did/list?per_page=10&page=0',
  '/home/client/did/free/list?per_page=10&page=0',
  '/did_api/search_local?per_page=10&page=0',
  '/did_api/search_local?state=DC&per_page=10',
  '/home/vendor/did/list?per_page=10&page=0',
  '/home/client/did/billing_rule/list?per_page=10',
];

for (const ep of endpoints) {
  const r = await fetch(API + ep, { headers: h });
  const text = await r.text();
  let summary = text.slice(0, 400);
  try {
    const j = JSON.parse(text);
    const items = j.payload?.items ?? j.payload;
    if (Array.isArray(items)) summary = `items=${items.length} total=${j.payload?.total ?? items.length}`;
    else if (j.payload?.items) summary = `items=${j.payload.items.length} total=${j.payload.total}`;
    else summary = JSON.stringify(j).slice(0, 300);
  } catch {
    /* raw */
  }
  console.log(`\nGET ${ep}`);
  console.log(' ', r.status, summary);
  if (r.ok) {
    try {
      const j = JSON.parse(text);
      const item = j.payload?.items?.[0] ?? (Array.isArray(j.payload) ? j.payload[0] : null);
      if (item) console.log('  sample keys:', Object.keys(item).join(', '));
      if (item) console.log('  sample:', JSON.stringify(item).slice(0, 250));
    } catch {
      /* */
    }
  }
}
