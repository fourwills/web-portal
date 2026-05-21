import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';

export function PageLoading({ label = 'Loading data…' }) {
  return (
    <div className="flex justify-center py-16">
      <LoadingSpinner label={label} />
    </div>
  );
}

export function PageError({ message, onRetry }) {
  return (
    <div className="space-y-4">
      <ErrorBanner message={message} />
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
