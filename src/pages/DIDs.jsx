import { useMemo, useState } from 'react';
import { didService, normalizeDidNumber } from '../services/didService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import ErrorBanner from '../components/UI/ErrorBanner';
import { PageError, PageLoading } from '../components/UI/PageState';
import { formatMoney, isMockMode } from '../utils/apiHelpers';
import { DID_COUNTRIES, US_STATES } from '../utils/usStates';

const SEARCH_COLS = [
  { key: 'number', label: 'Number', render: (r) => r.number ?? r.did ?? '—' },
  { key: 'state', label: 'State' },
  { key: 'npa', label: 'NPA' },
  { key: 'lata', label: 'LATA' },
  { key: 'mrc', label: 'MRC', render: (r) => (r.mrc != null ? formatMoney(r.mrc) : '—') },
  { key: 'nrc', label: 'NRC', render: (r) => (r.nrc != null ? formatMoney(r.nrc) : '—') },
];

const FREE_COLS = [
  { key: 'did', label: 'Number', render: (r) => r.did ?? r.number ?? '—' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'lata', label: 'LATA' },
  { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
];

const TOLL_PREFIXES = ['1800', '1888', '1877', '1866', '1855', '1844', '1833'];

const PAGE_TABS = [
  { id: 'mine', label: 'My DIDs' },
  { id: 'free', label: 'Available' },
  { id: 'search', label: 'Search local' },
  { id: 'tollfree', label: 'Toll-free' },
];

export default function DIDs() {
  const [tab, setTab] = useState('mine');

  const mine = useApi(() => didService.getMyDids({ per_page: 100 }), []);
  const free = useApi(() => didService.getFreeDids(), []);

  const [searchCountry, setSearchCountry] = useState('US');
  const [searchState, setSearchState] = useState('');
  const [searchNpa, setSearchNpa] = useState('');
  const [searchLata, setSearchLata] = useState('');
  const [searchPattern, setSearchPattern] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  const [tollPrefix, setTollPrefix] = useState('1800');
  const [tollSuffix, setTollSuffix] = useState('');
  const [tollResults, setTollResults] = useState(null);
  const [tollLoading, setTollLoading] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [releasing, setReleasing] = useState(false);

  const freeItems = free.data?.items ?? [];
  const mineItems = mine.data?.items ?? [];

  const mineColumns = useMemo(
    () => [
      { key: 'did', label: 'Number', render: (r) => r.did ?? r.number ?? '—' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' },
      {
        key: 'created_at',
        label: 'Assigned',
        render: (r) => r.created_at ?? r.assigned_date ?? '—',
      },
      {
        key: '_release',
        label: 'Action',
        render: (row) => (
          <button
            type="button"
            onClick={() => setReleaseTarget(row)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Release
          </button>
        ),
      },
    ],
    [],
  );

  const handleReleaseConfirm = async () => {
    if (!releaseTarget) return;
    setReleasing(true);
    setActionError('');
    setActionMsg('');
    const display = releaseTarget.did ?? releaseTarget.number ?? normalizeDidNumber(releaseTarget);
    try {
      const result = await didService.releaseOrDisableDid(releaseTarget);
      setActionMsg(
        result.method === 'disable'
          ? `${display} has been removed from your account.`
          : `${display} has been released.`,
      );
      setReleaseTarget(null);
      mine.refetch();
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Release failed');
    } finally {
      setReleasing(false);
    }
  };

  const toggleSelect = (row) => {
    const num = normalizeDidNumber(row);
    if (!num) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const selectAllRows = (rows, on) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of rows) {
        const num = normalizeDidNumber(row);
        if (!num) continue;
        if (on) next.add(num);
        else next.delete(num);
      }
      return next;
    });
  };

  const buyColumn = (rows) => ({
    key: '_buy',
    label: (
      <input
        type="checkbox"
        aria-label="Select all"
        checked={rows.length > 0 && rows.every((r) => selected.has(normalizeDidNumber(r)))}
        onChange={(e) => selectAllRows(rows, e.target.checked)}
        className="rounded border-slate-300"
      />
    ),
    render: (row) => (
      <input
        type="checkbox"
        aria-label="Select"
        checked={selected.has(normalizeDidNumber(row))}
        onChange={() => toggleSelect(row)}
        className="rounded border-slate-300"
      />
    ),
  });

  const visibleOrderRows = useMemo(() => {
    if (tab === 'free') return freeItems;
    if (tab === 'search') return searchResults ?? [];
    if (tab === 'tollfree') return tollResults ?? [];
    return [];
  }, [tab, freeItems, searchResults, tollResults]);

  const orderSelected = async () => {
    const numbers = [...selected];
    if (!numbers.length) {
      setActionError('Select at least one number to order.');
      return;
    }
    setOrdering(true);
    setActionError('');
    setActionMsg('');
    try {
      if (tab === 'tollfree') await didService.orderTollFree(numbers);
      else await didService.orderLocal(numbers);
      setActionMsg(`Ordered ${numbers.length} number(s) successfully.`);
      setSelected(new Set());
      mine.refetch();
      free.refetch();
      if (searchResults) await runLocalSearch();
      if (tollResults) await runTollFreeSearch();
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const runLocalSearch = async () => {
    setSearchLoading(true);
    setActionError('');
    setActionMsg('');
    try {
      const result = await didService.searchLocal({
        country: searchCountry || undefined,
        state: searchState || undefined,
        npa: searchNpa || undefined,
        lata: searchLata || undefined,
        pattern: searchPattern || undefined,
        per_page: 50,
        page: 0,
      });
      setSearchResults(result.items ?? []);
      setSearchTotal(result.total ?? result.items?.length ?? 0);
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Search failed');
      setSearchResults([]);
      setSearchTotal(0);
    } finally {
      setSearchLoading(false);
    }
  };

  const runTollFreeSearch = async () => {
    setTollLoading(true);
    setActionError('');
    setActionMsg('');
    try {
      const result = await didService.searchTollFree({
        prefix: tollPrefix,
        suffix: tollSuffix,
        per_page: 50,
        page: 0,
      });
      setTollResults(result.items ?? []);
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Toll-free search failed');
      setTollResults([]);
    } finally {
      setTollLoading(false);
    }
  };

  const noInventoryHint = (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
      <p className="font-medium text-slate-900">No numbers found.</p>
      <p className="mt-1">Try another filter, or contact us if you need numbers added to your account.</p>
    </div>
  );

  const renderOrderToolbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-slate-600">
        {visibleOrderRows.length > 0
          ? `${visibleRowsForBuy.length} number${visibleRowsForBuy.length === 1 ? '' : 's'} listed${selected.size ? ` — ${selected.size} selected` : ''}`
          : 'No numbers listed yet.'}
      </div>
      <div className="flex items-center gap-3">
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Clear ({selected.size})
          </button>
        )}
        <button
          type="button"
          disabled={ordering || selected.size === 0}
          onClick={orderSelected}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {ordering ? 'Ordering…' : `Order ${selected.size || ''} selected`.trim()}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo DID data.
        </p>
      )}

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-600">
          View your numbers, search inventory, or release numbers you are no longer using.
        </p>
        <button
          type="button"
          onClick={() => {
            mine.refetch();
            free.refetch();
            setActionMsg('Refreshed.');
            setTimeout(() => setActionMsg(''), 2000);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {PAGE_TABS.map(({ id, label }) => {
          const count =
            id === 'mine' && mineItems.length
              ? ` (${mineItems.length})`
              : id === 'free' && freeItems.length
                ? ` (${freeItems.length})`
                : '';
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setSelected(new Set());
                setActionError('');
                setActionMsg('');
              }}
              className={[
                'border-b-2 px-4 py-2 text-sm font-medium transition',
                tab === id
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {label}
              {count}
            </button>
          );
        })}
      </div>

      <ErrorBanner message={actionError} />
      {actionMsg && <p className="text-sm text-emerald-700">{actionMsg}</p>}

      <ConfirmDialog
        open={Boolean(releaseTarget)}
        title="Release this number?"
        message={
          releaseTarget
            ? `Release ${releaseTarget.did ?? releaseTarget.number ?? 'this number'}? It will be removed from your account.`
            : ''
        }
        confirmLabel="Release"
        danger
        busy={releasing}
        onConfirm={handleReleaseConfirm}
        onCancel={() => !releasing && setReleaseTarget(null)}
      />

      {tab === 'mine' && (
        <section className="space-y-3">
          {mine.loading && !mine.data ? (
            <PageLoading label="Loading your DIDs…" />
          ) : mine.error ? (
            <PageError message={mine.error} onRetry={mine.refetch} />
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Use <strong>Release</strong> on numbers you are no longer using.
              </p>
              <DataTable
                columns={mineColumns}
                rows={mineItems}
                emptyMessage="No DIDs on your account yet."
              />
            </>
          )}
        </section>
      )}

      {tab === 'free' && (
        <section className="space-y-4">
          {renderOrderToolbar()}
          {free.loading && !free.data ? (
            <PageLoading label="Loading available DIDs…" />
          ) : free.error ? (
            <PageError message={free.error} onRetry={free.refetch} />
          ) : (
            <>
              <p className="text-sm text-slate-500">Numbers currently available for your account.</p>
              {freeItems.length === 0 && noInventoryHint}
              <DataTable
                columns={[buyColumn(freeItems), ...FREE_COLS]}
                rows={freeItems}
                emptyMessage="No numbers available right now."
              />
            </>
          )}
        </section>
      )}

      {tab === 'search' && (
        <section className="space-y-4">
          {renderOrderToolbar()}
          <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Field label="Country">
                  <select
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {DID_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="State">
                  <select
                    value={searchState}
                    onChange={(e) => setSearchState(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Any</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="NPA">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="203"
                    maxLength={3}
                    value={searchNpa}
                    onChange={(e) => setSearchNpa(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="LATA">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Optional"
                    value={searchLata}
                    onChange={(e) => setSearchLata(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Pattern (10 digits)">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Optional"
                    maxLength={10}
                    value={searchPattern}
                    onChange={(e) => setSearchPattern(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <button
                  type="button"
                  onClick={runLocalSearch}
                  disabled={searchLoading}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {searchLoading ? 'Searching…' : 'Search'}
                </button>
                {searchResults && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchResults(null);
                      setSearchTotal(0);
                      setSelected(new Set());
                    }}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    Reset
                  </button>
                )}
              </div>
              {searchResults !== null && (
                <>
                  {searchResults.length === 0 && noInventoryHint}
                  <DataTable
                    columns={[buyColumn(searchResults), ...SEARCH_COLS]}
                    rows={searchResults}
                    emptyMessage="No numbers found for this filter."
                  />
                  {searchTotal > searchResults.length && (
                    <p className="text-xs text-slate-500">
                      Showing {searchResults.length} of {searchTotal}. Narrow filters to see more.
                    </p>
                  )}
                </>
              )}
          </div>
        </section>
      )}

      {tab === 'tollfree' && (
        <section className="space-y-4">
          {renderOrderToolbar()}
          <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Field label="Prefix">
                  <select
                    value={tollPrefix}
                    onChange={(e) => setTollPrefix(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {TOLL_PREFIXES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Suffix (optional)">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tollSuffix}
                    onChange={(e) => setTollSuffix(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="555 etc"
                  />
                </Field>
                <button
                  type="button"
                  onClick={runTollFreeSearch}
                  disabled={tollLoading}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {tollLoading ? 'Searching…' : 'Search toll-free'}
                </button>
                {tollResults && (
                  <button
                    type="button"
                    onClick={() => {
                      setTollResults(null);
                      setSelected(new Set());
                    }}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    Reset
                  </button>
                )}
              </div>
              {tollResults !== null && (
                <>
                  {tollResults.length === 0 && noInventoryHint}
                  <DataTable
                    columns={[buyColumn(tollResults), ...SEARCH_COLS]}
                    rows={tollResults}
                    emptyMessage="No toll-free numbers found."
                  />
                </>
              )}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}
