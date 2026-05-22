import { useEffect, useState } from 'react';
import { extractTrunkHostEntries } from '../../utils/trunkHosts';

const emptyHost = () => ({ ip: '', port: 5060, addr_type: 'ip', fqdn: '' });

export default function EgressIpEditorModal({ open, trunk, busy, onSave, onClose }) {
  const [hosts, setHosts] = useState([emptyHost()]);

  useEffect(() => {
    if (!open || !trunk) return;
    const entries = extractTrunkHostEntries(trunk);
    setHosts(entries.length ? entries.map((e) => ({ ...e, fqdn: e.fqdn ?? '' })) : [emptyHost()]);
  }, [open, trunk]);

  if (!open || !trunk) return null;

  const trunkId = trunk.trunk_id ?? trunk.resource_id;
  const trunkName = trunk.trunk_name ?? trunk.egress_name ?? 'Egress trunk';

  const updateHost = (index, field, value) => {
    setHosts((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const addHost = () => setHosts((prev) => [...prev, emptyHost()]);

  const removeHost = (index) => {
    setHosts((prev) => (prev.length <= 1 ? [emptyHost()] : prev.filter((_, i) => i !== index)));
  };

  const handleSave = () => {
    const valid = hosts.filter((h) => String(h.ip ?? '').trim());
    onSave(trunkId, valid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-slate-900">Edit registered IPs</h3>
        <p className="mt-1 text-sm text-slate-600">
          Trunk: <strong>{trunkName}</strong> — authorized hosts for DID origination.
        </p>

        <div className="mt-4 space-y-3">
          {hosts.map((host, index) => (
            <div
              key={index}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <label className="flex flex-1 min-w-[140px] flex-col gap-1 text-xs font-medium text-slate-600">
                IP address
                <input
                  type="text"
                  value={host.ip ?? ''}
                  onChange={(e) => updateHost(index, 'ip', e.target.value.trim())}
                  placeholder="203.0.113.10"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex w-24 flex-col gap-1 text-xs font-medium text-slate-600">
                Port
                <input
                  type="number"
                  min={1000}
                  max={65535}
                  value={host.port ?? 5060}
                  onChange={(e) => updateHost(index, 'port', Number(e.target.value) || 5060)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              {hosts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHost(index)}
                  className="rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addHost}
          className="mt-3 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          + Add another IP
        </button>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !hosts.some((h) => String(h.ip ?? '').trim())}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save IPs'}
          </button>
        </div>
      </div>
    </div>
  );
}
