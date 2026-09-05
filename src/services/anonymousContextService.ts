// src/services/anonymousContextService.ts
import type { User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  FORBIDDEN_CLINICAL_FIELDS,
  type HealthContext,
  type LifecycleStage,
} from '../types/healthContext';
import type { MoodType } from '../types/healthLog';
import {
  getHealthContext,
  mergeHealthContext,
  saveHealthContext,
} from './healthContextService';
import { createHealthLog } from './healthLogService';
import { getLocalAnonymousLogs, clearLocalAnonymousLogs } from './localHealthLogStore';

export interface GuestMoodEntry {
  mood: MoodType;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  timestamp: string;
  notes?: string;
}

export interface AnonymousContextDraft {
  lifecycleStage: LifecycleStage;
  language: 'en' | 'sw';
  pregnancyWeek?: number;
  dueDate?: string;
  childAgeBracket?: HealthContext['childAgeBracket'];
  interests: string[];
  havenResponseStyle?: HealthContext['havenResponseStyle'];
  county?: string;
  subcounty?: string;
  primaryHospitalFacilityId?: string;
  primaryHospitalName?: string;
  preferredName?: string;
  todaysMood?: GuestMoodEntry;
  moodHistory?: GuestMoodEntry[];
  createdAt: string;
  expiresAt: string;
}

export const ANONYMOUS_STORAGE_KEY = 'momhaven-anonymous-context-v1';
export const DEFAULT_ANONYMOUS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Mutex lock to prevent authentication race conditions
let activeSyncPromise: Promise<{
  success: boolean;
  context?: HealthContext;
  source: 'server' | 'client_fallback' | 'none';
  error?: string;
}> | null = null;

/**
 * Check whether an anonymous context draft has passed its expiration time.
 */
export function isAnonymousContextExpired(
  draft: Pick<AnonymousContextDraft, 'expiresAt'>,
  nowMs = Date.now(),
): boolean {
  if (!draft.expiresAt) return true;
  const expiryTime = Date.parse(draft.expiresAt);
  if (Number.isNaN(expiryTime)) return true;
  return nowMs >= expiryTime;
}

/**
 * Sanitize an anonymous draft input to guarantee no privileged clinical fields
 * or arbitrary untrusted fields pollute ephemeral storage.
 */
