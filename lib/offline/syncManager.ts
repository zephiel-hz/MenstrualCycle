"use client";

import {
  getLocalItem,
  setLocalItem,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  clearSyncQueue,
  clearLocalStore,
  clearFullDatabase,
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
  clearSyncQueue,
  clearLocalStore,
  clearFullDatabase,
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

let notifyDebounceTimer: NodeJS.Timeout | null = null;
let lastUpdateSource: string | undefined = undefined;

export function notifyDataUpdated(source?: string) {
  if (typeof window === "undefined") return;
  lastUpdateSource = source;
  if (notifyDebounceTimer) {
    clearTimeout(notifyDebounceTimer);
  }
  notifyDebounceTimer = setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENTS.DATA_UPDATED, {
        detail: { source: lastUpdateSource, timestamp: Date.now() },
      })
    );
    notifyDebounceTimer = null;
  }, 35);
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
   AUTHORITATIVE CACHE RECONCILIATION & HYDRATION
   ========================================================================== */

export async function reconcileCyclesWithServer(
  serverCycles: LocalCycle[] = [],
  isFullSync: boolean = true
): Promise<boolean> {
  const existing = await getCachedCycles();
  const queue = await getSyncQueue();

  const pendingDeleteIds = new Set(
    queue
      .filter((q) => q.type === "DELETE_CYCLE")
      .map((q) => q.endpoint.replace("/api/cycles/", ""))
  );

  const resultMap = new Map<string, LocalCycle>();

  if (!isFullSync) {
    // Non-destructive partial sync: keep all existing cached cycles first
    for (const ec of existing) {
      if (!pendingDeleteIds.has(ec.id)) {
        resultMap.set(ec.id, ec);
      }
    }
    // Then upsert / overwrite with server-provided cycles
    for (const sc of serverCycles) {
      if (!pendingDeleteIds.has(sc.id)) {
        resultMap.set(sc.id, { ...sc, isLocalOnly: false });
      }
    }
  } else {
    // Full authoritative sync from server:
    // 1. Authoritative server cycles
    for (const sc of serverCycles) {
      if (!pendingDeleteIds.has(sc.id)) {
        resultMap.set(sc.id, { ...sc, isLocalOnly: false });
      }
    }
    // 2. Preserve local-only cycles created offline that have not synced yet
    for (const ec of existing) {
      if (ec.isLocalOnly || ec.id.startsWith("temp_cycle_") || ec.id.startsWith("local_")) {
        if (!pendingDeleteIds.has(ec.id)) {
          resultMap.set(ec.id, ec);
        }
      }
    }
  }

  const merged = Array.from(resultMap.values()).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const isDifferent = JSON.stringify(existing) !== JSON.stringify(merged);
  if (isDifferent) {
    await setCachedCycles(merged);
  }
  return isDifferent;
}

