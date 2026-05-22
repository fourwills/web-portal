const API = 'https://portal.incorpus.in/api_dnl/v1';
const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'go2dial', password: 'test@123' }),
}).then((r) => r.json());
const h = { 'X-Auth-Token': auth.payload.token, Accept: 'application/json' };

async function get(path) {
  const r = await fetch(API + path, { headers: h });
  const j = await r.json();
  const items = j.payload?.items ?? [];
  console.log(path.split('?')[0], '->', r.status, 'total=', j.payload?.total, 'items=', items.length);
  if (items[0]) console.log('  keys:', Object.keys(items[0]).join(','), 'number/did:', items[0].number ?? items[0].did);
  return items;
}

await get('/home/client/did/free/list?per_page=999&page=0&end_date_isnull=true');

// search like classic - no pattern when placeholder
for (const q of [
  'page=0&per_page=50',
  'page=0&per_page=50&state=CT',
  'page=0&per_page=50&npa=203',
  'page=0&per_page=50&country=US',
  'page=0&per_page=50&state=CT&npa=203',
  'page=0&per_page=50&state=NY',
  'page=0&per_page=50&state=CA',
]) {
  await get('/did_api/search_local?' + q);
}

// toll free with pattern 1800xxxx (7+ prefix)
for (const q of ['page=0&per_page=50&pattern=1800xxxxxxx', 'page=0&per_page=50&pattern=800xxxxxxx']) {
  await get('/did_api/search_toll_free?' + q);
}