export function sanitizeAnonymousDraftInput(
  raw: Record<string, unknown>,
): Partial<AnonymousContextDraft> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if ((FORBIDDEN_CLINICAL_FIELDS as readonly string[]).includes(key)) {
      console.warn(`[AnonymousContext] Stripped forbidden clinical field '${key}'`);
      continue;
    }
    clean[key] = value;
  }

  const result: Partial<AnonymousContextDraft> = {};

  // Lifecycle stage
  const stages: LifecycleStage[] = [
    'pregnancy',
    'planning',
    'postpartum',
    'parenting',
    'supporter',
    'exploring',
  ];
  if (typeof clean.lifecycleStage === 'string' && stages.includes(clean.lifecycleStage as LifecycleStage)) {
    result.lifecycleStage = clean.lifecycleStage as LifecycleStage;
  }

  // Language
  if (clean.language === 'en' || clean.language === 'sw') {
    result.language = clean.language;
  }

  // Pregnancy week
  if (typeof clean.pregnancyWeek === 'number' && clean.pregnancyWeek >= 1 && clean.pregnancyWeek <= 44) {
    result.pregnancyWeek = Math.floor(clean.pregnancyWeek);
  }

  // Due date
  if (typeof clean.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clean.dueDate)) {
    result.dueDate = clean.dueDate;
  }

  // Child age bracket
  if (typeof clean.childAgeBracket === 'string') {
    result.childAgeBracket = clean.childAgeBracket as HealthContext['childAgeBracket'];
  }

  // Interests
  if (Array.isArray(clean.interests)) {
    result.interests = Array.from(
      new Set(
        clean.interests
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .slice(0, 20),
      ),
    );
  }

  // Response style
  if (typeof clean.havenResponseStyle === 'string') {
    result.havenResponseStyle = clean.havenResponseStyle as HealthContext['havenResponseStyle'];
  }

  // County & subcounty
  if (typeof clean.county === 'string' && clean.county.trim().length <= 60) {
    result.county = clean.county.trim();
  }
  if (typeof clean.subcounty === 'string' && clean.subcounty.trim().length <= 60) {
    result.subcounty = clean.subcounty.trim();
  }
  if (typeof clean.primaryHospitalFacilityId === 'string' && clean.primaryHospitalFacilityId.trim().length <= 60) {
    result.primaryHospitalFacilityId = clean.primaryHospitalFacilityId.trim();
  }
  if (typeof clean.primaryHospitalName === 'string' && clean.primaryHospitalName.trim().length <= 120) {
    result.primaryHospitalName = clean.primaryHospitalName.trim();
  }

  // Preferred name
  if (typeof clean.preferredName === 'string' && clean.preferredName.trim().length > 0) {
    result.preferredName = clean.preferredName.trim();
  }

  // Allowed moods
  const validMoods: MoodType[] = ['calm', 'happy', 'tired', 'anxious', 'sad', 'overwhelmed'];

  const sanitizeMoodEntry = (entry: unknown): GuestMoodEntry | undefined => {
    if (!entry || typeof entry !== 'object') return undefined;
    const e = entry as Record<string, unknown>;
    if (typeof e.mood !== 'string' || !validMoods.includes(e.mood as MoodType)) {
      return undefined;
    }
    const sanitizedEntry: GuestMoodEntry = {
      mood: e.mood as MoodType,
      timestamp:
        typeof e.timestamp === 'string' && !Number.isNaN(Date.parse(e.timestamp))
          ? e.timestamp
          : new Date().toISOString(),
    };
    if (typeof e.energyLevel === 'number' && [1, 2, 3, 4, 5].includes(e.energyLevel)) {
      sanitizedEntry.energyLevel = e.energyLevel as 1 | 2 | 3 | 4 | 5;
    }
    if (typeof e.notes === 'string' && e.notes.trim()) {
      sanitizedEntry.notes = e.notes.trim().slice(0, 500);
    }
    return sanitizedEntry;
  };

  if (clean.todaysMood) {
    const sanitizedToday = sanitizeMoodEntry(clean.todaysMood);
    if (sanitizedToday) result.todaysMood = sanitizedToday;
  }

  if (Array.isArray(clean.moodHistory)) {
    const validEntries = clean.moodHistory
      .map(sanitizeMoodEntry)
      .filter((entry): entry is GuestMoodEntry => Boolean(entry))
      .slice(-30);
    if (validEntries.length > 0) {
      result.moodHistory = validEntries;
    }
  }

  return result;
}

export function getAnonymousContextDraft(nowMs = Date.now()): AnonymousContextDraft | null {
  try {
    const raw = localStorage.getItem(ANONYMOUS_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as AnonymousContextDraft;
    if (!value || !value.lifecycleStage || !Array.isArray(value.interests)) {
      clearAnonymousContextDraft();
      return null;
    }

    if (isAnonymousContextExpired(value, nowMs)) {
      clearAnonymousContextDraft();
      return null;
    }

    return value;
  } catch {
    clearAnonymousContextDraft();
    return null;
  }
}

export function saveAnonymousContextDraft(
  draftInput: Omit<AnonymousContextDraft, 'createdAt' | 'expiresAt'> & {
    createdAt?: string;
    expiresAt?: string;
    ttlMs?: number;
  },
): AnonymousContextDraft | null {
  try {
    const sanitized = sanitizeAnonymousDraftInput(draftInput as Record<string, unknown>);
    if (!sanitized.lifecycleStage) {
      sanitized.lifecycleStage = 'pregnancy';
    }

    const now = new Date();
    const createdAt = draftInput.createdAt || now.toISOString();
    const ttl = draftInput.ttlMs || DEFAULT_ANONYMOUS_TTL_MS;
    const expiresAt = draftInput.expiresAt || new Date(now.getTime() + ttl).toISOString();

    const completeDraft: AnonymousContextDraft = {
      lifecycleStage: sanitized.lifecycleStage,
      language: sanitized.language || 'en',
      pregnancyWeek: sanitized.pregnancyWeek,
      dueDate: sanitized.dueDate,
      childAgeBracket: sanitized.childAgeBracket,
      interests: sanitized.interests || [],
      havenResponseStyle: sanitized.havenResponseStyle || 'concise',
      county: sanitized.county,
      subcounty: sanitized.subcounty,
      preferredName: sanitized.preferredName,
      todaysMood: sanitized.todaysMood,
      moodHistory: sanitized.moodHistory,
      createdAt,
      expiresAt,
    };

    localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify(completeDraft));
    return completeDraft;
  } catch (error) {
    console.warn('[AnonymousContext] Failed to persist anonymous draft to localStorage', error);
    return null;
  }
}

