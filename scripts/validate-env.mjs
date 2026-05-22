import fs from 'fs';
import path from 'path';

const DEFAULT_BASE_URL = 'https://portal.incorpus.in/api_dnl/v1';

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function resolveBaseUrl() {
  const fromProcess = process.env.VITE_API_BASE_URL?.trim();
  if (fromProcess) return { base: fromProcess, source: 'environment' };

  for (const file of ['.env.production', '.env', '.env.example']) {
    const value = loadEnvFile(file).VITE_API_BASE_URL?.trim();
    if (value) return { base: value, source: file };
  }

  return { base: DEFAULT_BASE_URL, source: 'built-in default' };
}

const { base, source } = resolveBaseUrl();

if (base.includes('auth/login')) {
  console.error('ERROR: VITE_API_BASE_URL must not include /auth/login');
  process.exit(1);
}

// Ensure Vite sees the same value during `vite build` (e.g. on Vercel without dashboard env vars)
if (!process.env.VITE_API_BASE_URL) {
  process.env.VITE_API_BASE_URL = base;
}
if (!process.env.VITE_DEV_MOCK_AUTH) {
  const prod = loadEnvFile('.env.production');
  process.env.VITE_DEV_MOCK_AUTH = prod.VITE_DEV_MOCK_AUTH ?? 'false';
}

console.log(`OK  VITE_API_BASE_URL=${base} (${source})`);
