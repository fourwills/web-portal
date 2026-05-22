import { useMemo, useState } from 'react';
import { didService, normalizeDidNumber } from '../services/didService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import ErrorBanner from '../components/UI/ErrorBanner';
import { PageError, PageLoading } from '../components/UI/PageState';
import { formatMoney, isMockMode } from '../utils/apiHelpers';

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
  { key: 'client_billing_rule_name', label: 'Billing plan' },
  { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
];

const MINE_COLS = [
  { key: 'did', label: 'Number' },
  { key: 'client_billing_rule_name', label: 'Billing plan' },
  { key: 'created_at', label: 'Assigned' },
];

const TOLL_PREFIXES = ['1800', '1888', '1877', '1866', '855', '844', '833'];

function SelectCheckbox({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded border-slate-300" />
      {label}
    </label>
  );
}

export default function DIDs() {
  const [mainTab, setMainTab] = useState('buy');
  const [buyTab, setBuyTab] = useState('free');

  const mine = useApi(() => didService.getMyDids({ per_page: 100 }), []);
  const free = useApi(() => didService.getFreeDids(), []);
  const coverage = useApi(() => didService.getCoverageLocal({ country: 'US' }), []);

  const [searchState, setSearchState] = useState('');
  const [searchNpa, setSearchNpa] = useState('');
  const [searchLata, setSearchLata] = useState('');
  const [searchPattern, setSearchPattern] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [tollPrefix, setTollPrefix] = useState('1800');
  const [tollSuffix, setTollSuffix] = useState('');
  const [tollResults, setTollResults] = useState(null);
  const [tollLoading, setTollLoading] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [ordering, setOrdering] = useState(false);

  const coverageStates = useMemo(() => {
    const items = coverage.data?.items ?? [];
    const states = [...new Set(items.map((i) => i.state).filter(Boolean))].sort();
    return states;
  }, [coverage.data]);

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
      <SelectCheckbox
        label=""
        checked={rows.length > 0 && rows.every((r) => selected.has(normalizeDidNumber(r)))}
        onChange={(e) => selectAllRows(rows, e.target.checked)}
      />
    ),
    render: (row) => (
      <input
        type="checkbox"
        checked={selected.has(normalizeDidNumber(row))}
        onChange={() => toggleSelect(row)}
        className="rounded border-slate-300"
      />
    ),
  });

  const orderSelected = async (mode) => {
    const numbers = [...selected];
    if (!numbers.length) {
      setActionError('Select at least one number to order.');
      return;
    }
    setOrdering(true);
    setActionError('');
    setActionMsg('');
    try {
      if (mode === 'tollfree') await didService.orderTollFree(numbers);
      else await didService.orderLocal(numbers);
      setActionMsg(`Ordered ${numbers.length} number(s) successfully.`);
      setSelected(new Set());
      mine.refetch();
      free.refetch();
      if (searchResults) runLocalSearch();
      if (tollResults) runTollFreeSearch();
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const runLocalSearch = async () => {
    setSearchLoading(true);
    setActionError('');
    setSearchResults(null);
    try {
      const result = await didService.searchLocal({
        state: searchState || undefined,
        npa: searchNpa || undefined,
        lata: searchLata || undefined,
        pattern: searchPattern || undefined,
        per_page: 50,
        page: 0,
      });
      setSearchResults(result.items ?? []);
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const runTollFreeSearch = async () => {
    setTollLoading(true);
    setActionError('');
    setTollResults(null);
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
    } finally {
      setTollLoading(false);
    }
  };

  const renderBuyToolbar = (orderMode) => (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={ordering || selected.size === 0}
        onClick={() => orderSelected(orderMode)}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {ordering ? 'Ordering…' : `Order selected (${selected.size})`}
      </button>
      {selected.size > 0 && (
        <button
          type="button"
          onClick={() => setSelected(new Set())}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Clear selection
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo DID data.
        </p>
      )}

      <p className="text-sm text-slate-600">
        View your numbers or buy new DIDs from the available pool, search, or toll-free inventory (same as the classic
        client portal Buy DID screen).
      </p>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {[
          { id: 'buy', label: 'Buy DIDs' },
          { id: 'mine', label: 'My DIDs' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMainTab(id)}
            className={[
              'border-b-2 px-4 py-2 text-sm font-medium transition',
              mainTab === id
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorBanner message={actionError} />
      {actionMsg && <p className="text-sm text-emerald-700">{actionMsg}</p>}

      {mainTab === 'mine' && (
        <section>
          {mine.loading && !mine.data ? (
            <PageLoading label="Loading your DIDs…" />
          ) : mine.error ? (
            <PageError message={mine.error} onRetry={mine.refetch} />
          ) : (
            <DataTable
              columns={MINE_COLS}
              rows={mine.data?.items ?? []}
              emptyMessage="No DIDs on your account yet. Use Buy DIDs to order numbers."
            />
          )}
        </section>
      )}

      {mainTab === 'buy' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100">
            {[
              { id: 'free', label: 'Available to buy' },
              { id: 'search', label: 'Search local' },
              { id: 'tollfree', label: 'Toll-free' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setBuyTab(id)}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  buyTab === id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {renderBuyToolbar(buyTab === 'tollfree' ? 'tollfree' : 'local')}

          {buyTab === 'free' && (
            <>
              {free.loading && !free.data ? (
                <PageLoading label="Loading available DIDs…" />
              ) : free.error ? (
                <PageError message={free.error} onRetry={free.refetch} />
              ) : (
                <>
                  <p className="mb-3 text-sm text-slate-500">
                    Numbers assigned to your account pool with no end date. If this list is empty, use Search local or
                    Toll-free below.
                  </p>
                  <DataTable
                    columns={[buyColumn(free.data?.items ?? []), ...FREE_COLS]}
                    rows={free.data?.items ?? []}
                    emptyMessage="No free DIDs in your pool right now. Try Search local or Toll-free."
                  />
                </>
              )}
            </>
          )}

          {buyTab === 'search' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">State</label>
                  <select
                    value={searchState}
                    onChange={(e) => setSearchState(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Any</option>
                    {coverageStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">NPA</label>
                  <input
                    type="text"
                    placeholder="203"
                    value={searchNpa}
                    onChange={(e) => setSearchNpa(e.target.value)}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">LATA</label>
                  <input
                    type="text"
                    placeholder="LATA"
                    value={searchLata}
                    onChange={(e) => setSearchLata(e.target.value)}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Number pattern (10 digits)</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    maxLength={10}
                    value={searchPattern}
                    onChange={(e) => setSearchPattern(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={runLocalSearch}
                    disabled={searchLoading}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {searchLoading ? 'Searching…' : 'Search'}
                  </button>
                </div>
              </div>
              {searchResults && (
                <DataTable
                  columns={[buyColumn(searchResults), ...SEARCH_COLS]}
                  rows={searchResults}
                  emptyMessage="No numbers found. Try another state or NPA."
                />
              )}
            </div>
          )}

          {buyTab === 'tollfree' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Prefix</label>
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
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Suffix (optional)</label>
                  <input
                    type="text"
                    value={tollSuffix}
                    onChange={(e) => setTollSuffix(e.target.value.replace(/\D/g, ''))}
                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={runTollFreeSearch}
                    disabled={tollLoading}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {tollLoading ? 'Searching…' : 'Search toll-free'}
                  </button>
                </div>
              </div>
              {tollResults && (
                <DataTable
                  columns={[buyColumn(tollResults), ...SEARCH_COLS]}
                  rows={tollResults}
                  emptyMessage="No toll-free numbers found for this search."
                />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
