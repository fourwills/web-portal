import { formatDateTime, labelize } from './apiHelpers';

const HIDDEN_KEYS = new Set([
  'password',
  'secret',
  'token',
  'codes',
  'reg_user',
  'host',
  'allowed_sendto_ips',
]);

export function rowsToColumns(rows, preferredKeys = []) {
  if (!rows?.length) return [];

  if (preferredKeys.length) {
    return preferredKeys
      .filter((key) => rows.some((r) => r[key] !== undefined && r[key] !== null))
      .map((key) => ({
        key,
        label: labelize(key),
        render: (r) => formatCell(r[key]),
      }));
  }

  const sample = rows[0];
  return Object.entries(sample)
    .filter(([key, value]) => {
      if (HIDDEN_KEYS.has(key)) return false;
      const t = typeof value;
      return t === 'string' || t === 'number' || t === 'boolean';
    })
    .slice(0, 8)
    .map(([key]) => ({
      key,
      label: labelize(key),
      render: (r) => formatCell(r[key]),
    }));
}

function formatCell(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && /\d{4}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return formatDateTime(value);
  }
  return String(value);
}
