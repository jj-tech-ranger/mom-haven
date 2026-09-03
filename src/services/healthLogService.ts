import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  DailyHealthLog,
  CreateHealthLogInput,
  UpdateHealthLogInput,
  HealthLogType,
  HealthLogValues,
} from '../types/healthLog';
import {
  CATEGORY_BY_TYPE,
  validateHealthLogValues,
  validateLogTimestamp,
  createSafeUserReportedProvenance,
  stripUndefined,
  HealthLogValidationError,
} from './healthLogValidationService';

const LOCAL_STORAGE_KEY_PREFIX = 'momhaven_daily_health_logs_';

// In-memory fallback cache for environments without localStorage or Firestore connectivity
const memoryLogsMap = new Map<string, DailyHealthLog[]>();

function getLocalLogs(userId: string): DailyHealthLog[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return memoryLogsMap.get(userId) || [];
}

function saveLocalLogs(userId: string, logs: DailyHealthLog[]): void {
  memoryLogsMap.set(userId, logs);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }
}

/**
 * Creates a new DailyHealthLog document.
 * Enforces:
 * 1. Ownership: userId is required and binds document
 * 2. Physiological validation on values
 * 3. Safe provenance: always 'REPORTED' with USER_REPORTED source
 * 4. Timestamp validity (non-future)
 */
export async function createHealthLog(
  userId: string,
  input: CreateHealthLogInput,
): Promise<DailyHealthLog> {
  if (!userId) {
    throw new HealthLogValidationError('userId', 'User ID is required to create a health log.');
  }

  const validTimestamp = validateLogTimestamp(input.timestamp);
  const validValues = validateHealthLogValues(input.type, input.values);
  const category = CATEGORY_BY_TYPE[input.type];
  const provenance = createSafeUserReportedProvenance(userId, validTimestamp);

  const newLog: Omit<DailyHealthLog, 'id'> = {
    userId,
    timestamp: validTimestamp,
    type: input.type,
    category,
    values: validValues,
    notes: input.notes ? String(input.notes).trim().slice(0, 1000) : undefined,
    source: 'USER_REPORTED',
    provenance,
    sharedWithClinician: Boolean(input.sharedWithClinician),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let createdId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    if (db) {
      const docRef = await addDoc(collection(db, 'dailyHealthLogs'), {
        ...stripUndefined(newLog),
        firestoreCreatedAt: serverTimestamp(),
      });
      createdId = docRef.id;
    }
  } catch (err) {
    console.warn('[HealthLogService] Firestore addDoc failed, using fallback storage:', err);
  }

  const completeLog: DailyHealthLog = {
    id: createdId,
    ...newLog,
  };

  // Keep local cache synced
  const existing = getLocalLogs(userId);
  saveLocalLogs(userId, [completeLog, ...existing]);

  return completeLog;
}

/**
 * Updates an existing DailyHealthLog.
 * Enforces ownership and re-validates values.
 */
