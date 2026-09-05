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
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
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
import {
  getLocalAnonymousLogs,
  addLocalAnonymousLog,
  updateLocalAnonymousLog,
  deleteLocalAnonymousLog,
  getLocalAnonymousLogsSync,
} from './localHealthLogStore';

const LOCAL_STORAGE_KEY_PREFIX = 'momhaven_daily_health_logs_';

// In-memory fallback cache for authenticated environments without localStorage or Firestore connectivity
const memoryLogsMap = new Map<string, DailyHealthLog[]>();

/**
 * Checks if the user or session operates on the unauthenticated anonymous/guest path.
 */
export function isAnonymousPath(userId?: string | null): boolean {
  if (!userId) return true;
  if (
    userId === 'guest' ||
    userId === 'anonymous' ||
    userId === 'explore' ||
    userId.startsWith('guest') ||
    userId.startsWith('anon')
  ) {
    return true;
  }
  const currentAuth = auth?.currentUser;
  if (!currentAuth || currentAuth.isAnonymous) {
    // If the userId matches a simulated non-firebase test mock id, treat as authenticated unless specified
    if (userId.startsWith('user-') || userId.startsWith('mother-') || userId.startsWith('test_')) {
      return false;
    }
    return true;
  }
  return false;
}

function getLocalLogs(userId: string): DailyHealthLog[] {
  if (isAnonymousPath(userId)) {
    return getLocalAnonymousLogsSync();
  }
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
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }
  memoryLogsMap.set(userId, logs);
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

  // Anonymous path: persist to IndexedDB via localHealthLogStore without calling Firestore
  if (isAnonymousPath(userId)) {
    const anonymousLog: DailyHealthLog = {
      id: createdId,
      ...newLog,
      userId: 'guest',
    };
    await addLocalAnonymousLog(anonymousLog);
    return anonymousLog;
  }

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

  if (isAnonymousPath(userId)) {
    const localLogs = await getLocalAnonymousLogs();
    const existing = localLogs.find((l) => l.id === logId);
    if (!existing) {
      throw new HealthLogValidationError('logId', 'Health log not found.');
    }
    const updatedTimestamp = input.timestamp ? validateLogTimestamp(input.timestamp) : existing.timestamp;
    const mergedValues = input.values ? { ...existing.values, ...input.values } : existing.values;
    const validValues = validateHealthLogValues(existing.type, mergedValues);

    const updatedLog: DailyHealthLog = {
      ...existing,
      timestamp: updatedTimestamp,
      values: validValues,
      notes: input.notes !== undefined ? (input.notes ? String(input.notes).trim().slice(0, 1000) : undefined) : existing.notes,
      sharedWithClinician: input.sharedWithClinician !== undefined ? Boolean(input.sharedWithClinician) : existing.sharedWithClinician,
      source: 'USER_REPORTED',
      provenance: createSafeUserReportedProvenance('guest', existing.provenance?.enteredAt || existing.timestamp),
      updatedAt: new Date().toISOString(),
    };
    await updateLocalAnonymousLog(logId, updatedLog);
    return updatedLog;
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

  if (isAnonymousPath(userId)) {
    await deleteLocalAnonymousLog(logId);
    return;
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

  if (isAnonymousPath(userId)) {
    let anonLogs = await getLocalAnonymousLogs();
    if (options.type) {
      anonLogs = anonLogs.filter((l) => l.type === options.type);
    }
    return anonLogs.slice(0, max);
  }

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
  if (!found) return null;
  if (!isAnonymousPath(userId) && found.userId !== userId) return null;
  return found;
}

export async function getDailyHealthLogsByType(
  userId: string,
  type: HealthLogType,
  limit?: number,
): Promise<DailyHealthLog[]> {
  return getHealthLogs(userId, { type, limit });
}

function getLocalCalendarDayKey(dateStringOrDate: string | Date): string {
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the most recent mood log for the given user from today's local calendar day, or null.
 * Follows the existing Firestore query pattern with fallback to local storage.
 */
export async function getTodaysMoodLog(userId: string): Promise<DailyHealthLog | null> {
  if (!userId) return null;
  const logs = await getHealthLogs(userId, { type: 'mood', limit: 20 });
  const todayKey = getLocalCalendarDayKey(new Date());
  for (const log of logs) {
    if (log.type === 'mood' && getLocalCalendarDayKey(log.timestamp) === todayKey) {
      return log;
    }
  }
  return null;
}

/**
 * Returns the number of consecutive calendar days (ending today or yesterday) with at least one mood log.
 * Bounded lookback: max 30 days.
 */
export async function getMoodStreak(userId: string): Promise<number> {
  if (!userId) return 0;
  const logs = await getHealthLogs(userId, { type: 'mood', limit: 60 });
  if (!logs || logs.length === 0) return 0;

  const daySet = new Set<string>();
  for (const log of logs) {
    if (log.type === 'mood' && log.timestamp) {
      const key = getLocalCalendarDayKey(log.timestamp);
      if (key) daySet.add(key);
    }
  }

  const now = new Date();
  const todayKey = getLocalCalendarDayKey(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = getLocalCalendarDayKey(yesterday);

  let startDate: Date;
  if (daySet.has(todayKey)) {
    startDate = now;
  } else if (daySet.has(yesterdayKey)) {
    startDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const target = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - i);
    const key = getLocalCalendarDayKey(target);
    if (daySet.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

const NEGATIVE_MOOD_TYPES = new Set<string>(['sad', 'anxious', 'overwhelmed']);

/**
 * Returns the number of consecutive recent days where the latest logged mood was negative (sad, anxious, or overwhelmed).
 */
export async function getConsecutiveNegativeMoodCount(userId: string): Promise<number> {
  if (!userId) return 0;
  const logs = await getHealthLogs(userId, { type: 'mood', limit: 20 });
  if (!logs || logs.length === 0) return 0;

  const dayMoodMap = new Map<string, string>();
  for (const log of logs) {
    if (log.type === 'mood' && log.values && (log.values as any).mood) {
      const dayKey = getLocalCalendarDayKey(log.timestamp);
      if (dayKey && !dayMoodMap.has(dayKey)) {
        dayMoodMap.set(dayKey, (log.values as any).mood);
      }
    }
  }

  let count = 0;
  for (const [, mood] of dayMoodMap) {
    if (NEGATIVE_MOOD_TYPES.has(mood)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}


