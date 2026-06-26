import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  deleteOfflineQueueEntry,
  getActiveOfflineQueueEntries,
  getOfflineQueueSummary,
  OFFLINE_QUEUE_CHANGED_EVENT,
  type OfflineQueueEntry,
  type OfflineQueueSummary
} from '../lib/offlineQueue';
import { syncOfflineQueue, type SyncQueueResult } from '../lib/syncQueue';
import { PBM_DATA_QUERY_KEY } from './usePbmData';

const emptySummary: OfflineQueueSummary = {
  pendingCount: 0,
  syncingCount: 0,
  errorCount: 0,
  totalActive: 0,
  lastSyncAt: null
};

function browserOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function useOfflineQueue({ autoSync = false }: { autoSync?: boolean } = {}) {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(browserOnline);
  const [summary, setSummary] = useState<OfflineQueueSummary>(emptySummary);
  const [entries, setEntries] = useState<OfflineQueueEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncQueueResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextSummary, nextEntries] = await Promise.all([getOfflineQueueSummary(), getActiveOfflineQueueEntries()]);
      setSummary(nextSummary);
      setEntries(nextEntries);
    } catch {
      setSummary(emptySummary);
      setEntries([]);
    }
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue();
      setLastResult(result);
      if (result.synced > 0) {
        await queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY });
      }
      await refresh();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient, refresh]);

  const discardAction = useCallback(async (id: string) => {
    await deleteOfflineQueueEntry(id);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    const onOnline = () => {
      setIsOnline(true);
      if (autoSync) void syncNow();
    };
    const onOffline = () => setIsOnline(false);
    const onQueueChanged = () => void refresh();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, onQueueChanged);
    if (autoSync && browserOnline()) void syncNow();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, onQueueChanged);
    };
  }, [autoSync, refresh, syncNow]);

  return {
    isOnline,
    summary,
    entries,
    isSyncing,
    lastResult,
    syncNow,
    discardAction,
    refresh
  };
}