export async function updateHealthLog(
  userId: string,
  logId: string,
  input: UpdateHealthLogInput,
): Promise<DailyHealthLog> {
  if (!userId || !logId) {
    throw new HealthLogValidationError('id', 'User ID and Log ID are required.');
  }

  const localList = getLocalLogs(userId);
  const existing = localList.find((l) => l.id === logId);

  // Firestore attempt
  let serverDocData: any = null;
  if (db) {
    try {
      const docRef = doc(db, 'dailyHealthLogs', logId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        serverDocData = snap.data();
        if (serverDocData.userId !== userId) {
          throw new HealthLogValidationError('userId', 'Cannot modify another user’s health log.');
        }
      }
    } catch (err: any) {
      if (err instanceof HealthLogValidationError) throw err;
      console.warn('[HealthLogService] Firestore getDoc failed during update:', err);
    }
  }

  const target = serverDocData ? { id: logId, ...serverDocData } : existing;
  if (!target) {
    throw new HealthLogValidationError('logId', 'Health log not found.');
  }

  if (target.userId !== userId) {
    throw new HealthLogValidationError('userId', 'Cannot modify another user’s health log.');
  }

  const updatedTimestamp = input.timestamp ? validateLogTimestamp(input.timestamp) : target.timestamp;
  const mergedValues = input.values ? { ...target.values, ...input.values } : target.values;
  const validValues = validateHealthLogValues(target.type, mergedValues);

  const updatedLog: DailyHealthLog = {
    ...target,
    timestamp: updatedTimestamp,
    values: validValues,
    notes: input.notes !== undefined ? (input.notes ? String(input.notes).trim().slice(0, 1000) : undefined) : target.notes,
    sharedWithClinician: input.sharedWithClinician !== undefined ? Boolean(input.sharedWithClinician) : target.sharedWithClinician,
    source: 'USER_REPORTED',
    provenance: createSafeUserReportedProvenance(userId, target.provenance?.enteredAt || target.timestamp),
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      const docRef = doc(db, 'dailyHealthLogs', logId);
      await updateDoc(docRef, {
        timestamp: updatedLog.timestamp,
        values: updatedLog.values,
        notes: updatedLog.notes || null,
        sharedWithClinician: updatedLog.sharedWithClinician,
        'provenance.status': 'REPORTED',
        'provenance.verifiedBy': null,
        'provenance.verifiedAt': null,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[HealthLogService] Firestore updateDoc failed, fallback:', err);
    }
  }

  // Update local cache
  const updatedLocal = localList.map((l) => (l.id === logId ? updatedLog : l));
  saveLocalLogs(userId, updatedLocal);

  return updatedLog;
}

/**
 * Deletes a health log.
 * Enforces ownership check.
 */
export async function deleteHealthLog(userId: string, logId: string): Promise<void> {
  if (!userId || !logId) {
    throw new HealthLogValidationError('id', 'User ID and Log ID are required.');
  }

  const localList = getLocalLogs(userId);
  const target = localList.find((l) => l.id === logId);
  if (target && target.userId !== userId) {
    throw new HealthLogValidationError('userId', 'Cannot delete another user’s health log.');
  }

  if (db) {
    try {
      const docRef = doc(db, 'dailyHealthLogs', logId);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.userId !== userId) {
        throw new HealthLogValidationError('userId', 'Cannot delete another user’s health log.');
      }
      await deleteDoc(docRef);
    } catch (err: any) {
      if (err instanceof HealthLogValidationError) throw err;
      console.warn('[HealthLogService] Firestore deleteDoc failed, removing from local cache:', err);
    }
  }

  saveLocalLogs(userId, localList.filter((l) => l.id !== logId));
}

/**
 * Fetches health logs for a user, sorted by timestamp descending
 */
export async function getHealthLogs(
  userId: string,
  options: {
    type?: HealthLogType;
    limit?: number;
  } = {},
): Promise<DailyHealthLog[]> {
  if (!userId) return [];

  const max = options.limit || 100;
  let logs: DailyHealthLog[] = [];

  if (db) {
    try {
      let q = query(
        collection(db, 'dailyHealthLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(max),
      );

      const snapshot = await getDocs(q);
      logs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DailyHealthLog[];
    } catch (err) {
      // Index error or network error, fallback to client-side filtering and local storage
      console.warn('[HealthLogService] Firestore query error, falling back to local logs:', err);
    }
  }

  if (logs.length === 0) {
    logs = getLocalLogs(userId);
  } else {
    saveLocalLogs(userId, logs);
  }

  if (options.type) {
    logs = logs.filter((l) => l.type === options.type);
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, max);
}

/**
 * Convenience aliases for diverse callers
 */
export const saveDailyHealthLog = createHealthLog;
export const getDailyHealthLogs = getHealthLogs;

export async function updateDailyHealthLog(
  userId: string,
  logId: string,
  input: UpdateHealthLogInput,
): Promise<DailyHealthLog | null> {
  try {
    return await updateHealthLog(userId, logId, input);
  } catch {
    return null;
  }
}

export async function deleteDailyHealthLog(userId: string, logId: string): Promise<boolean> {
  try {
    await deleteHealthLog(userId, logId);
    return true;
  } catch {
    return false;
  }
}

export async function getDailyHealthLogById(userId: string, logId: string): Promise<DailyHealthLog | null> {
  if (!userId || !logId) return null;
  const logs = await getHealthLogs(userId);
  const found = logs.find((l) => l.id === logId);
  if (!found || found.userId !== userId) return null;
  return found;
}

export async function getDailyHealthLogsByType(
  userId: string,
  type: HealthLogType,
  limit?: number,
): Promise<DailyHealthLog[]> {
  return getHealthLogs(userId, { type, limit });
}

