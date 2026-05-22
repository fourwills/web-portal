import { useState } from 'react';
import { accountService } from '../services/accountService';
import { useApi } from '../hooks/useApi';
import { PageError, PageLoading } from '../components/UI/PageState';
import ErrorBanner from '../components/UI/ErrorBanner';
import { isMockMode, labelize, pickDisplayFields } from '../utils/apiHelpers';
import NetworkIpsSection from '../components/Account/NetworkIpsSection';

const EDITABLE_KEYS = new Set([
  'client_name',
  'main_email',
  'phone',
  'address',
  'city',
  'state',
  'zip',
  'country',
  'company',
]);

export default function Account() {
  const { data: profile, loading, error, refetch } = useApi(() => accountService.getProfile(), []);
  const [form, setForm] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [keyLabel, setKeyLabel] = useState('');

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={refetch} />;
  if (!profile) return <PageError message="No account data returned." onRetry={refetch} />;

  const fields = pickDisplayFields(profile);
  const editForm = form ?? Object.fromEntries(
    fields.filter(([k]) => EDITABLE_KEYS.has(k)).map(([k, v]) => [k, v ?? '']),
  );

  const handleChange = (key, value) => {
    setForm({ ...editForm, [key]: value });
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await accountService.updateProfile(editForm);
      setSaveSuccess(true);
      setForm(null);
      refetch();
    } catch (err) {
      setSaveError(err.response?.data?.error?.message ?? err.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateApiKey = async () => {
    setApiKeyLoading(true);
    setApiKeyMsg('');
    try {
      const result = await accountService.createApiKey({ label: keyLabel || undefined });
      const key = result?.api_key ?? result?.key ?? JSON.stringify(result);
      setApiKeyMsg(`API key created: ${key}`);
      setKeyLabel('');
    } catch (err) {
      setApiKeyMsg(err.response?.data?.error?.message ?? err.message ?? 'Failed to create API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo mode — profile save updates locally only.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Account details</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {labelize(key)}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...EDITABLE_KEYS].filter((k) => fields.some(([fk]) => fk === k) || editForm[k] !== undefined).map((key) => (
            <div key={key}>
              <label htmlFor={key} className="mb-1 block text-sm font-medium text-slate-700">
                {labelize(key)}
              </label>
              <input
                id={key}
                type={key.includes('email') ? 'email' : 'text'}
                value={editForm[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          ))}
          {![...EDITABLE_KEYS].some((k) => fields.some(([fk]) => fk === k)) && (
            <p className="text-sm text-slate-500 sm:col-span-2">
              No editable fields detected in API response. Display-only view above.
            </p>
          )}
        </div>
        <ErrorBanner message={saveError} />
        {saveSuccess && (
          <p className="mt-3 text-sm text-emerald-600">Profile saved successfully.</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <NetworkIpsSection />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">API keys</h2>
        <p className="mb-4 text-sm text-slate-500">
          Create a new API key for integrations. Store it securely — it may only be shown once.
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Label (optional)"
            value={keyLabel}
            onChange={(e) => setKeyLabel(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <button
            type="button"
            disabled={apiKeyLoading}
            onClick={handleCreateApiKey}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {apiKeyLoading ? 'Creating…' : 'Create API key'}
          </button>
        </div>
        {apiKeyMsg && (
          <p className="mt-3 break-all rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700">
            {apiKeyMsg}
          </p>
        )}
      </div>
    </div>
  );
}
