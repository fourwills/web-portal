export default function StatCard({ label, value, sub, accent = 'sky' }) {
  const accents = {
    sky: 'border-sky-100 bg-sky-50 text-sky-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    slate: 'border-slate-200 bg-white text-slate-900',
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${accents[accent] ?? accents.slate}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-sm opacity-70">{sub}</p>}
    </div>
  );
}