export async function reconcileLogsWithServer(
  serverLogs: LocalLog[] = [],
  isFullSync: boolean = true
): Promise<boolean> {
  const existing = await getCachedLogs();
  const queue = await getSyncQueue();

  const pendingSaveDates = new Set(
    queue.filter((q) => q.type === "SAVE_LOG").map((q) => q.payload?.date)
  );
  const pendingDeleteIds = new Set(
    queue
      .filter((q) => q.type === "DELETE_LOG")
      .map((q) => q.endpoint.replace("/api/logs/", ""))
  );

  const resultMap = new Map<string, LocalLog>();

  if (!isFullSync) {
    // Non-destructive partial sync: keep all existing cached logs first
    for (const el of existing) {
      if (!pendingDeleteIds.has(el.id || "")) {
        resultMap.set(el.date, el);
      }
    }
    // Then upsert / overwrite with server logs (unless date has a pending save queued)
    for (const sl of serverLogs) {
      if (!pendingDeleteIds.has(sl.id || "") && !pendingSaveDates.has(sl.date)) {
        resultMap.set(sl.date, { ...sl, isLocalOnly: false });
      }
    }
  } else {
    // Full authoritative sync from server:
    // 1. Authoritative server logs (excluding those marked for pending deletion or pending local saves)
    for (const sl of serverLogs) {
      if (!pendingDeleteIds.has(sl.id || "") && !pendingSaveDates.has(sl.date)) {
        resultMap.set(sl.date, { ...sl, isLocalOnly: false });
      }
    }
    // 2. Preserve local-only logs created offline
    for (const el of existing) {
      if (
        el.isLocalOnly ||
        el.id?.startsWith("temp_log_") ||
        el.id?.startsWith("local_") ||
        pendingSaveDates.has(el.date)
      ) {
        if (!pendingDeleteIds.has(el.id || "")) {
          resultMap.set(el.date, el);
        }
      }
    }
  }

  const merged = Array.from(resultMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const isDifferent = JSON.stringify(existing) !== JSON.stringify(merged);
  if (isDifferent) {
    await setCachedLogs(merged);
  }
  return isDifferent;
}

export async function hydrateLocalCache(data: {
  cycles?: LocalCycle[];
  logs?: LocalLog[];
  settings?: LocalSettings;
  profile?: LocalProfile;
}): Promise<void> {
  if (data.cycles !== undefined && data.cycles.length > 0) {
    await reconcileCyclesWithServer(data.cycles, false);
  }

  if (data.logs !== undefined && data.logs.length > 0) {
    await reconcileLogsWithServer(data.logs, false);
  }

  if (data.settings) {
    await setCachedSettings(data.settings);
  }
  if (data.profile) {
    await setCachedProfile(data.profile);
  }
}

/* ==========================================================================
   BACKGROUND FULL SERVER DATA WARM-UP (When Online)
   ========================================================================== */

let backgroundSyncRunning = false;

export async function syncAllDataFromServer(): Promise<void> {
  if (backgroundSyncRunning || !isOnline()) return;
  backgroundSyncRunning = true;

  try {
    const [cyclesRes, logsRes, settingsRes, profileRes] = await Promise.allSettled([
      fetch("/api/cycles", { headers: { "bypass-tunnel-reminder": "true" } }),
      fetch("/api/logs", { headers: { "bypass-tunnel-reminder": "true" } }),
      fetch("/api/settings", { headers: { "bypass-tunnel-reminder": "true" } }),
      fetch("/api/profile", { headers: { "bypass-tunnel-reminder": "true" } }),
    ]);

    let dataChanged = false;

    if (cyclesRes.status === "fulfilled" && cyclesRes.value.ok) {
      const cyclesData = await cyclesRes.value.json();
      if (Array.isArray(cyclesData.cycles)) {
        const changed = await reconcileCyclesWithServer(cyclesData.cycles, true);
        if (changed) dataChanged = true;
      }
    }

    if (logsRes.status === "fulfilled" && logsRes.value.ok) {
      const logsData = await logsRes.value.json();
      if (Array.isArray(logsData.logs)) {
        const changed = await reconcileLogsWithServer(logsData.logs, true);
        if (changed) dataChanged = true;
      }
    }

    if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
      const settingsData = await settingsRes.value.json();
      if (settingsData.settings) {
        const cur = await getCachedSettings();
        if (JSON.stringify(cur) !== JSON.stringify(settingsData.settings)) {
          await setCachedSettings(settingsData.settings);
          dataChanged = true;
        }
      }
    }

    if (profileRes.status === "fulfilled" && profileRes.value.ok) {
      const profileData = await profileRes.value.json();
      if (profileData.profile) {
        const cur = await getCachedProfile();
        if (JSON.stringify(cur) !== JSON.stringify(profileData.profile)) {
          await setCachedProfile(profileData.profile);
          dataChanged = true;
        }
      }
    }

    if (dataChanged) {
      notifyDataUpdated("server_full_sync");
    }
  } catch (err) {
    console.warn("Background server warm-cache failed (offline/error):", err);
  } finally {
    backgroundSyncRunning = false;
  }
}

