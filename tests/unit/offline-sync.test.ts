import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  clearSyncQueue,
  setLocalItem,
  getLocalItem,
} from "@/lib/offline/db";
import {
  offlineSaveDailyLog,
  offlineDeleteDailyLog,
  offlineAddCycle,
  offlineDeleteCycle,
  getCachedCycles,
  getCachedLogs,
  setCachedCycles,
  setCachedLogs,
  hydrateLocalCache,
  getCachedLogByDate,
  reconcileCyclesWithServer,
  reconcileLogsWithServer,
} from "@/lib/offline/syncManager";
import { calculateCycleStats, CycleData, generateCycleInsights } from "@/lib/calculations/cycle";

// Mock localStorage for node test environment
const mockStorage: Record<string, string> = {};
beforeEach(async () => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
  globalThis.localStorage = {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => {
      mockStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete mockStorage[k];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
    get length() {
      return Object.keys(mockStorage).length;
    },
    key: (i: number) => Object.keys(mockStorage)[i] || null,
  };
});

describe("Offline DB & Sync Queue", () => {
  it("should store and retrieve local key-value items in fallback store", async () => {
    await setLocalItem("test_cycles", [{ id: "c1", startDate: "2026-09-01" }]);
    const retrieved = await getLocalItem<Array<{ id: string; startDate: string }>>("test_cycles");
    expect(retrieved).toBeDefined();
    expect(retrieved?.length).toBe(1);
    expect(retrieved?.[0].id).toBe("c1");
  });

  it("should enqueue mutations to sync_queue", async () => {
    await clearSyncQueue();
    const queuedItem = await addToSyncQueue({
      type: "ADD_CYCLE",
      endpoint: "/api/cycles",
      method: "POST",
      payload: { startDate: "2026-10-01", endDate: null },
    });

    expect(queuedItem.id).toBeDefined();
    expect(queuedItem.status).toBe("pending");

    const queue = await getSyncQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe("ADD_CYCLE");
  });

  it("should remove synced item from sync_queue", async () => {
    await clearSyncQueue();
    const item1 = await addToSyncQueue({
      type: "SAVE_LOG",
      endpoint: "/api/logs",
      method: "POST",
      payload: { date: "2026-10-01", flow: "medium" },
    });

    const item2 = await addToSyncQueue({
      type: "UPDATE_SETTINGS",
      endpoint: "/api/settings",
      method: "PUT",
      payload: { reminderPeriod: true },
    });

    let queue = await getSyncQueue();
    expect(queue.length).toBe(2);

    await removeSyncQueueItem(item1.id);
    queue = await getSyncQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(item2.id);
  });

  it("should optimistically save offline log and make it accessible from cached logs", async () => {
    const result = await offlineSaveDailyLog({
      date: "2026-10-03",
      flow: "heavy",
      mood: ["senang"],
      symptoms: ["kram"],
      notes: "Hari pertama",
    });

    expect(result.success).toBe(true);
    const logs = await getCachedLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const found = logs.find((l) => l.date === "2026-10-03");
    expect(found).toBeDefined();
    expect(found?.flow).toBe("heavy");
    expect(found?.mood).toContain("senang");
  });

  it("should recompute cycle stats locally when new cycle is added offline", async () => {
    const initialCycles: CycleData[] = [
      { id: "c1", startDate: "2026-08-01", endDate: "2026-08-05" },
      { id: "c2", startDate: "2026-08-29", endDate: "2026-09-02" },
    ];
    await setCachedCycles(initialCycles);

    const addResult = await offlineAddCycle({
      startDate: "2026-09-26",
      endDate: "2026-09-30",
    });
    expect(addResult.success).toBe(true);

    const localCycles = await getCachedCycles();
    expect(localCycles.length).toBe(3);

    const stats = calculateCycleStats(localCycles);
    expect(stats.totalCyclesLogged).toBe(3);
    expect(stats.averageCycleLength).toBe(28);
  });

  it("should delete daily log offline, update local cache, and purge pending sync item", async () => {
    await clearSyncQueue();
    await offlineSaveDailyLog({
      date: "2026-10-04",
      flow: "medium",
      notes: "Log to delete",
    });

    let logs = await getCachedLogs();
    expect(logs.find((l) => l.date === "2026-10-04")).toBeDefined();

    const delResult = await offlineDeleteDailyLog("temp_log_test", "2026-10-04");
    expect(delResult.success).toBe(true);

    logs = await getCachedLogs();
    expect(logs.find((l) => l.date === "2026-10-04")).toBeUndefined();

    const queue = await getSyncQueue();
    const savePending = queue.find(
      (q) => q.type === "SAVE_LOG" && q.payload?.date === "2026-10-04"
    );
    expect(savePending).toBeUndefined();
  });

  it("should delete cycle offline, update local cache, and purge pending sync item", async () => {
    await clearSyncQueue();
    const addResult = await offlineAddCycle({
      startDate: "2026-10-05",
      endDate: "2026-10-09",
    });

    const cycleId = addResult.cycle.id;
    let cycles = await getCachedCycles();
    expect(cycles.find((c) => c.id === cycleId)).toBeDefined();

    const delResult = await offlineDeleteCycle(cycleId);
    expect(delResult.success).toBe(true);

    cycles = await getCachedCycles();
    expect(cycles.find((c) => c.id === cycleId)).toBeUndefined();
  });

  it("should reconcile cycles with server and prune deleted cycles without resurrection", async () => {
    await clearSyncQueue();

    // 1. Initial cached cycles with c1 and c2
    await setCachedCycles([
      { id: "c1", startDate: "2026-07-01", endDate: "2026-07-05" },
      { id: "c2", startDate: "2026-08-01", endDate: "2026-08-05" },
    ]);

    // 2. Add an offline cycle c_offline
    await setCachedCycles([
      { id: "c1", startDate: "2026-07-01", endDate: "2026-07-05" },
      { id: "c2", startDate: "2026-08-01", endDate: "2026-08-05" },
      { id: "temp_cycle_123", startDate: "2026-09-01", endDate: "2026-09-05", isLocalOnly: true },
    ]);

    // 3. Server reports c1 was deleted, only c2 exists
    await reconcileCyclesWithServer([
      { id: "c2", startDate: "2026-08-01", endDate: "2026-08-05" },
    ]);

    const reconciled = await getCachedCycles();
    // c1 must be pruned (deleted on server)!
    expect(reconciled.find((c) => c.id === "c1")).toBeUndefined();
    // c2 must be present
    expect(reconciled.find((c) => c.id === "c2")).toBeDefined();
    // temp_cycle_123 must be preserved
    expect(reconciled.find((c) => c.id === "temp_cycle_123")).toBeDefined();
    expect(reconciled.length).toBe(2);
  });

  it("should correctly recompute statistics and insights when all cycles are deleted", async () => {
    const stats = calculateCycleStats([], 28, 5);
    expect(stats.totalCyclesLogged).toBe(0);
    expect(stats.currentCycleDay).toBeNull();
    expect(stats.estimatedNextPeriodDate).toBeNull();

    const insights = generateCycleInsights([], [], stats);
    expect(Array.isArray(insights)).toBe(true);
  });

  it("should completely clear local database, sync queue, and cached items with clearAllLocalCacheAndStorage", async () => {
    // 1. Populate some cycles and logs
    await setCachedCycles([
      { id: "c1", startDate: "2026-07-01", endDate: "2026-07-05" },
    ]);
    await setCachedLogs([
      { date: "2026-07-01", flow: "medium", mood: ["senang"], symptoms: [] },
    ]);
    await addToSyncQueue({
      type: "ADD_CYCLE",
      endpoint: "/api/cycles",
      method: "POST",
      payload: { startDate: "2026-07-01" },
    });

    let cycles = await getCachedCycles();
    let queue = await getSyncQueue();
    expect(cycles.length).toBe(1);
    expect(queue.length).toBe(1);

    // 2. Perform full clear
    const { clearAllLocalCacheAndStorage } = await import("@/lib/offline/syncManager");
    await clearAllLocalCacheAndStorage();

    cycles = await getCachedCycles();
    const logs = await getCachedLogs();
    queue = await getSyncQueue();

    expect(cycles.length).toBe(0);
    expect(logs.length).toBe(0);
    expect(queue.length).toBe(0);
  });
});

