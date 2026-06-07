import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {ApiClient, UnauthorizedError} from './client';
import {useAppState} from '../state/AppState';

/** Cache tags, mirroring the web frontend's RTK Query tagTypes. */
export type Tag =
  | 'Template'
  | 'Contact'
  | 'ContactGroup'
  | 'AutoReply'
  | 'Campaign'
  | 'SmsLog'
  | 'Subscription'
  | 'Plan'
  | 'Stats'
  | 'Member'
  | 'Device';

type Listener = () => void;

interface ApiContextValue {
  client: ApiClient;
  /** Subscribe to invalidation of any of the given tags. Returns an unsubscribe fn. */
  subscribe: (tags: Tag[], fn: Listener) => () => void;
  /** Fire invalidation for the given tags — re-runs matching queries. */
  invalidate: (tags: Tag[]) => void;
}

const Ctx = createContext<ApiContextValue | undefined>(undefined);

/**
 * Provides a member-token ApiClient + a tiny tag-based invalidation bus to the UI.
 * Re-creates the client whenever the logged-in member (token/baseUrl) changes.
 * A 401 on any UI call logs the member out (mirrors the web `useUnauthorizedRedirect`).
 */
export function ApiProvider({children}: {children: React.ReactNode}) {
  const {member, logout} = useAppState();
  const listeners = useRef<Map<Listener, Set<Tag>>>(new Map());

  const client = useMemo(
    () => new ApiClient(member?.baseUrl ?? '', member?.memberToken ?? null),
    [member?.baseUrl, member?.memberToken],
  );

  const subscribe = useCallback((tags: Tag[], fn: Listener) => {
    listeners.current.set(fn, new Set(tags));
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const invalidate = useCallback((tags: Tag[]) => {
    for (const [fn, fnTags] of listeners.current.entries()) {
      if (tags.some(t => fnTags.has(t))) {
        fn();
      }
    }
  }, []);

  const value = useMemo<ApiContextValue>(
    () => ({client, subscribe, invalidate}),
    [client, subscribe, invalidate],
  );

  // Expose logout to the query hooks for 401 handling without prop drilling.
  logoutRef.current = logout;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Module-level ref so query/mutation hooks can trigger logout on 401.
const logoutRef: {current: (() => Promise<void>) | null} = {current: null};

function useApi(): ApiContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return ctx;
}

export function useApiClient(): ApiClient {
  return useApi().client;
}

/** Subscribe to tag invalidation (for custom data hooks like useInfiniteList). */
export function useTagSubscription(tags: Tag[], cb: () => void): void {
  const {subscribe} = useApi();
  useEffect(() => {
    if (!tags.length) {
      return;
    }
    return subscribe(tags, cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, cb, JSON.stringify(tags)]);
}

/** Trigger tag invalidation imperatively. */
export function useInvalidate(): (tags: Tag[]) => void {
  return useApi().invalidate;
}

export async function maybeLogoutOnAuthError(e: unknown): Promise<void> {
  await handleAuthError(e);
}

async function handleAuthError(e: unknown): Promise<void> {
  if (e instanceof UnauthorizedError && logoutRef.current) {
    await logoutRef.current();
  }
}

export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Runs `fetcher` on mount, whenever `deps` change, and whenever any of `tags`
 * is invalidated. `enabled: false` skips the fetch (e.g. waiting on an id).
 */
export function useQuery<T>(
  fetcher: (client: ApiClient) => Promise<T>,
  opts: {deps?: unknown[]; tags?: Tag[]; enabled?: boolean} = {},
): QueryResult<T> {
  const {deps = [], tags = [], enabled = true} = opts;
  const {client, subscribe} = useApi();
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refetch = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetcher(client)
      .then(res => {
        if (!cancelled && mounted.current) {
          setData(res);
          setError(null);
        }
      })
      .catch(async e => {
        if (!cancelled && mounted.current) {
          setError(e);
        }
        await handleAuthError(e);
      })
      .finally(() => {
        if (!cancelled && mounted.current) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, enabled, nonce, ...deps]);

  // Re-run when a matching tag is invalidated.
  useEffect(() => {
    if (!tags.length) {
      return;
    }
    return subscribe(tags, refetch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, refetch, JSON.stringify(tags)]);

  return {data, isLoading, isError: error != null, error, refetch};
}

export interface MutationResult<TArgs, TData> {
  mutate: (args: TArgs) => Promise<TData>;
  isLoading: boolean;
  error: unknown;
}

/** A mutation that invalidates the listed tags on success. */
export function useMutation<TArgs, TData>(
  fn: (client: ApiClient, args: TArgs) => Promise<TData>,
  opts: {invalidates?: Tag[]} = {},
): MutationResult<TArgs, TData> {
  const {client, invalidate} = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(
    async (args: TArgs) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fn(client, args);
        if (opts.invalidates?.length) {
          invalidate(opts.invalidates);
        }
        return res;
      } catch (e) {
        setError(e);
        await handleAuthError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, invalidate, fn],
  );

  return {mutate, isLoading, error};
}
