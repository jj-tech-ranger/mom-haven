import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../clinicianAccess.js';

export const SERVER_FORBIDDEN_CLINICAL_FIELDS = [
  'lmp',
  'edd',
  'gestationalAgeWeeks',
  'gravida',
  'parity',
  'bloodGroup',
  'rhesusFactor',
  'chronicConditions',
  'currentMedications',
  'allergies',
  'ancEncounters',
  'birthOutcomes',
  'vaccines',
  'growthMeasurements',
  'muacMeasurements',
  'milestones',
  'illnesses',
  'authoritativeDiagnosis',
  'verifiedBloodPressure',
  'clinicalConditions',
  'verifiedMedications',
] as const;

export interface ServerHealthContext {
  version?: number;
  lifecycleStage?: string;
  userMode?: string;
  preferredName?: string;
  ageBracket?: string;
  county?: string;
  subcounty?: string;
  location?: {
    county?: string;
    subcounty?: string;
  };
  language?: 'en' | 'sw';
  pregnancy?: {
    pregnancyWeek?: number;
    dueDate?: string;
    dueDateSource?: string;
    multiplePregnancy?: boolean;
    pregnancyNumber?: number;
  };
  childAgeBracket?: string;
  interests?: string[];
  dietaryPreferences?: string[];
  supportSystem?: string;
  havenResponseStyle?: string;
  questionsForClinician?: string[];
  appointmentPreparationNotes?: string;
  onboarding?: {
    completed: boolean;
    completedAt?: string;
    version?: number;
    source?: string;
  };
  onboardingCompletedAt?: string;
  updatedAt?: string;
  metadata?: {
    updatedAt: string;
    updatedBy?: string;
    source?: string;
    changeSummary?: string;
  };
}

export function sanitizeServerHealthContext(raw: Record<string, unknown>): Partial<ServerHealthContext> {
  if (!raw || typeof raw !== 'object') return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if ((SERVER_FORBIDDEN_CLINICAL_FIELDS as readonly string[]).includes(key)) {
      continue;
    }
    clean[key] = value;
  }
  return clean as Partial<ServerHealthContext>;
}

export function mergeServerHealthContext(
  existing: ServerHealthContext | null,
  updates: Partial<ServerHealthContext> | Record<string, unknown>,
): ServerHealthContext {
  const cleanUpdates = sanitizeServerHealthContext(updates as Record<string, unknown>);
  const now = new Date().toISOString();

  const merged: ServerHealthContext = {
    version: Math.max(existing?.version || 1, cleanUpdates.version || 1),
    lifecycleStage: cleanUpdates.lifecycleStage ?? existing?.lifecycleStage ?? 'pregnancy',
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
    questionsForClinician: Array.isArray(cleanUpdates.questionsForClinician)
      ? Array.from(new Set(cleanUpdates.questionsForClinician.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)))
      : (existing?.questionsForClinician || []),
    appointmentPreparationNotes: typeof cleanUpdates.appointmentPreparationNotes === 'string'
      ? cleanUpdates.appointmentPreparationNotes
      : existing?.appointmentPreparationNotes,
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

export async function getHealthContextForUser(uid: string): Promise<ServerHealthContext | null> {
  if (!uid) return null;
  const snapshot = await adminDb.collection('healthContexts').doc(uid).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null;
  return mergeServerHealthContext(null, data);
}

export async function saveHealthContextForUser(
  uid: string,
  context: Partial<ServerHealthContext>,
  reason: string = 'server_sync',
): Promise<ServerHealthContext> {
  if (!uid) throw new Error('User ID is required to save health context');
  const existing = await getHealthContextForUser(uid);
  const merged = mergeServerHealthContext(existing, context);

  await adminDb.collection('healthContexts').doc(uid).set(merged, { merge: true });

  try {
    const versionRef = adminDb.collection(`healthContextVersions/${uid}/versions`).doc();
    await versionRef.set({
      ...merged,
      reasonForChange: reason,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (versionErr) {
    console.warn(`[ServerHealthContext] Could not write historical version for ${uid}`, versionErr);
  }

  return merged;
}

export async function updateHealthContextForUser(
  uid: string,
  updates: Partial<ServerHealthContext>,
  reason: string = 'server_update',
): Promise<ServerHealthContext> {
  return saveHealthContextForUser(uid, updates, reason);
}

