const API = 'https://portal.incorpus.in/api_dnl/v1';

async function main() {
  const loginRes = await fetch(`${API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email_or_name: 'ams1', password: 'test@123' }),
  });
  console.log('Login status', loginRes.status);
  console.log('Set-Cookie:', loginRes.headers.getSetCookie?.() ?? loginRes.headers.get('set-cookie'));
  const auth = await loginRes.json();
  const token = auth.payload?.token;
  console.log('Token?', Boolean(token));

  const cookieHeader = loginRes.headers.get('set-cookie') ?? '';

  const bodies = [{ amount: 1, type: 'stripe', status: 'initial', cardnumber: '4242424242424242', cardexpmonth: '12', cardexpyear: '2030' }];

  for (const headers of [
    { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
    { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    { Cookie: cookieHeader, 'Content-Type': 'application/json' },
    { 'X-Auth-Token': token, Cookie: cookieHeader, 'Content-Type': 'application/json' },
  ]) {
    const r = await fetch(`${API}/home/client/payment`, {
      method: 'POST',
      headers: { ...headers, Accept: 'application/json' },
      body: JSON.stringify(bodies[0]),
    });
    const keys = Object.keys(headers).join(',');
    console.log(`POST [${keys}] ->`, r.status, (await r.text()).slice(0, 120));
  }

  // Non-v1 paths?
  for (const path of ['/api/payment', '/client/payment', '/home/client/payment']) {
    const r = await fetch(`https://portal.incorpus.in${path}`, {
      method: 'POST',
      headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(bodies[0]),
    });
    console.log('POST', path, '->', r.status);
  }
}

main();
