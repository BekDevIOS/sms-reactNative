import {useCallback, useEffect, useRef, useState} from 'react';
import {ApiClient} from './client';
import {InquiryParams, ListResponse} from './types';
import {maybeLogoutOnAuthError, Tag, useApiClient, useTagSubscription} from './queryClient';

export interface InfiniteListState<T> {
  items: T[];
  total: number;
  isLoading: boolean; // first page loading
  isRefreshing: boolean; // pull-to-refresh
  isLoadingMore: boolean;
  error: unknown;
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Page-based infinite list over an InquiryParams endpoint. Resets to page 1 when
 * `search`/`status` change or when a subscribed tag is invalidated; `loadMore`
 * appends the next page until `total` is reached.
 */
export function useInfiniteList<T extends {_id: string}>(
  fetchPage: (client: ApiClient, params: InquiryParams) => Promise<ListResponse<T>>,
  opts: {
    limit?: number;
    search?: Record<string, string | number | boolean | undefined>;
    status?: string;
    sort?: string;
    tags?: Tag[];
  } = {},
): InfiniteListState<T> {
  const {limit = 20, search, status, sort, tags = []} = opts;
  const client = useApiClient();
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const pageRef = useRef(1);
  const searchKey = JSON.stringify({search, status, sort});

  const load = useCallback(
    async (page: number, mode: 'initial' | 'refresh' | 'more') => {
      if (mode === 'initial') {
        setIsLoading(true);
      }
      if (mode === 'refresh') {
        setIsRefreshing(true);
      }
      if (mode === 'more') {
        setIsLoadingMore(true);
      }
      setError(null);
      try {
        const res = await fetchPage(client, {page, limit, status, sort, search});
        setTotal(res.total);
        setItems(prev => (page === 1 ? res.list : [...prev, ...res.list]));
        pageRef.current = page;
      } catch (e) {
        setError(e);
        await maybeLogoutOnAuthError(e);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, limit, searchKey],
  );

  // (Re)load page 1 on mount and whenever the query key changes.
  useEffect(() => {
    load(1, 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const refresh = useCallback(() => load(1, 'refresh'), [load]);
  const reload = useCallback(() => load(1, 'refresh'), [load]);
  useTagSubscription(tags, reload);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || isRefreshing) {
      return;
    }
    if (items.length >= total) {
      return;
    }
    load(pageRef.current + 1, 'more');
  }, [isLoading, isLoadingMore, isRefreshing, items.length, total, load]);

  return {items, total, isLoading, isRefreshing, isLoadingMore, error, refresh, loadMore};
}
