import { useEffect, useMemo, useRef, useState } from "react";

const queryCache = new Map();

const getKeyString = (queryKey) => {
  if (Array.isArray(queryKey)) return JSON.stringify(queryKey);
  return String(queryKey);
};

const ensureEntry = (keyString) => {
  const existing = queryCache.get(keyString);
  if (existing) return existing;
  const entry = {
    data: undefined,
    error: null,
    status: "idle",
    updatedAt: 0,
    promise: null,
  };
  queryCache.set(keyString, entry);
  return entry;
};

export const useQuery = ({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 0,
  refetchInterval = 0,
  initialData,
}) => {
  const keyString = useMemo(() => getKeyString(queryKey), [queryKey]);
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const [state, setState] = useState(() => {
    const entry = ensureEntry(keyString);
    if (entry.status === "success" || entry.status === "error") {
      return {
        data: entry.data,
        error: entry.error,
        isLoading: entry.status === "loading",
        isError: entry.status === "error",
        isSuccess: entry.status === "success",
      };
    }
    if (initialData !== undefined && entry.status === "idle") {
      entry.data = initialData;
      entry.status = "success";
      entry.updatedAt = Date.now();
    }
    return {
      data: entry.data,
      error: entry.error,
      isLoading: enabled && entry.status !== "success",
      isError: entry.status === "error",
      isSuccess: entry.status === "success",
    };
  });

  const fetchRef = useRef(null);

  const refetch = async () => {
    const entry = ensureEntry(keyString);
    if (entry.promise) return entry.promise;

    entry.status = "loading";
    entry.error = null;
    setState((s) => ({ ...s, isLoading: true, isError: false }));

    const controller = new AbortController();
    fetchRef.current = controller;

    const run = Promise.resolve()
      .then(() => queryFnRef.current({ signal: controller.signal }))
      .then((data) => {
        entry.data = data;
        entry.error = null;
        entry.status = "success";
        entry.updatedAt = Date.now();
        return data;
      })
      .catch((err) => {
        if (controller.signal.aborted) return entry.data;
        entry.error = err;
        entry.status = "error";
        throw err;
      })
      .finally(() => {
        entry.promise = null;
      });

    entry.promise = run;

    try {
      const data = await run;
      setState({
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
      return data;
    } catch (err) {
      setState({
        data: entry.data,
        error: err,
        isLoading: false,
        isError: true,
        isSuccess: false,
      });
      throw err;
    }
  };

  useEffect(() => {
    if (!enabled) return;
    const entry = ensureEntry(keyString);
    const isFresh =
      entry.status === "success" && Date.now() - entry.updatedAt < staleTime;
    if (isFresh) {
      setState({
        data: entry.data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
      return;
    }
    refetch().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, keyString, staleTime]);

  useEffect(() => {
    if (!enabled) return;
    if (!refetchInterval || refetchInterval < 1000) return;
    const id = window.setInterval(() => {
      refetch().catch(() => {});
    }, refetchInterval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, keyString, refetchInterval]);

  useEffect(() => {
    return () => {
      if (fetchRef.current) fetchRef.current.abort();
    };
  }, []);

  return { ...state, refetch };
};

