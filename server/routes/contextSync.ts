import { Router, Request, Response } from 'express';
import { adminAuth, adminDb, ApiError } from '../clinicianAccess.js';
import { FieldValue } from 'firebase-admin/firestore';
import {
  getHealthContextForUser,
  saveHealthContextForUser,
  SERVER_FORBIDDEN_CLINICAL_FIELDS,
  type ServerHealthContext,
} from '../services/healthContextService.js';

export const contextSyncRouter = Router();

const ALLOWED_LIFECYCLE_STAGES = [
  'pregnancy',
  'planning',
  'postpartum',
  'parenting',
  'supporter',
  'exploring',
] as const;

const ALLOWED_RESPONSE_STYLES = [
  'concise',
  'detailed',
  'appointment_prep',
  'record_explanations',
  'daily_guidance',
] as const;

const ALLOWED_CHILD_AGE_BRACKETS = [
  'newborn',
  '0_5_months',
  '6_11_months',
  '1_2_years',
  '3_5_years',
  'prefer_not_to_say',
] as const;

export interface ValidatedAnonymousSyncPayload {
  lifecycleStage?: (typeof ALLOWED_LIFECYCLE_STAGES)[number];
  language?: 'en' | 'sw';
  pregnancyWeek?: number;
  dueDate?: string;
  childAgeBracket?: (typeof ALLOWED_CHILD_AGE_BRACKETS)[number];
  interests?: string[];
  havenResponseStyle?: (typeof ALLOWED_RESPONSE_STYLES)[number];
  county?: string;
  subcounty?: string;
  preferredName?: string;
}

export function validateAndSanitizeSyncPayload(
  body: Record<string, unknown>,
  authenticatedUid: string,
): { valid: boolean; error?: string; payload?: ValidatedAnonymousSyncPayload } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  // 1. UID Spoofing Detection: Never trust client-supplied UID
  if ('uid' in body && typeof body.uid === 'string' && body.uid !== authenticatedUid) {
    return { valid: false, error: 'UID mismatch detected. Client identity must match verified token.' };
  }
  if ('userId' in body && typeof body.userId === 'string' && body.userId !== authenticatedUid) {
    return { valid: false, error: 'userId mismatch detected. Client identity must match verified token.' };
  }

  // 2. Reject privileged clinical fields
  const forbiddenFound: string[] = [];
  function checkForbidden(obj: Record<string, unknown>) {
    for (const key of Object.keys(obj)) {
      if ((SERVER_FORBIDDEN_CLINICAL_FIELDS as readonly string[]).includes(key)) {
        forbiddenFound.push(key);
      }
      const val = obj[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        checkForbidden(val as Record<string, unknown>);
      }
    }
  }
  checkForbidden(body);

  if (forbiddenFound.length > 0) {
    return {
      valid: false,
      error: `Privileged clinical field '${forbiddenFound[0]}' cannot be submitted via anonymous context sync.`,
    };
  }

  const payload: ValidatedAnonymousSyncPayload = {};
  const draft = (body.draft && typeof body.draft === 'object' ? body.draft : body) as Record<string, unknown>;

  // Lifecycle Stage
  if (typeof draft.lifecycleStage === 'string') {
    if (!ALLOWED_LIFECYCLE_STAGES.includes(draft.lifecycleStage as any)) {
      return { valid: false, error: `Invalid lifecycle stage: ${draft.lifecycleStage}` };
    }
    payload.lifecycleStage = draft.lifecycleStage as (typeof ALLOWED_LIFECYCLE_STAGES)[number];
  }

  // Language
  if (draft.language === 'en' || draft.language === 'sw') {
    payload.language = draft.language;
  }

  // Pregnancy Week
  if (draft.pregnancyWeek !== undefined && draft.pregnancyWeek !== null) {
    const week = Number(draft.pregnancyWeek);
    if (!Number.isFinite(week) || week < 1 || week > 44) {
      return { valid: false, error: 'pregnancyWeek must be an integer between 1 and 44.' };
    }
    payload.pregnancyWeek = Math.floor(week);
  }

  // Due Date (YYYY-MM-DD)
  if (typeof draft.dueDate === 'string' && draft.dueDate.trim()) {
    const trimmed = draft.dueDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || Number.isNaN(Date.parse(trimmed))) {
      return { valid: false, error: 'dueDate must be a valid ISO date string (YYYY-MM-DD).' };
    }
    payload.dueDate = trimmed;
  }

  // Child Age Bracket
  if (typeof draft.childAgeBracket === 'string') {
    if (ALLOWED_CHILD_AGE_BRACKETS.includes(draft.childAgeBracket as any)) {
      payload.childAgeBracket = draft.childAgeBracket as (typeof ALLOWED_CHILD_AGE_BRACKETS)[number];
    }
  }

  // Interests
  if (Array.isArray(draft.interests)) {
    payload.interests = Array.from(
      new Set(
        draft.interests
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0 && item.length <= 50)
          .map((item) => item.trim())
          .slice(0, 20),
      ),
    );
  }

  // Haven Response Style
  if (typeof draft.havenResponseStyle === 'string') {
    if (ALLOWED_RESPONSE_STYLES.includes(draft.havenResponseStyle as any)) {
      payload.havenResponseStyle = draft.havenResponseStyle as (typeof ALLOWED_RESPONSE_STYLES)[number];
    }
  }

  // County & Subcounty
  if (typeof draft.county === 'string' && draft.county.trim().length <= 60) {
    payload.county = draft.county.trim();
  }
  if (typeof draft.subcounty === 'string' && draft.subcounty.trim().length <= 60) {
    payload.subcounty = draft.subcounty.trim();
  }

  // Preferred Name
  if (typeof draft.preferredName === 'string' && draft.preferredName.trim().length > 0 && draft.preferredName.length <= 80) {
    payload.preferredName = draft.preferredName.trim();
  }

  return { valid: true, payload };
}

