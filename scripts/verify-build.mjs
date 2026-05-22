import fs from 'fs';
import path from 'path';

const dist = path.join(process.cwd(), 'dist');
const index = path.join(dist, 'index.html');

if (!fs.existsSync(index)) {
  console.error('FAIL: dist/index.html missing — run npm run build first');
  process.exit(1);
}

const html = fs.readFileSync(index, 'utf8');
const assetsDir = path.join(dist, 'assets');
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

const hostverge = process.argv.includes('--hostverge');
const htaccessPath = path.join(dist, '.htaccess');

const checks = [
  ['index.html exists', true],
  ['index has root mount', html.includes('id="root"')],
  ['has JS bundle', assets.some((f) => f.endsWith('.js'))],
  ['has CSS bundle', assets.some((f) => f.endsWith('.css'))],
];

if (hostverge) {
  checks.push(['.htaccess for Apache SPA', fs.existsSync(htaccessPath)]);
  const jsBundle = assets.find((f) => f.endsWith('.js'));
  const jsText = jsBundle
    ? fs.readFileSync(path.join(assetsDir, jsBundle), 'utf8')
    : '';
  const usesRelativeApi =
    jsText.includes('/api_dnl/v1') && !jsText.includes('https://portal.incorpus.in/api_dnl/v1');
  checks.push(['API URL is absolute (Hostverge)', jsBundle && !usesRelativeApi]);
}

let failed = false;
for (const [label, ok] of checks) {
  console.log(ok ? 'OK' : 'FAIL', label);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('\nBuild verification passed.');
