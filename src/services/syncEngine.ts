// src/services/syncEngine.ts
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AncEncounter, GrowthMeasurement } from '../types';

export interface OutboxAction {
  id: string; // Unique client-generated UUID for idempotency
  collectionName: string;
  parentPath?: string; // e.g. "pregnancies/preg123"
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

const OUTBOX_STORAGE_KEY = 'momhaven_outbox_queue_v1';
const LAST_SYNC_KEY = 'momhaven_last_sync_time_v1';

export class SyncEngine {
  private static outbox: OutboxAction[] = [];
  private static isSyncing = false;
  private static lastSyncTime: string | null = null;
  private static listeners: ((status: SyncStatus) => void)[] = [];

  public static init() {
    if (typeof window === 'undefined') return;

    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (raw) {
      try {
        this.outbox = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse offline outbox queue', e);
        this.outbox = [];
      }
    }

    this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY) || null;

    window.addEventListener('online', () => {
      console.log('⚡ Network restored. Triggering outbox sync...');
      this.notifyListeners();
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📶 Device went offline.');
      this.notifyListeners();
    });
  }

  public static getStatus(): SyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      isOnline,
      pendingCount: this.outbox.length,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
    };
  }

  public static subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(l => l(status));
  }

  public static async enqueue(collectionName: string, data: any, parentPath?: string): Promise<string> {
    const actionId = 'outbox_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const assignedId = data.id || actionId;

    // Inject client-generated ID and optimistic metadata
    const action: OutboxAction = {
      id: actionId,
      collectionName,
      parentPath,
      data: {
        ...data,
        id: assignedId,
        _offlineCreated: true,
        _clientTimestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };

    this.outbox.push(action);
    this.persist();
    this.notifyListeners();

    // If online, attempt immediate sync
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processQueue();
    }

    return assignedId;
  }

  public static async processQueue() {
    if (this.isSyncing || this.outbox.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    this.isSyncing = true;
    this.notifyListeners();

    const pendingActions = [...this.outbox.filter(a => a.status === 'PENDING' || a.status === 'FAILED')];

    for (const action of pendingActions) {
      action.status = 'SYNCING';
      this.persist();
      try {
        let docRef;
        if (action.parentPath) {
          docRef = doc(db, action.parentPath, action.collectionName, action.data.id);
        } else {
          docRef = doc(db, action.collectionName, action.data.id);
        }

        // Idempotent write using setDoc with merge
        await setDoc(docRef, {
          ...action.data,
          _offlineCreated: false,
          syncedAt: serverTimestamp(),
        }, { merge: true });

        // Successfully synced -> Remove from outbox
        this.outbox = this.outbox.filter(a => a.id !== action.id);
        this.persist();
        console.log(`✅ Synced offline record [${action.collectionName}/${action.data.id}] successfully.`);
      } catch (err: any) {
        console.error(`❌ Error syncing action ${action.id}:`, err);
        action.retryCount += 1;
        action.status = action.retryCount >= 5 ? 'FAILED' : 'PENDING';
        this.persist();
      }
    }

    this.lastSyncTime = new Date().toISOString();
    try {
      localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
    } catch (_) {}

    this.isSyncing = false;
    this.notifyListeners();
  }

  public static getPendingCount(): number {
    return this.outbox.length;
  }

  private static persist() {
    try {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(this.outbox));
    } catch (e) {
      console.error('Failed to persist outbox to localStorage', e);
    }
  }

  /**
   * Offline-aware ANC Encounter saving
   */
  public static async saveAncEncounterOfflineAware(
    pregnancyId: string,
    encounter: Omit<AncEncounter, 'id'>
  ): Promise<{ id: string; isOfflineQueued: boolean }> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const generatedId = `enc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const encounterWithId: AncEncounter = {
      ...encounter,
      id: generatedId,
    };

    if (!isOnline) {
      // Offline: Enqueue to outbox and save locally
      await this.enqueue('ancEncounters', encounterWithId, `pregnancies/${pregnancyId}`);
      // Also write directly to Firestore local cache
      try {
        const docRef = doc(db, `pregnancies/${pregnancyId}/ancEncounters`, generatedId);
        await setDoc(docRef, { ...encounterWithId, _offlineCreated: true }, { merge: true });
      } catch (_) {
        // Handled by persistent local cache
      }
      return { id: generatedId, isOfflineQueued: true };
    }

    // Online: Try direct Firestore write, fallback to outbox queue if network fails
    try {
      const docRef = doc(db, `pregnancies/${pregnancyId}/ancEncounters`, generatedId);
      await setDoc(docRef, {
        ...encounterWithId,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      return { id: generatedId, isOfflineQueued: false };
    } catch (err) {
      console.warn('Direct Firestore save failed, queuing offline outbox:', err);
      await this.enqueue('ancEncounters', encounterWithId, `pregnancies/${pregnancyId}`);
      return { id: generatedId, isOfflineQueued: true };
    }
  }

  /**
   * Offline-aware Child Growth Measurement saving
   */
  public static async saveGrowthMeasurementOfflineAware(
    childId: string,
    measurement: Omit<GrowthMeasurement, 'id'>
  ): Promise<{ id: string; isOfflineQueued: boolean }> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const generatedId = `growth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const measurementWithId: GrowthMeasurement = {
      ...measurement,
      id: generatedId,
    };

    if (!isOnline) {
      await this.enqueue('growthMeasurements', measurementWithId, `children/${childId}`);
      try {
        const docRef = doc(db, `children/${childId}/growthMeasurements`, generatedId);
        await setDoc(docRef, { ...measurementWithId, _offlineCreated: true }, { merge: true });
      } catch (_) {}
      return { id: generatedId, isOfflineQueued: true };
    }

    try {
      const docRef = doc(db, `children/${childId}/growthMeasurements`, generatedId);
      await setDoc(docRef, {
        ...measurementWithId,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      return { id: generatedId, isOfflineQueued: false };
    } catch (err) {
      console.warn('Direct Firestore save failed, queuing offline outbox:', err);
      await this.enqueue('growthMeasurements', measurementWithId, `children/${childId}`);
      return { id: generatedId, isOfflineQueued: true };
    }
  }
}

/**
 * Hook for consuming real-time sync and network status
 */
export function useSyncStatus(): SyncStatus & { syncNow: () => Promise<void> } {
  const [status, setStatus] = useState<SyncStatus>(() => SyncEngine.getStatus());

  useEffect(() => {
    return SyncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
    });
  }, []);

  return {
    ...status,
    syncNow: () => SyncEngine.processQueue(),
  };
}

// Initialize on module load
SyncEngine.init();
