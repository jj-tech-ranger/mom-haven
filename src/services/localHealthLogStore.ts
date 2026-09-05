// src/services/localHealthLogStore.ts
import type { DailyHealthLog } from '../types/healthLog';

export const ANONYMOUS_HEALTH_LOGS_KEY = 'momhaven-anonymous-health-logs-v1';
const DB_NAME = 'momhaven_local_db';
const DB_VERSION = 1;
const STORE_NAME = 'anonymous_health_logs';

let inMemoryLogsCache: DailyHealthLog[] | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getIndexedDB(): IDBFactory | null {
  if (isBrowser() && window.indexedDB) {
    return window.indexedDB;
  }
  return null;
}

/**
 * Open or initialize the IndexedDB store for anonymous health logs.
 */
function openDB(): Promise<IDBDatabase> {
  const idb = getIndexedDB();
  if (!idb) {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Read backup logs from localStorage (mirrored synchronously for instant reads).
 */
function readFromLocalStorage(): DailyHealthLog[] {
  if (isBrowser() && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(ANONYMOUS_HEALTH_LOGS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore
    }
  }
  return inMemoryLogsCache || [];
}

/**
 * Write backup logs to localStorage and in-memory cache.
 */
function writeToLocalStorage(logs: DailyHealthLog[]): void {
  inMemoryLogsCache = logs;
  if (isBrowser() && window.localStorage) {
    try {
      window.localStorage.setItem(ANONYMOUS_HEALTH_LOGS_KEY, JSON.stringify(logs));
    } catch {
      // Ignore
    }
  }
}

/**
 * Retrieve all anonymous health logs from IndexedDB (with fallback to localStorage/memory).
 */
export async function getLocalAnonymousLogs(): Promise<DailyHealthLog[]> {
  const idb = getIndexedDB();
  if (!idb) {
    return readFromLocalStorage();
  }

  try {
    const db = await openDB();
    return await new Promise<DailyHealthLog[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as DailyHealthLog[]) || [];
        // Sync local storage mirror
        writeToLocalStorage(results);
        resolve(results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to read logs from IndexedDB'));
      };
    });
  } catch (err) {
    console.warn('[LocalHealthLogStore] IndexedDB read failed, falling back to localStorage:', err);
    return readFromLocalStorage();
  }
}

/**
 * Save all anonymous health logs into IndexedDB and localStorage.
 */
export async function saveLocalAnonymousLogs(logs: DailyHealthLog[]): Promise<void> {
  writeToLocalStorage(logs);

  const idb = getIndexedDB();
  if (!idb) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const log of logs) {
        store.put(log);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to write logs to IndexedDB'));
    });
  } catch (err) {
    console.warn('[LocalHealthLogStore] IndexedDB write failed:', err);
  }
}

/**
 * Append or upsert a single anonymous health log.
 */
export async function addLocalAnonymousLog(log: DailyHealthLog): Promise<DailyHealthLog> {
  const existing = await getLocalAnonymousLogs();
  const filtered = existing.filter((l) => l.id !== log.id);
  const updated = [log, ...filtered];
  await saveLocalAnonymousLogs(updated);
  return log;
}

/**
 * Update an existing anonymous health log.
 */
export async function updateLocalAnonymousLog(
  logId: string,
  updated: DailyHealthLog,
): Promise<DailyHealthLog | null> {
  const existing = await getLocalAnonymousLogs();
  const index = existing.findIndex((l) => l.id === logId);
  if (index === -1) return null;

  existing[index] = updated;
  await saveLocalAnonymousLogs(existing);
  return updated;
}

/**
 * Delete an anonymous health log by ID.
 */
export async function deleteLocalAnonymousLog(logId: string): Promise<boolean> {
  const existing = await getLocalAnonymousLogs();
  const filtered = existing.filter((l) => l.id !== logId);
  if (filtered.length === existing.length) return false;

  await saveLocalAnonymousLogs(filtered);
  return true;
}

/**
 * Clear all anonymous health logs from IndexedDB and localStorage.
 */
export async function clearLocalAnonymousLogs(): Promise<void> {
  inMemoryLogsCache = [];
  if (isBrowser() && window.localStorage) {
    try {
      window.localStorage.removeItem(ANONYMOUS_HEALTH_LOGS_KEY);
    } catch {
      // Ignore
    }
  }

  const idb = getIndexedDB();
  if (!idb) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[LocalHealthLogStore] IndexedDB clear failed:', err);
  }
}

/**
 * Synchronous snapshot accessor from the in-memory / localStorage cache.
 */
export function getLocalAnonymousLogsSync(): DailyHealthLog[] {
  return readFromLocalStorage();
}

/**
 * Check if any anonymous health logs exist.
 */
export async function hasLocalAnonymousLogs(): Promise<boolean> {
  const logs = await getLocalAnonymousLogs();
  return logs.length > 0;
}
