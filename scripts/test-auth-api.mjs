const base = process.env.VITE_API_BASE_URL || 'https://portal.incorpus.in/api_dnl/v1';

async function testInvalidAuth() {
  const res = await fetch(`${base}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_name: 'invalid_user_test', password: 'wrong' }),
  });
  const body = await res.json();
  if (res.status !== 401) {
    throw new Error(`Expected 401 for bad credentials, got ${res.status}: ${JSON.stringify(body)}`);
  }
  console.log('OK  POST /auth rejects invalid credentials (401)');
}

async function testLiveAuth() {
  const user = process.env.TEST_USER || process.env.VITE_TEST_EMAIL_OR_NAME;
  const pass = process.env.TEST_PASS || process.env.VITE_TEST_PASSWORD;
  if (!user || !pass) {
    console.log('SKIP live login (set TEST_USER and TEST_PASS to run)');
    return;
  }

  const res = await fetch(`${base}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_name: user, password: pass }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Live login failed ${res.status}: ${JSON.stringify(body)}`);
  }
  const token = body.payload?.token ?? body.token;
  if (!token) throw new Error('No token in login response');

  const clientRes = await fetch(`${base}/home/client`, {
    headers: { 'X-Auth-Token': token, Accept: 'application/json' },
  });
  const clientBody = await clientRes.text();
  if (!clientRes.ok) {
    throw new Error(`GET /home/client failed ${clientRes.status}: ${clientBody.slice(0, 300)}`);
  }
  console.log('OK  live login + X-Auth-Token → GET /home/client (200)');
}

await testInvalidAuth();
await testLiveAuth();
console.log('\nAPI auth smoke test passed.');
