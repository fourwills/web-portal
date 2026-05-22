import { useState } from 'react';
import { didService } from '../services/didService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import ErrorBanner from '../components/UI/ErrorBanner';
import { PageError, PageLoading } from '../components/UI/PageState';
import { rowsToColumns } from '../utils/tableColumns';
import { isMockMode } from '../utils/apiHelpers';

const DID_PREF = ['did', 'id', 'state', 'country', 'status', 'rate_type', 'lata', 'is_available'];

export default function DIDs() {
  const [tab, setTab] = useState('mine');
  const [searchState, setSearchState] = useState('');
  const [searchNpa, setSearchNpa] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [ordering, setOrdering] = useState(false);

  const mine = useApi(() => didService.getMyDids({ per_page: 50 }), []);
  const free = useApi(() => didService.getFreeDids({ per_page: 50 }), []);

  const runSearch = async () => {
    setSearchLoading(true);
    setActionError('');
    setSearchResults(null);
    try {
      const result = await didService.searchLocal({
        state: searchState || undefined,
        npa: searchNpa || undefined,
        per_page: 25,
        page: 0,
      });
      setSearchResults(result.items ?? []);
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const orderDid = async (row) => {
    const number = row.did ?? row.number;
    const buy_billing_plan_id = row.buy_billing_plan_id ?? row.client_billing_rule_id;
    if (!number) {
      setActionError('Cannot order: missing DID number on this row.');
      return;
    }
    setOrdering(true);
    setActionError('');
    setActionMsg('');
    try {
      await didService.orderLocal({
        items: [{ number: String(number).replace(/\D/g, ''), buy_billing_plan_id: buy_billing_plan_id ?? undefined }],
      });
      setActionMsg(`Order submitted for ${number}.`);
      mine.refetch();
      free.refetch();
      if (searchResults) runSearch();
    } catch (err) {
      setActionError(err.response?.data?.error?.message ?? err.message ?? 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const buyColumn = {
    key: '_buy',
    label: '',
    render: (row) => (
      <button
        type="button"
        disabled={ordering}
        onClick={() => orderDid(row)}
        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
      >
        Buy
      </button>
    ),
  };

  const renderTable = (query, emptyMsg, showBuy = false) => {
    if (query.loading && !query.data) return <PageLoading />;
    if (query.error) return <PageError message={query.error} onRetry={query.refetch} />;
    const items = query.data?.items ?? [];
    const cols = [...rowsToColumns(items, DID_PREF), ...(showBuy ? [buyColumn] : [])];
    return (
      <DataTable
        columns={cols.length ? cols : [{ key: 'did', label: 'DID' }, ...(showBuy ? [buyColumn] : [])]}
        rows={items}
        emptyMessage={emptyMsg}
      />
    );
  };

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo DID data — buy simulates locally.
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'mine', label: 'My DIDs' },
          { id: 'free', label: 'Free DIDs (buy)' },
          { id: 'search', label: 'Search & order' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-medium transition',
              tab === id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorBanner message={actionError} />
      {actionMsg && <p className="text-sm text-emerald-700">{actionMsg}</p>}

      {tab === 'mine' && renderTable(mine, 'No DIDs on your account yet.')}
      {tab === 'free' && renderTable(free, 'No free DIDs available right now.', true)}

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="text"
              placeholder="State (e.g. DC)"
              value={searchState}
              onChange={(e) => setSearchState(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="NPA / area code"
              value={searchNpa}
              onChange={(e) => setSearchNpa(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={searchLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
          </div>
          {searchResults && (
            <DataTable
              columns={[...rowsToColumns(searchResults, DID_PREF), buyColumn]}
              rows={searchResults}
              emptyMessage="No numbers found for this search."
            />
          )}
        </div>
      )}
    </div>
  );
}
