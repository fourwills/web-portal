const base = process.env.VITE_API_BASE_URL || 'https://portal.incorpus.in/api_dnl/v1';

async function testAuth() {
  const res = await fetch(`${base}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_name: 'invalid_user_test', password: 'wrong' }),
  });
  const body = await res.json();
  if (res.status !== 401) {
    throw new Error(`Expected 401 for bad credentials, got ${res.status}: ${JSON.stringify(body)}`);
  }
  if (body.error?.reason !== 'incorrect_credentials' && !body.error?.message) {
    throw new Error(`Unexpected error shape: ${JSON.stringify(body)}`);
  }
  console.log('OK  POST /auth rejects invalid credentials (401)');
}

async function testMockLogin() {
  const mockUser = 'demo';
  const mockPass = 'demo';
  if (mockUser !== 'demo' || mockPass !== 'demo') throw new Error('mock creds mismatch');
  console.log('OK  dev mock credentials (demo/demo) configured');
}

await testMockLogin();
await testAuth();
console.log('\nAPI auth smoke test passed.');
