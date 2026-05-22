const API = 'https://portal.incorpus.in/api_dnl/v1';
const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'go2dial', password: 'test@123' }),
}).then((r) => r.json());
const h = { 'X-Auth-Token': auth.payload.token, Accept: 'application/json' };

const rules = await fetch(`${API}/home/client/did/billing_rule/list?per_page=20`, { headers: h }).then((r) =>
  r.json(),
);
console.log('billing rules:', rules.payload?.items?.map((r) => ({ id: r.id, name: r.name, client_id: r.client_id })));

for (const rule of rules.payload?.items ?? []) {
  const q = `per_page=50&page=0&is_available=true&client_billing_rule_id=${rule.id}`;
  const free = await fetch(`${API}/home/client/did/free/list?${q}`, { headers: h }).then((r) => r.json());
  console.log(`free/list rule ${rule.id} (${rule.name}):`, free.payload?.total ?? free.payload?.items?.length);
}

for (const rule of rules.payload?.items ?? []) {
  const q = `per_page=50&page=0&state=CT&buy_billing_plan_id=${rule.id}`;
  const search = await fetch(`${API}/did_api/search_local?${q}`, { headers: h }).then((r) => r.json());
  console.log(`search_local buy_billing_plan_id=${rule.id}:`, search.payload?.total ?? search.payload?.items?.length);
}

// try pattern search
for (const q of ['pattern=203', 'pattern=2', 'country=US', 'npa=203&buy_billing_plan_id=13']) {
  const r = await fetch(`${API}/did_api/search_local?per_page=50&page=0&${q}`, { headers: h });
  const j = await r.json();
  console.log(`search ${q}:`, j.payload?.total ?? j.payload?.items?.length ?? JSON.stringify(j).slice(0, 100));
}

// coverage with billing
const cov = await fetch(`${API}/did_api/coverage_local?state=CT&buy_billing_plan_id=13`, { headers: h }).then((r) =>
  r.json(),
);
console.log('coverage:', JSON.stringify(cov).slice(0, 400));
