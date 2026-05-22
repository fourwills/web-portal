const API = 'https://portal.incorpus.in/api_dnl/v1';
const auth = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'ams1', password: 'test@123' }),
}).then((r) => r.json());
const token = auth.payload.token;
const body = {
  amount: 1,
  type: 'stripe',
  status: 'initial',
  cardnumber: '4242424242424242',
  cardexpmonth: '12',
  cardexpyear: '2030',
  client_name: 'AMS',
};

const variants = [
  { 'X-Auth-Token': token },
  { 'X-Auth-Token': token, Origin: 'https://portal.incorpus.in' },
  { 'X-Auth-Token': token, Origin: 'https://portal.incorpus.in', Referer: 'https://portal.incorpus.in/' },
  { 'X-Auth-Token': token, Origin: 'https://web-portal-azure.vercel.app' },
];

for (const extra of variants) {
  const r = await fetch(`${API}/home/client/payment`, {
    method: 'POST',
    headers: { ...extra, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  console.log(Object.keys(extra).join(','), '->', r.status, (await r.text()).slice(0, 100));
}
