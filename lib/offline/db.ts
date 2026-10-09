/**
 * IndexedDB storage utility for Ricil's Offline-First PWA.
 * Stores local cycle data, daily logs, user preferences, and pending sync mutation queue.
 */

const DB_NAME = "ricils_offline_db";
const DB_VERSION = 1;

export interface QueuedMutation {
  id: string;
  type:
    | "ADD_CYCLE"
    | "UPDATE_CYCLE"
    | "DELETE_CYCLE"
    | "SAVE_LOG"
    | "DELETE_LOG"
    | "UPDATE_SETTINGS"
    | "UPDATE_PROFILE";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload?: any;
  timestamp: number;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  lastError?: string | null;
}

export interface LocalCycle {
  id: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  isLocalOnly?: boolean;
}

export interface LocalLog {
  id?: string;
  date: string;
  flow?: string | null;
  mood?: string[] | null;
  symptoms?: string[] | null;
  notes?: string | null;
  isLocalOnly?: boolean;
}

export interface LocalSettings {
  reminderPeriod: boolean;
  reminderLogging: boolean;
  reminderSymptoms: boolean;
  reminderPms?: boolean;
  reminderDaily?: boolean;
  dailyReminderTime?: string;
  cycleLengthDefault: number;
  periodDurationDefault: number;
}

export interface LocalProfile {
  displayName?: string | null;
  timezone?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store 1: sync_queue for offline mutations
      if (!db.objectStoreNames.contains("sync_queue")) {
        const queueStore = db.createObjectStore("sync_queue", { keyPath: "id" });
        queueStore.createIndex("timestamp", "timestamp", { unique: false });
        queueStore.createIndex("status", "status", { unique: false });
      }

      // Store 2: keyval for cached mirrors (cycles, logs, settings, profile, etc.)
      if (!db.objectStoreNames.contains("local_store")) {
        db.createObjectStore("local_store", { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Generic Key-Value Helpers
export async function getLocalItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("local_store", "readonly");
      const store = tx.objectStore("local_store");
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? (request.result.value as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB fails
    try {
      const raw = localStorage.getItem(`ricils_offline_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function setLocalItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("local_store", "readwrite");
      const store = tx.objectStore("local_store");
      const request = store.put({ key, value, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      localStorage.setItem(`ricils_offline_${key}`, JSON.stringify(value));
    } catch {}
  }
}

export async function removeLocalItem(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("local_store", "readwrite");
      const store = tx.objectStore("local_store");
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      localStorage.removeItem(`ricils_offline_${key}`);
    } catch {}
  }
}

// Sync Queue Helpers
export async function addToSyncQueue(
  mutation: Omit<QueuedMutation, "id" | "timestamp" | "status" | "retryCount">
): Promise<QueuedMutation> {
  const item: QueuedMutation = {
    ...mutation,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    status: "pending",
    retryCount: 0,
    lastError: null,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("sync_queue", "readwrite");
      const store = tx.objectStore("sync_queue");
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback queue in localStorage
    try {
      const raw = localStorage.getItem("ricils_sync_queue");
      const queue: QueuedMutation[] = raw ? JSON.parse(raw) : [];
      queue.push(item);
      localStorage.setItem("ricils_sync_queue", JSON.stringify(queue));
    } catch {}
  }

  return item;
}

export async function getSyncQueue(): Promise<QueuedMutation[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sync_queue", "readonly");
      const store = tx.objectStore("sync_queue");
      const request = store.getAll();

      request.onsuccess = () => {
        const list = (request.result || []) as QueuedMutation[];
        list.sort((a, b) => a.timestamp - b.timestamp);
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem("ricils_sync_queue");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sync_queue", "readwrite");
      const store = tx.objectStore("sync_queue");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem("ricils_sync_queue");
      if (raw) {
        const queue: QueuedMutation[] = JSON.parse(raw);
        const filtered = queue.filter((item) => item.id !== id);
        localStorage.setItem("ricils_sync_queue", JSON.stringify(filtered));
      }
    } catch {}
  }
}

export async function updateSyncQueueItem(
  id: string,
  updates: Partial<QueuedMutation>
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sync_queue", "readwrite");
      const store = tx.objectStore("sync_queue");
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (!getReq.result) return resolve();
        const updated = { ...getReq.result, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem("ricils_sync_queue");
      if (raw) {
        const queue: QueuedMutation[] = JSON.parse(raw);
        const idx = queue.findIndex((item) => item.id === id);
        if (idx !== -1) {
          queue[idx] = { ...queue[idx], ...updates };
          localStorage.setItem("ricils_sync_queue", JSON.stringify(queue));
        }
      }
    } catch {}
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sync_queue", "readwrite");
      const store = tx.objectStore("sync_queue");
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      localStorage.removeItem("ricils_sync_queue");
    } catch {}
  }
}

export async function clearLocalStore(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("local_store", "readwrite");
      const store = tx.objectStore("local_store");
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  try {
    if (typeof localStorage !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("ricils_offline_") || key.startsWith("ricils_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}
}

export async function clearFullDatabase(): Promise<void> {
  await Promise.allSettled([clearSyncQueue(), clearLocalStore()]);
  try {
    if (typeof window !== "undefined" && window.indexedDB) {
      window.indexedDB.deleteDatabase(DB_NAME);
    }
  } catch {}
}

