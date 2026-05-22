const API = 'https://portal.incorpus.in/api_dnl/v1';
const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'go2dial', password: 'test@123' }),
}).then((r) => r.json());
const h = { 'X-Auth-Token': auth.payload.token, Accept: 'application/json' };

async function probe(label, url) {
  const r = await fetch(url, { headers: h });
  const t = await r.text();
  let out = `${r.status}`;
  try {
    const j = JSON.parse(t);
    const total = j.payload?.total ?? j.payload?.items?.length;
    out += ` total=${total}`;
    if (j.payload?.items?.[0]) out += ` sample=${JSON.stringify(j.payload.items[0]).slice(0, 120)}`;
    if (j.error) out += ` err=${j.error.message}`;
  } catch {
    out += ' ' + t.slice(0, 100);
  }
  console.log(label, '->', out);
}

await probe('free default', `${API}/home/client/did/free/list?per_page=999&page=0&end_date_isnull=true`);
await probe('free active', `${API}/home/client/did/free/list?per_page=999&page=0&end_date_isnull=true&active=true&is_available=true`);
await probe('search_local CT', `${API}/did_api/search_local?state=CT&per_page=50&page=0`);
await probe('search_local pattern', `${API}/did_api/search_local?pattern=2032441150&per_page=50`);
await probe('search_toll_free', `${API}/did_api/search_toll_free?per_page=50&page=0`);
await probe('search_toll_free npa', `${API}/did_api/search_toll_free?npa=800&per_page=50`);
await probe('coverage_toll_free', `${API}/did_api/coverage_toll_free?per_page=50`);
await probe('coverage_local CT', `${API}/did_api/coverage_local?state=CT&npa=203`);
