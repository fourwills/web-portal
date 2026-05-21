import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center gap-2 text-slate-600" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-sky-600" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
