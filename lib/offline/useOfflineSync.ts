"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isOnline as checkIsOnline,
  getSyncQueue,
  processSyncQueue,
  initOfflineSyncEngine,
  SYNC_EVENTS,
  SyncStatus,
} from "./syncManager";

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
    error: null,
  });

  const refreshStatus = useCallback(async () => {
    if (typeof window === "undefined") return;
    const queue = await getSyncQueue();
    setStatus((prev) => ({
      ...prev,
      isOnline: checkIsOnline(),
      pendingCount: queue.length,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize global sync engine listeners
    const cleanupEngine = initOfflineSyncEngine();

    // Initial status read
    refreshStatus();

    const handleStatusChanged = (e: Event) => {
      const detail = (e as CustomEvent<Partial<SyncStatus>>).detail;
      if (detail) {
        setStatus((prev) => ({ ...prev, ...detail }));
      } else {
        refreshStatus();
      }
    };

    const handleSyncComplete = () => {
      refreshStatus();
    };

    window.addEventListener(SYNC_EVENTS.STATUS_CHANGED, handleStatusChanged);
    window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncComplete);

    return () => {
      cleanupEngine();
      window.removeEventListener(SYNC_EVENTS.STATUS_CHANGED, handleStatusChanged);
      window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncComplete);
    };
  }, [refreshStatus]);

  const triggerSync = useCallback(async () => {
    return await processSyncQueue();
  }, []);

  return {
    ...status,
    triggerSync,
    refreshStatus,
  };
}