let routesPrewarmed = false;
export async function prewarmAppRoutes(): Promise<void> {
  if (routesPrewarmed || typeof window === "undefined" || !isOnline()) return;
  routesPrewarmed = true;

  const routes = ["/dashboard", "/calendar", "/history", "/statistics", "/settings"];
  const runner = (cb: () => void) => {
    if ("requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (fn: () => void) => void }).requestIdleCallback(cb);
    } else {
      setTimeout(cb, 1200);
    }
  };

  runner(async () => {
    for (const route of routes) {
      try {
        await fetch(route, { credentials: "include", headers: { "bypass-tunnel-reminder": "true" } });
        await fetch(`${route}?_rsc=prewarm`, {
          credentials: "include",
          headers: { RSC: "1", "bypass-tunnel-reminder": "true" },
        });
      } catch {
        // Silently skip if network fails
      }
    }
  });
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
  const updatedLogs = currentLogs.filter(
    (l) => l.date !== date && (logId ? l.id !== logId : true)
  );
  await setCachedLogs(updatedLogs);
  notifyDataUpdated("log_deleted_local");

  // Purge any pending SAVE_LOG for this date from the sync queue
  const queue = await getSyncQueue();
  for (const item of queue) {
    if (item.type === "SAVE_LOG" && item.payload?.date === date) {
      await removeSyncQueueItem(item.id);
    }
  }

  const hasRealServerId =
    logId && !logId.startsWith("temp_log_") && !logId.startsWith("local_");

  if (!hasRealServerId || !isOnline()) {
    if (hasRealServerId) {
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
    if (!res.ok && res.status !== 404) throw new Error(`Server error: ${res.status}`);
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
        tempId,
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
        tempId,
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
  const isTemp = cycleId.startsWith("temp_cycle_") || cycleId.startsWith("local_");
  const updated = currentCycles.map((c) =>
    c.id === cycleId
      ? { ...c, ...cycleData, isLocalOnly: !isOnline() || isTemp }
      : c
  );
  await setCachedCycles(updated);
  notifyDataUpdated("cycle_updated_local");

  if (isTemp) {
    // If updating a pending temp cycle, update the pending ADD_CYCLE mutation payload if present
    const queue = await getSyncQueue();
    let updatedInQueue = false;
    for (const item of queue) {
      if (item.type === "ADD_CYCLE" && item.payload?.tempId === cycleId) {
        const newPayload = {
          ...item.payload,
          startDate: cycleData.startDate,
          endDate: cycleData.endDate || null,
          notes: cycleData.notes || null,
        };
        await updateSyncQueueItem(item.id, { payload: newPayload });
        updatedInQueue = true;
      }
    }
    if (!updatedInQueue && !isOnline()) {
      await addToSyncQueue({
        type: "UPDATE_CYCLE",
        endpoint: `/api/cycles/${cycleId}`,
        method: "PUT",
        payload: cycleData,
      });
    }
    notifySyncStatus();
    return { success: true, isOffline: true };
  }

  if (!isOnline()) {
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

  // Purge any pending ADD_CYCLE or UPDATE_CYCLE for this cycle
  const isTemp = cycleId.startsWith("temp_cycle_") || cycleId.startsWith("local_");
  const queue = await getSyncQueue();
  for (const item of queue) {
    if (
      (item.type === "UPDATE_CYCLE" && item.endpoint.includes(cycleId)) ||
      (item.type === "ADD_CYCLE" && (isTemp || item.payload?.tempId === cycleId))
    ) {
      await removeSyncQueueItem(item.id);
    }
  }

  if (isTemp || !isOnline()) {
    if (!isTemp) {
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
    if (!res.ok && res.status !== 404) throw new Error(`Server error: ${res.status}`);
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

        // Clean payload if needed (remove tempId before sending to server)
        let bodyPayload = item.payload;
        if (item.type === "ADD_CYCLE" && bodyPayload && "tempId" in bodyPayload) {
          const { tempId, ...rest } = bodyPayload;
          bodyPayload = rest;
        }

        const res = await fetch(endpoint, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true",
          },
          body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
        });

        if (res.ok || res.status === 404) {
          if (res.ok && item.type === "ADD_CYCLE") {
            try {
              const data = await res.json();
              if (data?.cycle?.id && item.payload?.tempId) {
                const tempId = item.payload.tempId;
                const newId = data.cycle.id;
                const currentCycles = await getCachedCycles();
                const updated = currentCycles.map((c) =>
                  c.id === tempId ? { ...data.cycle, isLocalOnly: false } : c
                );
                await setCachedCycles(updated);

                const currentQueue = await getSyncQueue();
                for (const qItem of currentQueue) {
                  if (qItem.endpoint.includes(tempId)) {
                    await updateSyncQueueItem(qItem.id, {
                      endpoint: qItem.endpoint.replace(tempId, newId),
                    });
                  }
                }
              }
            } catch {
              // ignore parse errors
            }
          }
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
      await syncAllDataFromServer();
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
      syncAllDataFromServer();
    }, 1000);
  };

  const handleOffline = () => {
    notifySyncStatus({ isOnline: false, isSyncing: false });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Periodic check every 30 seconds
  const intervalId = setInterval(async () => {
    if (isOnline()) {
      const queue = await getSyncQueue();
      if (queue.length > 0) {
        processSyncQueue();
      }
    }
  }, 30000);

  // Initial check and background warm-cache on page load
  if (isOnline()) {
    setTimeout(() => {
      processSyncQueue();
      syncAllDataFromServer();
    }, 1500);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearInterval(intervalId);
    isInitialized = false;
  };
}

/* ==========================================================================
   COMPLETE CACHE RESET & SERVER RE-SYNC
   ========================================================================== */

/**
 * Completely clears all local IndexedDB cache, pending sync queues,
 * localStorage items, and Service Worker Cache Storage.
 */
export async function clearAllLocalCacheAndStorage(): Promise<void> {
  // 1. Clear IndexedDB
  await clearFullDatabase();

  // 2. Clear localStorage keys
  try {
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("ricils_") || key.startsWith("lunara_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}

  // 3. Clear Cache Storage (Service Worker caches)
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  } catch {}

  notifyDataUpdated("cache_cleared");
}

/**
 * Resets local cache and forces a clean re-sync from server.
 */
export async function resetAndResyncFromServer(): Promise<{
  success: boolean;
  cyclesCount: number;
  logsCount: number;
}> {
  await clearAllLocalCacheAndStorage();

  if (!isOnline()) {
    return { success: true, cyclesCount: 0, logsCount: 0 };
  }

  try {
    const [cyclesRes, logsRes, settingsRes, profileRes] = await Promise.allSettled([
      fetch("/api/cycles", { headers: { "bypass-tunnel-reminder": "true" } }),
      fetch("/api/logs", { headers: { "bypass-tunnel-reminder": "true" } }),
      fetch("/api/settings", { headers: { "bypass-tunnel-reminder": "true" } }),
      fetch("/api/profile", { headers: { "bypass-tunnel-reminder": "true" } }),
    ]);

    let cyclesCount = 0;
    let logsCount = 0;

    if (cyclesRes.status === "fulfilled" && cyclesRes.value.ok) {
      const data = await cyclesRes.value.json();
      if (Array.isArray(data.cycles)) {
        await reconcileCyclesWithServer(data.cycles, true);
        cyclesCount = data.cycles.length;
      }
    }

    if (logsRes.status === "fulfilled" && logsRes.value.ok) {
      const data = await logsRes.value.json();
      if (Array.isArray(data.logs)) {
        await reconcileLogsWithServer(data.logs, true);
        logsCount = data.logs.length;
      }
    }

    if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
      const data = await settingsRes.value.json();
      if (data.settings) {
        await setCachedSettings(data.settings);
      }
    }

    if (profileRes.status === "fulfilled" && profileRes.value.ok) {
      const data = await profileRes.value.json();
      if (data.profile) {
        await setCachedProfile(data.profile);
      }
    }

    notifyDataUpdated("resync_completed");
    return { success: true, cyclesCount, logsCount };
  } catch (err) {
    console.warn("Failed to resync from server after cache reset:", err);
    return { success: false, cyclesCount: 0, logsCount: 0 };
  }
}