export function saveGuestMoodLog(
  mood: MoodType,
  energyLevel?: 1 | 2 | 3 | 4 | 5,
  notes?: string,
): AnonymousContextDraft | null {
  const current: AnonymousContextDraft = getAnonymousContextDraft() || {
    lifecycleStage: 'pregnancy',
    language: 'en',
    interests: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + DEFAULT_ANONYMOUS_TTL_MS).toISOString(),
  };

  const now = new Date();
  const timestamp = now.toISOString();
  const newEntry: GuestMoodEntry = {
    mood,
    energyLevel,
    timestamp,
    notes: notes ? notes.trim().slice(0, 500) : undefined,
  };

  const todayStr = timestamp.slice(0, 10);
  const existingHistory = (current.moodHistory || []).filter(
    (entry) => !entry.timestamp.startsWith(todayStr),
  );
  const updatedHistory = [...existingHistory, newEntry].slice(-30);

  return saveAnonymousContextDraft({
    ...current,
    todaysMood: newEntry,
    moodHistory: updatedHistory,
  });
}

export function getGuestTodaysMood(): GuestMoodEntry | null {
  const draft = getAnonymousContextDraft();
  if (!draft || !draft.todaysMood) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  if (draft.todaysMood.timestamp.startsWith(todayStr)) {
    return draft.todaysMood;
  }
  return null;
}

export function getGuestMoodHistory(): GuestMoodEntry[] {
  const draft = getAnonymousContextDraft();
  return draft?.moodHistory || [];
}

/**
 * Migrates any locally stored anonymous health logs into Firestore using
 * the existing authenticated write path (createHealthLog), then clears local storage.
 */
export async function migrateLocalHealthLogs(
  userId: string,
): Promise<{ migratedCount: number; errors: number }> {
  const localLogs = await getLocalAnonymousLogs();
  if (!localLogs || localLogs.length === 0) {
    return { migratedCount: 0, errors: 0 };
  }

  let migratedCount = 0;
  let errors = 0;

  for (const log of localLogs) {
    try {
      await createHealthLog(userId, {
        type: log.type,
        timestamp: log.timestamp,
        values: log.values,
        notes: log.notes,
        sharedWithClinician: log.sharedWithClinician,
      });
      migratedCount++;
    } catch (err) {
      errors++;
      console.warn('[AnonymousContext] Failed to migrate local health log entry:', err);
    }
  }

  await clearLocalAnonymousLogs();
  return { migratedCount, errors };
}

