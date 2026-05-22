import { loadEnvFile } from './load-env-file.mjs';

const DEFAULT_BASE_URL = 'https://portal.incorpus.in/api_dnl/v1';

function resolveBaseUrl() {
  const fromProcess = process.env.VITE_API_BASE_URL?.trim();
  if (fromProcess) return { base: fromProcess, source: 'environment' };

  const profile = process.env.BUILD_PROFILE?.trim();
  const envFiles =
    profile === 'hostverge'
      ? ['.env.hostverge', '.env.production', '.env', '.env.example']
      : ['.env.production', '.env', '.env.example'];

  for (const file of envFiles) {
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
  const mockSource =
    process.env.BUILD_PROFILE === 'hostverge'
      ? loadEnvFile('.env.hostverge')
      : loadEnvFile('.env.production');
  process.env.VITE_DEV_MOCK_AUTH = mockSource.VITE_DEV_MOCK_AUTH ?? 'false';
}
if (!process.env.VITE_PLATFORM_IPS) {
  const ipSource =
    process.env.BUILD_PROFILE === 'hostverge'
      ? loadEnvFile('.env.hostverge')
      : loadEnvFile('.env.production');
  if (ipSource.VITE_PLATFORM_IPS) {
    process.env.VITE_PLATFORM_IPS = ipSource.VITE_PLATFORM_IPS;
  }
}

console.log(`OK  VITE_API_BASE_URL=${base} (${source})`);
