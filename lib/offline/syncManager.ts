"use client";

import {
  getLocalItem,
  setLocalItem,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  QueuedMutation,
  LocalCycle,
  LocalLog,
  LocalSettings,
  LocalProfile,
} from "./db";

export {
  getSyncQueue,
  addToSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  getLocalItem,
  setLocalItem,
};
export type { QueuedMutation, LocalCycle, LocalLog, LocalSettings, LocalProfile };

// Event names for cross-component reactive updates
export const SYNC_EVENTS = {
  STATUS_CHANGED: "ricils:sync-status-changed",
  DATA_UPDATED: "ricils:data-updated",
  SYNC_COMPLETED: "ricils:sync-completed",
} as const;

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  error: string | null;
}

let syncInProgress = false;

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function notifySyncStatus(statusPartial?: Partial<SyncStatus>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SYNC_EVENTS.STATUS_CHANGED, {
      detail: statusPartial,
    })
  );
}

export function notifyDataUpdated(source?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SYNC_EVENTS.DATA_UPDATED, {
      detail: { source, timestamp: Date.now() },
    })
  );
}

/* ==========================================================================
   LOCAL DATA CACHE GETTERS & SETTERS
   ========================================================================== */

export async function getCachedCycles(): Promise<LocalCycle[]> {
  const list = await getLocalItem<LocalCycle[]>("cycles");
  return list || [];
}

export async function setCachedCycles(cycles: LocalCycle[]): Promise<void> {
  await setLocalItem("cycles", cycles);
}

export async function getCachedLogs(): Promise<LocalLog[]> {
  const logs = await getLocalItem<LocalLog[]>("daily_logs");
  return logs || [];
}

export async function getCachedLogByDate(date: string): Promise<LocalLog | null> {
  const logs = await getCachedLogs();
  return logs.find((l) => l.date === date) || null;
}

export async function setCachedLogs(logs: LocalLog[]): Promise<void> {
  await setLocalItem("daily_logs", logs);
}

export async function getCachedSettings(): Promise<LocalSettings | null> {
  return await getLocalItem<LocalSettings>("settings");
}

export async function setCachedSettings(settings: LocalSettings): Promise<void> {
  await setLocalItem("settings", settings);
}

export async function getCachedProfile(): Promise<LocalProfile | null> {
  return await getLocalItem<LocalProfile>("profile");
}

export async function setCachedProfile(profile: LocalProfile): Promise<void> {
  await setLocalItem("profile", profile);
}

/* ==========================================================================
   INITIAL CACHE HYDRATION (Called by client views when receiving server data)
   ========================================================================== */

export async function hydrateLocalCache(data: {
  cycles?: LocalCycle[];
  logs?: LocalLog[];
  settings?: LocalSettings;
  profile?: LocalProfile;
}): Promise<void> {
  if (data.cycles) {
    const existing = await getCachedCycles();
    // Retain any pending local-only cycles not yet saved on server
    const pendingLocalCycles = existing.filter((c) => c.isLocalOnly);
    const combined = [...pendingLocalCycles, ...data.cycles.filter((c) => !c.isLocalOnly)];
    await setCachedCycles(combined);
  }
  if (data.logs) {
    const existing = await getCachedLogs();
    const pendingLogs = existing.filter((l) => l.isLocalOnly);
    const combined = [...pendingLogs, ...data.logs.filter((l) => !l.isLocalOnly)];
    await setCachedLogs(combined);
  }
  if (data.settings) {
    await setCachedSettings(data.settings);
  }
  if (data.profile) {
    await setCachedProfile(data.profile);
  }
}

/* ==========================================================================
   OFFLINE-FIRST MUTATIONS
   ========================================================================== */

