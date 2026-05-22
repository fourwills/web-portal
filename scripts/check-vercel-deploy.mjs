const html = await fetch('https://web-portal-azure.vercel.app/').then((r) => r.text());
const m = html.match(/src="(\/assets\/[^"]+\.js)"/);
if (!m) {
  console.log('No JS bundle found');
  process.exit(1);
}
const js = await fetch('https://web-portal-azure.vercel.app' + m[1]).then((r) => r.text());
console.log('Bundle:', m[1]);
for (const h of ['auth/login', '/auth"', "post(\"/auth", 'email_or_name', 'X-Auth-Token', 'dev-mock-token']) {
  console.log(h, js.includes(h) ? 'YES' : 'no');
}
