// src/services/syncEngine.ts
import { db } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface OutboxAction {
  id: string; // Unique client-generated UUID for idempotency
  collectionName: string;
  parentPath?: string; // e.g. "pregnancies/preg123"
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

const OUTBOX_STORAGE_KEY = 'momhaven_outbox_queue_v1';

export class SyncEngine {
  private static outbox: OutboxAction[] = [];
  private static isSyncing = false;
  private static listeners: ((count: number) => void)[] = [];

  public static init() {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (raw) {
      try {
        this.outbox = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse offline outbox queue', e);
        this.outbox = [];
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('⚡ Network restored. Triggering outbox sync...');
        this.processQueue();
      });
    }
  }

  public static subscribe(listener: (count: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.outbox.length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(l => l(this.outbox.length));
  }

  public static async enqueue(collectionName: string, data: any, parentPath?: string): Promise<string> {
    const actionId = 'outbox_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    // Inject client-generated ID and optimistic metadata
    const action: OutboxAction = {
      id: actionId,
      collectionName,
      parentPath,
      data: {
        ...data,
        id: data.id || actionId,
        _offlineCreated: true,
        _clientTimestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING'
    };

    this.outbox.push(action);
    this.persist();
    this.notifyListeners();

    // If online, attempt immediate sync
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processQueue();
    }

    return action.data.id;
  }

  public static async processQueue() {
    if (this.isSyncing || this.outbox.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    this.isSyncing = true;
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
          syncedAt: serverTimestamp()
        }, { merge: true });

        // Successfully synced -> Remove from outbox
        this.outbox = this.outbox.filter(a => a.id !== action.id);
        this.persist();
        this.notifyListeners();
        console.log(`✅ Synced offline record [${action.collectionName}/${action.data.id}] successfully.`);
      } catch (err: any) {
        console.error(`❌ Error syncing action ${action.id}:`, err);
        action.retryCount += 1;
        action.status = action.retryCount >= 5 ? 'FAILED' : 'PENDING';
        this.persist();
        this.notifyListeners();
      }
    }

    this.isSyncing = false;
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
}

// Initialize on module load
SyncEngine.init();
