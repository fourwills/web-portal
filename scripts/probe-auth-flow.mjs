const API = 'https://portal.incorpus.in/api_dnl/v1';

const loginRes = await fetch(`${API}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email_or_name: 'ams1', password: 'test@123' }),
});
const login = await loginRes.json();
console.log('login', JSON.stringify(login, null, 2));

const token = login.payload?.token;
const checkRes = await fetch(`${API}/auth/check-token`, {
  method: 'POST',
  headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
  body: '{}',
});
console.log('\ncheck-token', checkRes.status, await checkRes.text());

const payBody = {
  amount: 1,
  type: 'stripe',
  status: 'initial',
  cardnumber: '4242424242424242',
  cardexpmonth: '12',
  cardexpyear: '2030',
  client_name: 'AMS',
};

const payRes = await fetch(`${API}/home/client/payment`, {
  method: 'POST',
  headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
  body: JSON.stringify(payBody),
});
console.log('\npayment after check-token', payRes.status, await payRes.text());
