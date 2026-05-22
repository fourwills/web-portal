import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { applyEnvFile } from './load-env-file.mjs';

const ENV_FILE = '.env.hostverge';
const UPLOAD_README = `Upload these files to your Hostverge subdomain document root
(e.g. public_html/portal.thevoiptalk.com for https://portal.thevoiptalk.com)

Upload EVERYTHING in this dist/ folder:
  - index.html
  - assets/ (entire folder)
  - .htaccess (enable "Show Hidden Files" in cPanel File Manager)

Do NOT upload: src/, node_modules/, .env*, or the dist/ folder itself as a subfolder.

API must allow CORS from: https://portal.thevoiptalk.com

Rebuild: npm run build:hostverge
Guide: DEPLOYMENT_HOSTVERGE.md
`;

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!fs.existsSync(path.join(process.cwd(), ENV_FILE))) {
  console.error(`ERROR: ${ENV_FILE} missing. Copy from .env.example or create it.`);
  process.exit(1);
}

process.env.BUILD_PROFILE = 'hostverge';
applyEnvFile(ENV_FILE, { overwrite: true });

console.log('\n=== Hostverge production build ===\n');
run('node', ['./scripts/validate-env.mjs']);
run('npx', ['vite', 'build']);
run('node', ['./scripts/verify-build.mjs', '--hostverge']);

const distDir = path.join(process.cwd(), 'dist');
fs.writeFileSync(path.join(distDir, 'UPLOAD-README.txt'), UPLOAD_README, 'utf8');
console.log('\nDone. Upload the contents of dist/ to portal.thevoiptalk.com');
console.log('See dist/UPLOAD-README.txt and DEPLOYMENT_HOSTVERGE.md\n');
