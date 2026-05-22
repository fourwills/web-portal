import fs from 'fs';
import path from 'path';

export function loadEnvFile(filename) {
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

export function applyEnvFile(filename, { overwrite = false } = {}) {
  const vars = loadEnvFile(filename);
  for (const [key, value] of Object.entries(vars)) {
    if (overwrite || !process.env[key]) {
      process.env[key] = value;
    }
  }
  return vars;
}
