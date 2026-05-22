import { Download } from 'lucide-react';
import { useState } from 'react';

export default function DownloadButton({ label = 'Download CSV', onDownload, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      await onDownload();
    } catch (err) {
      setError(err.response?.data?.error?.message ?? err.message ?? 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <Download size={16} />
        {loading ? 'Downloading…' : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
