import type { EmergencyContactDoc, SavedEmergencyFacilityDoc } from '../types';

const DB_NAME = 'momhaven-emergency';
const DB_VERSION = 1;
const STORE = 'emergency-data';

type CachePayload = {
  facilities: SavedEmergencyFacilityDoc[];
  contacts: EmergencyContactDoc[];
  cachedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readEmergencyCache(userId: string): Promise<CachePayload | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(userId);
      request.onsuccess = () => resolve((request.result as CachePayload | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function writeEmergencyCache(userId: string, facilities: SavedEmergencyFacilityDoc[], contacts: EmergencyContactDoc[]) {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ facilities, contacts, cachedAt: Date.now() } satisfies CachePayload, userId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB is an enhancement cache. The compiled emergency baseline remains authoritative.
  }
}