// 1. Daily Logs
export async function offlineSaveDailyLog(logData: {
  id?: string | null;
  date: string;
  flow?: string | null;
  mood?: string[] | null;
  symptoms?: string[] | null;
  notes?: string | null;
}): Promise<{ success: boolean; isOffline: boolean; log: LocalLog }> {
  const currentLogs = await getCachedLogs();
  const existingIdx = currentLogs.findIndex((l) => l.date === logData.date);

  const localLog: LocalLog = {
    id: logData.id || (existingIdx !== -1 ? currentLogs[existingIdx].id : `temp_log_${Date.now()}`),
    date: logData.date,
    flow: logData.flow || "none",
    mood: logData.mood || [],
    symptoms: logData.symptoms || [],
    notes: logData.notes || null,
    isLocalOnly: !isOnline(),
  };

  // Optimistic update in IndexedDB
  if (existingIdx !== -1) {
    currentLogs[existingIdx] = localLog;
  } else {
    currentLogs.unshift(localLog);
  }
  await setCachedLogs(currentLogs);
  notifyDataUpdated("log_saved_local");

  if (!isOnline()) {
    await addToSyncQueue({
      type: "SAVE_LOG",
      endpoint: "/api/logs",
      method: "POST",
      payload: {
        date: logData.date,
        flow: logData.flow,
        mood: logData.mood,
        symptoms: logData.symptoms,
        notes: logData.notes,
      },
    });
    notifySyncStatus();
    return { success: true, isOffline: true, log: localLog };
  }

  // If online, try sending immediately
  try {
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
      body: JSON.stringify({
        date: logData.date,
        flow: logData.flow,
        mood: logData.mood,
        symptoms: logData.symptoms,
        notes: logData.notes,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();
    if (data.log) {
      localLog.id = data.log.id;
      localLog.isLocalOnly = false;
      const updatedList = (await getCachedLogs()).map((l) =>
        l.date === logData.date ? localLog : l
      );
      await setCachedLogs(updatedList);
    }
    return { success: true, isOffline: false, log: localLog };
  } catch (err) {
    console.warn("Network request failed, queueing log for sync:", err);
    localLog.isLocalOnly = true;
    await addToSyncQueue({
      type: "SAVE_LOG",
      endpoint: "/api/logs",
      method: "POST",
      payload: {
        date: logData.date,
        flow: logData.flow,
        mood: logData.mood,
        symptoms: logData.symptoms,
        notes: logData.notes,
      },
    });
    notifySyncStatus();
    return { success: true, isOffline: true, log: localLog };
  }
}

export async function offlineDeleteDailyLog(
  logId: string | null | undefined,
  date: string
): Promise<{ success: boolean; isOffline: boolean }> {
  const currentLogs = await getCachedLogs();
  const updatedLogs = currentLogs.filter((l) => l.date !== date && (logId ? l.id !== logId : true));
  await setCachedLogs(updatedLogs);
  notifyDataUpdated("log_deleted_local");

  if (!logId || logId.startsWith("temp_log_") || !isOnline()) {
    if (logId && !logId.startsWith("temp_log_")) {
      await addToSyncQueue({
        type: "DELETE_LOG",
        endpoint: `/api/logs/${logId}`,
        method: "DELETE",
      });
    }
    notifySyncStatus();
    return { success: true, isOffline: !isOnline() };
  }

  try {
    const res = await fetch(`/api/logs/${logId}`, {
      method: "DELETE",
      headers: { "bypass-tunnel-reminder": "true" },
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return { success: true, isOffline: false };
  } catch (err) {
    console.warn("Failed to delete log online, queueing:", err);
    await addToSyncQueue({
      type: "DELETE_LOG",
      endpoint: `/api/logs/${logId}`,
      method: "DELETE",
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }
}

// 2. Cycles (Add, Update, Delete)
export async function offlineAddCycle(cycleData: {
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}): Promise<{ success: boolean; isOffline: boolean; cycle: LocalCycle }> {
  const tempId = `temp_cycle_${Date.now()}`;
  const localCycle: LocalCycle = {
    id: tempId,
    startDate: cycleData.startDate,
    endDate: cycleData.endDate || null,
    notes: cycleData.notes || null,
    isLocalOnly: !isOnline(),
  };

  const currentCycles = await getCachedCycles();
  currentCycles.unshift(localCycle);
  currentCycles.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  await setCachedCycles(currentCycles);
  notifyDataUpdated("cycle_added_local");

  if (!isOnline()) {
    await addToSyncQueue({
      type: "ADD_CYCLE",
      endpoint: "/api/cycles",
      method: "POST",
      payload: {
        startDate: cycleData.startDate,
        endDate: cycleData.endDate || null,
        notes: cycleData.notes || null,
      },
    });
    notifySyncStatus();
    return { success: true, isOffline: true, cycle: localCycle };
  }

  try {
    const res = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
      body: JSON.stringify({
        startDate: cycleData.startDate,
        endDate: cycleData.endDate || null,
        notes: cycleData.notes || null,
      }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();

    if (data.cycle) {
      localCycle.id = data.cycle.id;
      localCycle.isLocalOnly = false;
      const updated = (await getCachedCycles()).map((c) =>
        c.id === tempId ? { ...data.cycle, isLocalOnly: false } : c
      );
      await setCachedCycles(updated);
    }
    return { success: true, isOffline: false, cycle: localCycle };
  } catch (err) {
    console.warn("Failed to add cycle online, queueing:", err);
    localCycle.isLocalOnly = true;
    await addToSyncQueue({
      type: "ADD_CYCLE",
      endpoint: "/api/cycles",
      method: "POST",
      payload: {
        startDate: cycleData.startDate,
        endDate: cycleData.endDate || null,
        notes: cycleData.notes || null,
      },
    });
    notifySyncStatus();
    return { success: true, isOffline: true, cycle: localCycle };
  }
}

export async function offlineUpdateCycle(
  cycleId: string,
  cycleData: {
    startDate: string;
    endDate?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; isOffline: boolean }> {
  const currentCycles = await getCachedCycles();
  const updated = currentCycles.map((c) =>
    c.id === cycleId
      ? { ...c, ...cycleData, isLocalOnly: !isOnline() }
      : c
  );
  await setCachedCycles(updated);
  notifyDataUpdated("cycle_updated_local");

  if (cycleId.startsWith("temp_cycle_") || !isOnline()) {
    await addToSyncQueue({
      type: "UPDATE_CYCLE",
      endpoint: `/api/cycles/${cycleId}`,
      method: "PUT",
      payload: cycleData,
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }

  try {
    const res = await fetch(`/api/cycles/${cycleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
      body: JSON.stringify(cycleData),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return { success: true, isOffline: false };
  } catch (err) {
    console.warn("Failed to update cycle online, queueing:", err);
    await addToSyncQueue({
      type: "UPDATE_CYCLE",
      endpoint: `/api/cycles/${cycleId}`,
      method: "PUT",
      payload: cycleData,
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }
}

export async function offlineDeleteCycle(
  cycleId: string
): Promise<{ success: boolean; isOffline: boolean }> {
  const currentCycles = await getCachedCycles();
  const updated = currentCycles.filter((c) => c.id !== cycleId);
  await setCachedCycles(updated);
  notifyDataUpdated("cycle_deleted_local");

  if (cycleId.startsWith("temp_cycle_") || !isOnline()) {
    if (!cycleId.startsWith("temp_cycle_")) {
      await addToSyncQueue({
        type: "DELETE_CYCLE",
        endpoint: `/api/cycles/${cycleId}`,
        method: "DELETE",
      });
    }
    notifySyncStatus();
    return { success: true, isOffline: !isOnline() };
  }

  try {
    const res = await fetch(`/api/cycles/${cycleId}`, {
      method: "DELETE",
      headers: { "bypass-tunnel-reminder": "true" },
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return { success: true, isOffline: false };
  } catch (err) {
    console.warn("Failed to delete cycle online, queueing:", err);
    await addToSyncQueue({
      type: "DELETE_CYCLE",
      endpoint: `/api/cycles/${cycleId}`,
      method: "DELETE",
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }
}

// 3. User Settings & Profile
export async function offlineUpdateSettings(
  settings: LocalSettings
): Promise<{ success: boolean; isOffline: boolean }> {
  await setCachedSettings(settings);
  notifyDataUpdated("settings_updated_local");

  if (!isOnline()) {
    await addToSyncQueue({
      type: "UPDATE_SETTINGS",
      endpoint: "/api/settings",
      method: "PUT",
      payload: settings,
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }

  try {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return { success: true, isOffline: false };
  } catch (err) {
    console.warn("Failed to update settings online, queueing:", err);
    await addToSyncQueue({
      type: "UPDATE_SETTINGS",
      endpoint: "/api/settings",
      method: "PUT",
      payload: settings,
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }
}

export async function offlineUpdateProfile(
  profile: LocalProfile
): Promise<{ success: boolean; isOffline: boolean }> {
  await setCachedProfile(profile);
  notifyDataUpdated("profile_updated_local");

  if (!isOnline()) {
    await addToSyncQueue({
      type: "UPDATE_PROFILE",
      endpoint: "/api/profile",
      method: "PUT",
      payload: profile,
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }

  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return { success: true, isOffline: false };
  } catch (err) {
    console.warn("Failed to update profile online, queueing:", err);
    await addToSyncQueue({
      type: "UPDATE_PROFILE",
      endpoint: "/api/profile",
      method: "PUT",
      payload: profile,
    });
    notifySyncStatus();
    return { success: true, isOffline: true };
  }
}

/* ==========================================================================
   QUEUE PROCESSOR & SYNC ENGINE
   ========================================================================== */

export async function processSyncQueue(): Promise<{
  syncedCount: number;
  remainingCount: number;
  hasErrors: boolean;
}> {
  if (syncInProgress || !isOnline()) {
    const queue = await getSyncQueue();
    return { syncedCount: 0, remainingCount: queue.length, hasErrors: false };
  }

  syncInProgress = true;
  notifySyncStatus({ isSyncing: true });

  let syncedCount = 0;
  let hasErrors = false;

  try {
    const queue = await getSyncQueue();
    if (queue.length === 0) {
      syncInProgress = false;
      notifySyncStatus({ isSyncing: false, pendingCount: 0 });
      return { syncedCount: 0, remainingCount: 0, hasErrors: false };
    }

    for (const item of queue) {
      if (!isOnline()) {
        break;
      }

      await updateSyncQueueItem(item.id, { status: "syncing" });

      try {
        let endpoint = item.endpoint;
        // If updating a temp cycle that was never on server, skip or handle accordingly
        if (item.type === "UPDATE_CYCLE" && endpoint.includes("temp_cycle_")) {
          // Skip or delete invalid temp item
          await removeSyncQueueItem(item.id);
          continue;
        }

        const res = await fetch(endpoint, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true",
          },
          body: item.payload ? JSON.stringify(item.payload) : undefined,
        });

        if (res.ok || res.status === 404) {
          // If 404 (e.g. already deleted on server), consider resolved
          await removeSyncQueueItem(item.id);
          syncedCount++;
        } else {
          hasErrors = true;
          await updateSyncQueueItem(item.id, {
            status: "failed",
            retryCount: item.retryCount + 1,
            lastError: `HTTP ${res.status}`,
          });
        }
      } catch (err: unknown) {
        hasErrors = true;
        const msg = err instanceof Error ? err.message : "Network error";
        await updateSyncQueueItem(item.id, {
          status: "failed",
          retryCount: item.retryCount + 1,
          lastError: msg,
        });
        // Break early if network dropped
        if (!isOnline()) break;
      }
    }

    // Refresh server data into local cache when queue items synced
    if (syncedCount > 0 && isOnline()) {
      try {
        const [cyclesRes, logsRes] = await Promise.all([
          fetch("/api/cycles", { headers: { "bypass-tunnel-reminder": "true" } }),
          fetch("/api/logs", { headers: { "bypass-tunnel-reminder": "true" } }),
        ]);

        if (cyclesRes.ok) {
          const cyclesData = await cyclesRes.json();
          if (cyclesData.cycles) {
            await setCachedCycles(cyclesData.cycles);
          }
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (logsData.logs) {
            await setCachedLogs(logsData.logs);
          }
        }
      } catch (refreshErr) {
        console.warn("Error refreshing server cache post-sync:", refreshErr);
      }
    }
  } finally {
    syncInProgress = false;
    const remaining = await getSyncQueue();
    const status: SyncStatus = {
      isOnline: isOnline(),
      isSyncing: false,
      pendingCount: remaining.length,
      lastSyncedAt: Date.now(),
      error: hasErrors ? "Beberapa perubahan gagal disinkronkan." : null,
    };
    notifySyncStatus(status);

    if (syncedCount > 0) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(SYNC_EVENTS.SYNC_COMPLETED, {
            detail: { syncedCount, timestamp: Date.now() },
          })
        );
      }
      notifyDataUpdated("sync_completed");
    }
  }

  const remaining = await getSyncQueue();
  return {
    syncedCount,
    remainingCount: remaining.length,
    hasErrors,
  };
}

/* ==========================================================================
   AUTO-SYNC LISTENERS (Online, Periodic, Service Worker messages)
   ========================================================================== */

let isInitialized = false;

export function initOfflineSyncEngine(): () => void {
  if (typeof window === "undefined" || isInitialized) {
    return () => {};
  }

  isInitialized = true;

  const handleOnline = () => {
    notifySyncStatus({ isOnline: true });
    // Trigger sync when reconnected
    setTimeout(() => {
      processSyncQueue();
    }, 1000);
  };

  const handleOffline = () => {
    notifySyncStatus({ isOnline: false, isSyncing: false });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Periodic queue processing check every 30 seconds if online and pending
  const intervalId = setInterval(async () => {
    if (isOnline()) {
      const queue = await getSyncQueue();
      if (queue.length > 0) {
        processSyncQueue();
      }
    }
  }, 30000);

  // Initial check on page load
  if (isOnline()) {
    setTimeout(() => {
      processSyncQueue();
    }, 2000);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearInterval(intervalId);
    isInitialized = false;
  };
}
