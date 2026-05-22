const base = process.env.VITE_API_BASE_URL;
if (!base?.trim()) {
  console.error('ERROR: VITE_API_BASE_URL is required for build.');
  process.exit(1);
}
if (base.includes('auth/login')) {
  console.error('ERROR: VITE_API_BASE_URL must not include /auth/login');
  process.exit(1);
}
console.log('OK  VITE_API_BASE_URL=', base.trim());
