/** Build and download a CSV file from row objects (client-side). */
export function downloadRowsAsCsv(rows, filename, columns) {
  if (!rows?.length) throw new Error('No data to export.');

  const cols =
    columns ??
    Object.keys(rows[0]).filter((k) => {
      const v = rows[0][k];
      const t = typeof v;
      return t === 'string' || t === 'number' || t === 'boolean';
    });

  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = cols.join(',');
  const lines = rows.map((row) => cols.map((c) => escape(row[c])).join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