/**
 * Deterministic merge between existing authenticated health context and validated anonymous draft.
 * Rules:
 * 1. Existing verified/authoritative clinical info always wins.
 * 2. Missing fields in existing context are hydrated from draft.
 * 3. User preference fields (interests, language, response style) are updated/unioned.
 * 4. Never overwrite established pregnancy/child records with anonymous estimates.
 */
export function mergeAnonymousDraftIntoContext(
  existing: ServerHealthContext | null,
  draft: ValidatedAnonymousSyncPayload,
  fallbackName: string = 'Mama',
): ServerHealthContext {
  const now = new Date().toISOString();

  if (!existing) {
    const newContext: ServerHealthContext = {
      version: 1,
      lifecycleStage: draft.lifecycleStage || 'pregnancy',
      userMode: 'authenticated',
      preferredName: draft.preferredName || fallbackName,
      language: draft.language || 'en',
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
      location: {
        county: draft.county,
        subcounty: draft.subcounty,
      },
      interests: draft.interests || [],
      havenResponseStyle: draft.havenResponseStyle || 'concise',
      onboarding: {
        completed: true,
        completedAt: now,
        version: 1,
        source: 'anonymous_context_sync',
      },
      onboardingCompletedAt: now,
      updatedAt: now,
      metadata: {
        updatedAt: now,
        source: 'anonymous_context_sync',
        changeSummary: 'Initialized health context from anonymous draft sync',
      },
    };
    return newContext;
  }

  // Existing context exists -> Deterministic merge
  const mergedInterests = Array.from(
    new Set([...(existing.interests || []), ...(draft.interests || [])]),
  );

  // Preserve established pregnancy record if already present; hydrate if missing
  let mergedPregnancy = existing.pregnancy;
  if (!mergedPregnancy && draft.lifecycleStage === 'pregnancy' && (draft.pregnancyWeek !== undefined || draft.dueDate)) {
    mergedPregnancy = {
      pregnancyWeek: draft.pregnancyWeek,
      dueDate: draft.dueDate,
      dueDateSource: draft.dueDate ? 'LMP' : 'UNKNOWN',
    };
  } else if (mergedPregnancy && draft.pregnancyWeek !== undefined && mergedPregnancy.pregnancyWeek === undefined) {
    // Only fill in missing week, never overwrite an established week
    mergedPregnancy = {
      ...mergedPregnancy,
      pregnancyWeek: draft.pregnancyWeek,
    };
  }

  const merged: ServerHealthContext = {
    ...existing,
    version: (existing.version || 1) + 1,
    userMode: 'authenticated',
    preferredName:
      existing.preferredName && existing.preferredName !== 'Mama'
        ? existing.preferredName
        : draft.preferredName || existing.preferredName || fallbackName,
    lifecycleStage: existing.lifecycleStage || draft.lifecycleStage || 'pregnancy',
    language: draft.language || existing.language || 'en',
    pregnancy: mergedPregnancy,
    childAgeBracket: existing.childAgeBracket || draft.childAgeBracket,
    county: existing.county || draft.county,
    subcounty: existing.subcounty || draft.subcounty,
    location: {
      county: existing.location?.county || existing.county || draft.county,
      subcounty: existing.location?.subcounty || existing.subcounty || draft.subcounty,
    },
    interests: mergedInterests,
    havenResponseStyle: draft.havenResponseStyle || existing.havenResponseStyle || 'concise',
    updatedAt: now,
    metadata: {
      ...(existing.metadata || {}),
      updatedAt: now,
      source: 'anonymous_context_sync',
      changeSummary: 'Synchronized anonymous draft preferences into authenticated context',
    },
  };

  return merged;
}

contextSyncRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required for context synchronization.' });
    }

    const token = authHeader.slice(7);
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    const uid = decodedToken.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Token missing user identity.' });
    }

    // Validate payload & enforce strict security boundaries
    const validation = validateAndSanitizeSyncPayload(req.body || {}, uid);
    if (!validation.valid || !validation.payload) {
      return res.status(400).json({ error: validation.error || 'Invalid payload.' });
    }

    // Get user details for fallback display name
    let displayName = 'Mama';
    try {
      const userRecord = await adminAuth.getUser(uid);
      if (userRecord.displayName) displayName = userRecord.displayName;
    } catch {
      // Fallback
    }

    // Read existing HealthContext (if any)
    const existing = await getHealthContextForUser(uid);

    // Merge deterministically
    const merged = mergeAnonymousDraftIntoContext(existing, validation.payload, displayName);

    // Persist merged context
    await saveHealthContextForUser(uid, merged, 'context_sync');

    // Ensure users/{uid} is marked as onboarded
    await adminDb.doc(`users/${uid}`).set(
      {
        onboarded: true,
        onboardingVersion: 1,
        onboardingSource: 'anonymous_context_sync',
        onboardingCompletedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res.json({
      success: true,
      context: merged,
      isNew: !existing,
      version: merged.version,
    });
  } catch (error: any) {
    console.error('Context synchronization error', error);
    const status = error instanceof ApiError ? error.status : 500;
    return res.status(status).json({ error: error?.message || 'Context synchronization failed.' });
  }
});
