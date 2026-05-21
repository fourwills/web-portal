export function isMockMode() {
  return (
    import.meta.env.VITE_DEV_MOCK_AUTH === 'true' &&
    localStorage.getItem('auth_token') === 'dev-mock-token'
  );
}

export function unwrapPayload(data) {
  if (data == null) return null;
  if (data.success === false) throw new Error(data.error?.message ?? 'Request failed');
  if (data.payload !== undefined) return data.payload;
  return data;
}

export function unwrapList(data) {
  const payload = unwrapPayload(data);
  if (Array.isArray(payload)) return { items: payload, total: payload.length, page: 0, per_page: payload.length };
  if (payload?.items) {
    return {
      items: payload.items,
      total: payload.total ?? payload.items.length,
      page: payload.page ?? 0,
      per_page: payload.per_page ?? payload.items.length,
    };
  }
  return { items: [], total: 0, page: 0, per_page: 0 };
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMoney(value, currency = 'USD') {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
}

export function labelize(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function pickDisplayFields(obj, exclude = []) {
  if (!obj || typeof obj !== 'object') return [];
  const skip = new Set([
    'password',
    'secret',
    'token',
    ...exclude,
  ]);
  return Object.entries(obj).filter(([k, v]) => {
    if (skip.has(k) || k.endsWith('_id') && typeof v === 'number') return false;
    const t = typeof v;
    return t === 'string' || t === 'number' || t === 'boolean';
  });
}
