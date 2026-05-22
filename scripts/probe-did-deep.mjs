const API = 'https://portal.incorpus.in/api_dnl/v1';

async function login(user) {
  const auth = await fetch(`${API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_name: user, password: 'test@123' }),
  }).then((r) => r.json());
  return auth.payload?.token;
}

async function get(token, ep) {
  const r = await fetch(API + ep, { headers: { 'X-Auth-Token': token, Accept: 'application/json' } });
  const t = await r.text();
  let info = `${r.status}`;
  try {
    const j = JSON.parse(t);
    const n = j.payload?.items?.length ?? j.payload?.total ?? 0;
    info += ` total=${j.payload?.total ?? n} items=${j.payload?.items?.length ?? '?'}`;
    if (j.payload?.items?.[0]) info += ' keys=' + Object.keys(j.payload.items[0]).slice(0, 8).join(',');
  } catch {
    info += ' ' + t.slice(0, 80);
  }
  return info;
}

for (const user of ['go2dial', 'ams1']) {
  const token = await login(user);
  console.log(`\n=== ${user} ===`);
  if (!token) continue;
  const paths = [
    '/home/client/did/free/list?per_page=100&page=0',
    '/home/client/did/free/list?per_page=100&page=0&is_available=true',
    '/did_api/search_local?per_page=100&page=0',
    '/did_api/search_local?per_page=100&npa=203',
    '/did_api/search_local?per_page=100&state=CT',
    '/did_api/coverage_local',
    '/did_api/coverage_local?state=CT',
    '/home/client/did/billing_rule/list?per_page=20',
  ];
  for (const p of paths) console.log(p, '->', await get(token, p));
}

// swagger free list params
const s = await fetch(`${API}/swagger.json`).then((r) => r.json());
const free = s.paths['/home/client/did/free/list']?.get;
console.log('\n=== swagger did/free/list params ===');
console.log(JSON.stringify(free?.parameters?.map((p) => ({ name: p.name, in: p.in, type: p.type })), null, 2));

const search = s.paths['/did_api/search_local']?.get;
console.log('\n=== swagger search_local params ===');
console.log(JSON.stringify(search?.parameters?.slice(0, 20), null, 2));
