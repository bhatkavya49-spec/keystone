import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./client";

export function useFetch(path, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled && Boolean(path));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch(path);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (enabled) {
      load();
    }
  }, [load, enabled]);

  return { data, loading, error, reload: load };
}