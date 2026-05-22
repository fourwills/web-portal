import { useState } from 'react';
import { trunkService } from '../services/trunkService';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/UI/DataTable';
import { PageError, PageLoading } from '../components/UI/PageState';
import { rowsToColumns } from '../utils/tableColumns';
import { isMockMode } from '../utils/apiHelpers';

const INGRESS_PREF = ['resource_id', 'ingress_name', 'display_name', 'is_active', 'rate_table_name', 'call_limit', 'cps_limit', 'status'];
const EGRESS_PREF = ['resource_id', 'egress_name', 'egress_id', 'is_active', 'rate_table_name', 'call_limit', 'cps_limit', 'status'];

export default function Trunks() {
  const [tab, setTab] = useState('ingress');
  const ingress = useApi(() => trunkService.getIngressTrunks({ per_page: 50 }), []);
  const egress = useApi(() => trunkService.getEgressTrunks({ per_page: 50 }), []);

  const active = tab === 'ingress' ? ingress : egress;
  const ingressItems = ingress.data?.items ?? [];
  const egressItems = egress.data?.items ?? [];
  const ingressCols = rowsToColumns(ingressItems, INGRESS_PREF);
  const egressCols = rowsToColumns(egressItems, EGRESS_PREF);

  return (
    <div className="space-y-6">
      {isMockMode() && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Demo trunk data.
        </p>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'ingress', label: 'Ingress trunks' },
          { id: 'egress', label: 'Egress trunks' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'border-b-2 px-4 py-2 text-sm font-medium transition',
              tab === id
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {active.loading && !active.data ? (
        <PageLoading label="Loading trunks…" />
      ) : active.error ? (
        <PageError message={active.error} onRetry={active.refetch} />
      ) : tab === 'ingress' ? (
        <DataTable
          columns={ingressCols.length ? ingressCols : [{ key: 'resource_id', label: 'ID' }]}
          rows={ingressItems}
          emptyMessage="No ingress trunks found."
        />
      ) : (
        <DataTable
          columns={egressCols.length ? egressCols : [{ key: 'resource_id', label: 'ID' }]}
          rows={egressItems}
          emptyMessage="No egress trunks found."
        />
      )}
    </div>
  );
}
