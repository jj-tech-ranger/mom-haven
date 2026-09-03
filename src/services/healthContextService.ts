import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ContextChangeReason,
  FORBIDDEN_CLINICAL_FIELDS,
  HealthContext,
  HealthContextVersion,
  isLifecycleStage,
  LifecycleStage,
} from '../types/healthContext';

export const CURRENT_CONTEXT_VERSION = 1;

/**
 * Strips authoritative clinical fields from personalization payloads
 * to prevent accidental pollution of the personalization layer.
 */
export function sanitizeHealthContext(raw: Record<string, unknown>): Partial<HealthContext> {
  if (!raw || typeof raw !== 'object') return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if ((FORBIDDEN_CLINICAL_FIELDS as readonly string[]).includes(key)) {
      console.warn(`[HealthContext] Stripped forbidden clinical field '${key}' from personalization context.`);
      continue;
    }
    clean[key] = value;
  }
  return clean as Partial<HealthContext>;
}

/**
 * Pure, deterministic merger of personalization context.
 * Safely preserves existing fields when partial updates are provided.
 */
export function mergeHealthContext(
  existing: HealthContext | null,
  updates: Partial<HealthContext> | Record<string, unknown>,
): HealthContext {
  const cleanUpdates = sanitizeHealthContext(updates as Record<string, unknown>);

  const lifecycleStage: LifecycleStage =
    cleanUpdates.lifecycleStage && isLifecycleStage(cleanUpdates.lifecycleStage)
      ? cleanUpdates.lifecycleStage
      : (existing?.lifecycleStage || 'pregnancy');

  const now = new Date().toISOString();

  const merged: HealthContext = {
    version: Math.max(existing?.version || CURRENT_CONTEXT_VERSION, cleanUpdates.version || CURRENT_CONTEXT_VERSION),
    lifecycleStage,
    userMode: cleanUpdates.userMode ?? existing?.userMode ?? 'authenticated',
    preferredName: cleanUpdates.preferredName ?? existing?.preferredName ?? 'Mama',
    ageBracket: cleanUpdates.ageBracket ?? existing?.ageBracket,
    county: cleanUpdates.county ?? existing?.county ?? cleanUpdates.location?.county ?? existing?.location?.county,
    subcounty: cleanUpdates.subcounty ?? existing?.subcounty ?? cleanUpdates.location?.subcounty ?? existing?.location?.subcounty,
    location: {
      county: cleanUpdates.location?.county ?? cleanUpdates.county ?? existing?.location?.county ?? existing?.county,
      subcounty: cleanUpdates.location?.subcounty ?? cleanUpdates.subcounty ?? existing?.location?.subcounty ?? existing?.subcounty,
    },
    language: cleanUpdates.language ?? existing?.language ?? 'en',
    pregnancy: (cleanUpdates.pregnancy || existing?.pregnancy)
      ? {
          ...(existing?.pregnancy || {}),
          ...(cleanUpdates.pregnancy || {}),
        }
      : undefined,
    childAgeBracket: cleanUpdates.childAgeBracket ?? existing?.childAgeBracket,
    interests: Array.isArray(cleanUpdates.interests)
      ? Array.from(new Set(cleanUpdates.interests.filter((item): item is string => typeof item === 'string')))
      : (existing?.interests || []),
    dietaryPreferences: Array.isArray(cleanUpdates.dietaryPreferences)
      ? Array.from(new Set(cleanUpdates.dietaryPreferences.filter((item): item is string => typeof item === 'string')))
      : (existing?.dietaryPreferences || []),
    supportSystem: cleanUpdates.supportSystem ?? existing?.supportSystem,
    havenResponseStyle: cleanUpdates.havenResponseStyle ?? existing?.havenResponseStyle ?? 'concise',
    onboarding: (cleanUpdates.onboarding || existing?.onboarding)
      ? {
          completed: cleanUpdates.onboarding?.completed ?? existing?.onboarding?.completed ?? true,
          completedAt: cleanUpdates.onboarding?.completedAt ?? existing?.onboarding?.completedAt ?? cleanUpdates.onboardingCompletedAt ?? existing?.onboardingCompletedAt,
          version: cleanUpdates.onboarding?.version ?? existing?.onboarding?.version,
          source: cleanUpdates.onboarding?.source ?? existing?.onboarding?.source,
        }
      : (cleanUpdates.onboardingCompletedAt || existing?.onboardingCompletedAt)
        ? {
            completed: true,
            completedAt: cleanUpdates.onboardingCompletedAt || existing?.onboardingCompletedAt,
          }
        : undefined,
    onboardingCompletedAt: cleanUpdates.onboardingCompletedAt ?? existing?.onboardingCompletedAt,
    updatedAt: now,
    metadata: {
      ...(existing?.metadata || {}),
      ...(cleanUpdates.metadata || {}),
      updatedAt: now,
    },
  };

  return merged;
}

/**
 * Fetches the current personalization context for a user.
 * Path: `healthContexts/{userId}`
 */
export async function getHealthContext(userId: string): Promise<HealthContext | null> {
  if (!userId) return null;
  try {
    const snapshot = await getDoc(doc(db, 'healthContexts', userId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (!data) return null;
    // Sanitize on read to ensure malformed documents never break consumers
    return mergeHealthContext(null, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `healthContexts/${userId}`);
    return null;
  }
}

/**
 * Saves and versions the personalization context.
 * Current context path: `healthContexts/{userId}`
 * Historical versions path: `healthContextVersions/{userId}/versions/{versionId}`
 */
export async function saveHealthContext(
  userId: string,
  context: Partial<HealthContext> | Omit<HealthContext, 'version' | 'updatedAt'>,
  reason: ContextChangeReason = 'initial_onboarding',
): Promise<HealthContext> {
  if (!userId) throw new Error('User ID is required to save health context');
  try {
    const existing = await getHealthContext(userId);
    const merged = mergeHealthContext(existing, context);

    await setDoc(doc(db, 'healthContexts', userId), merged, { merge: true });

    try {
      const versionRef = collection(db, `healthContextVersions/${userId}/versions`);
      await addDoc(versionRef, {
        ...merged,
        reasonForChange: reason,
        createdAt: serverTimestamp(),
      });
    } catch (versionError) {
      console.warn(`[HealthContext] Could not write version snapshot for ${userId}`, versionError);
    }

    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `healthContexts/${userId}`);
    throw error;
  }
}

/**
 * Merges partial updates into an existing health context and saves a new version.
 */
export async function updateHealthContext(
  userId: string,
  updates: Partial<HealthContext>,
  reason: ContextChangeReason = 'preferences_update',
): Promise<HealthContext> {
  return saveHealthContext(userId, updates, reason);
}

/**
 * Fetches historical context snapshots for auditing and evolution.
 * Path: `healthContextVersions/{userId}/versions`
 */
export async function getHealthContextVersions(
  userId: string,
  limitCount = 10,
): Promise<HealthContextVersion[]> {
  if (!userId) return [];
  try {
    const versionsRef = collection(db, `healthContextVersions/${userId}/versions`);
    const q = query(versionsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString());
      return {
        id: docSnap.id,
        ...data,
        createdAt,
      } as HealthContextVersion;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `healthContextVersions/${userId}/versions`);
    return [];
  }
}

