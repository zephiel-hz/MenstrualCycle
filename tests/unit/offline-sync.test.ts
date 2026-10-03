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
  offlineAddCycle,
  getCachedCycles,
  getCachedLogs,
  setCachedCycles,
  setCachedLogs,
  hydrateLocalCache,
  getCachedLogByDate,
} from "@/lib/offline/syncManager";
import { calculateCycleStats, CycleData } from "@/lib/calculations/cycle";

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
    length: Object.keys(mockStorage).length,
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

  it("should non-destructively merge incoming partial logs and cycles without wiping existing cache", async () => {
    // 1. Initial cached history with 3 cycles and 2 logs
    await setCachedCycles([
      { id: "c1", startDate: "2026-07-01", endDate: "2026-07-05" },
      { id: "c2", startDate: "2026-08-01", endDate: "2026-08-05" },
    ]);
    await setCachedLogs([
      { id: "l1", date: "2026-07-02", flow: "medium", mood: ["baik"], symptoms: [] },
      { id: "l2", date: "2026-08-02", flow: "heavy", mood: ["stres"], symptoms: ["kram"] },
    ]);

    // 2. Hydrate with only today's log and 1 new cycle
    await hydrateLocalCache({
      cycles: [{ id: "c3", startDate: "2026-09-01", endDate: "2026-09-05" }],
      logs: [{ id: "l3", date: "2026-09-02", flow: "light", mood: ["senang"], symptoms: [] }],
    });

    const cachedCycles = await getCachedCycles();
    const cachedLogs = await getCachedLogs();

    // Must have all 3 cycles preserved!
    expect(cachedCycles.length).toBe(3);
    expect(cachedCycles.map((c) => c.id)).toContain("c1");
    expect(cachedCycles.map((c) => c.id)).toContain("c2");
    expect(cachedCycles.map((c) => c.id)).toContain("c3");

    // Must have all 3 logs preserved!
    expect(cachedLogs.length).toBe(3);
    expect(await getCachedLogByDate("2026-07-02")).toBeDefined();
    expect(await getCachedLogByDate("2026-08-02")).toBeDefined();
    expect(await getCachedLogByDate("2026-09-02")).toBeDefined();
  });
});