export function clearAnonymousContextDraft(): void {
  try {
    localStorage.removeItem(ANONYMOUS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasAnonymousContextDraft(): boolean {
  return Boolean(getAnonymousContextDraft());
}

/**
 * Synchronize ephemeral anonymous context into the authenticated user's HealthContext.
 * Guaranteed:
 * - Mutex protected against concurrent auth state triggers.
 * - Authenticated UID derived from verified Firebase token.
 * - Deterministic merge policy (existing authoritative clinical records win).
 * - Automatic clearing of ephemeral storage on success.
 */
export async function syncAnonymousContext(
  user: User,
  customDraft?: AnonymousContextDraft,
): Promise<{
  success: boolean;
  context?: HealthContext;
  source: 'server' | 'client_fallback' | 'none';
  error?: string;
}> {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    const draft = customDraft || getAnonymousContextDraft();
    if (!draft) {
      return { success: false, source: 'none' as const };
    }

    try {
      const idToken = await user.getIdToken();

      // 1. Attempt Server-side Synchronization
      try {
        const response = await fetch('/api/v1/context/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ draft }),
        });

        if (response.ok) {
          const payload = await response.json();
          await migrateLocalHealthLogs(user.uid).catch((err) =>
            console.warn('[AnonymousContext] Health log migration failed after server sync:', err),
          );
          clearAnonymousContextDraft();
          return {
            success: true,
            context: payload.context,
            source: 'server' as const,
          };
        }

        console.warn(
          `[AnonymousContext] Server sync returned ${response.status}. Falling back to client-side merge.`,
        );
      } catch (serverError) {
        console.warn('[AnonymousContext] Server sync unreachable, applying client fallback.', serverError);
      }

      // 2. Client-side Fallback Merge
      const existing = await getHealthContext(user.uid);
      const draftContextPayload: Omit<HealthContext, 'version' | 'updatedAt'> = {
        lifecycleStage: draft.lifecycleStage,
        userMode: 'authenticated',
        preferredName: draft.preferredName || user.displayName || 'Mama',
        language: draft.language,
        pregnancy:
          draft.lifecycleStage === 'pregnancy' && (draft.pregnancyWeek !== undefined || draft.dueDate)
            ? {
                pregnancyWeek: draft.pregnancyWeek,
                dueDate: draft.dueDate,
                dueDateSource: draft.dueDate ? 'LMP' : 'UNKNOWN',
              }
            : undefined,
        childAgeBracket: draft.childAgeBracket,
        county: draft.county,
        subcounty: draft.subcounty,
        primaryHospitalFacilityId: draft.primaryHospitalFacilityId,
        primaryHospitalName: draft.primaryHospitalName,
        location: {
          county: draft.county,
          subcounty: draft.subcounty,
          primaryHospitalFacilityId: draft.primaryHospitalFacilityId,
          primaryHospitalName: draft.primaryHospitalName,
        },
        interests: draft.interests,
        dietaryPreferences: [],
        havenResponseStyle: draft.havenResponseStyle || 'concise',
        onboardingCompletedAt: new Date().toISOString(),
      };

      const merged = existing
        ? mergeHealthContext(existing, draftContextPayload)
        : draftContextPayload;

      await saveHealthContext(user.uid, merged, 'context_sync');

      await setDoc(
        doc(db, 'users', user.uid),
        {
          onboarded: true,
          onboardingVersion: 1,
          onboardingSource: 'anonymous_context_sync',
          onboardingCompletedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Sync guest mood history to real health logs if present
      const moodsToSync =
        draft.moodHistory && draft.moodHistory.length > 0
          ? draft.moodHistory
          : draft.todaysMood
          ? [draft.todaysMood]
          : [];
      for (const m of moodsToSync) {
        try {
          await createHealthLog(user.uid, {
            type: 'mood',
            timestamp: m.timestamp,
            values: {
              mood: m.mood,
              ...(m.energyLevel ? { energyLevel: m.energyLevel } : {}),
            },
            notes: m.notes,
          });
        } catch (logErr) {
          console.warn('[AnonymousContext] Failed to migrate guest mood log to healthLog', logErr);
        }
      }

      await migrateLocalHealthLogs(user.uid).catch((err) =>
        console.warn('[AnonymousContext] Health log migration failed during client fallback:', err),
      );

      clearAnonymousContextDraft();

      return {
        success: true,
        context: merged as HealthContext,
        source: 'client_fallback' as const,
      };
    } catch (error: any) {
      console.error('[AnonymousContext] Sync completely failed', error);
      return {
        success: false,
        source: 'none' as const,
        error: error?.message || 'Sync failed',
      };
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}
