import api from '../config/api';

/**
 * Download a ClientPortal list endpoint as CSV (API supports Accept: text/csv).
 */
export async function downloadApiCsv(path, params, filename) {
  const res = await api.get(path, {
    params,
    headers: { Accept: 'text/csv' },
    responseType: 'blob',
  });

  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
