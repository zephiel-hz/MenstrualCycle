import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  clearSyncQueue,
  setLocalItem,
  getLocalItem,
} from "@/lib/offline/db";

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
});

