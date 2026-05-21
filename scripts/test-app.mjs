/**
 * Smoke test: build output + optional live dev server.
 * Usage: node scripts/test-app.mjs [--live http://localhost:5174]
 */
import fs from 'fs';
import path from 'path';

const dist = path.join(process.cwd(), 'dist');
const indexPath = path.join(dist, 'index.html');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// --- static build checks ---
assert(fs.existsSync(indexPath), 'dist/index.html missing — run npm run build');
const html = fs.readFileSync(indexPath, 'utf8');
const assets = fs.readdirSync(path.join(dist, 'assets'));
assert(html.includes('id="root"'), 'index.html missing #root');
assert(assets.some((f) => f.endsWith('.js')), 'missing JS bundle');
assert(assets.some((f) => f.endsWith('.css')), 'missing CSS bundle');
console.log('OK  production build artifacts');

const liveUrl = process.argv.find((a) => a.startsWith('http')) ?? process.env.TEST_URL;

if (liveUrl) {
  const base = liveUrl.replace(/\/$/, '');
  for (const route of ['/', '/login']) {
    const res = await fetch(`${base}${route}`);
    const text = await res.text();
    assert(res.ok, `${route} returned ${res.status}`);
    assert(text.includes('id="root"') || text.includes('Client Portal'), `${route} missing app shell`);
    console.log(`OK  GET ${route} → ${res.status}`);
  }
  console.log('OK  live dev server');
} else {
  console.log('SKIP live server (pass --live http://localhost:5174 to test)');
}

console.log('\nAll tests passed.');
