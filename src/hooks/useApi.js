import { useCallback, useEffect, useState } from 'react';

export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetcher()
      .then((result) => {
        setData(result);
        return result;
      })
      .catch((err) => {
        const message =
          err.response?.data?.error?.message ??
          err.message ??
          'Failed to load data';
        setError(message);
        throw err;
      })
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => {
    refetch().catch(() => {});
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
