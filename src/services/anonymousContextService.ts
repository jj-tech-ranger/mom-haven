// src/services/anonymousContextService.ts
import type { User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  FORBIDDEN_CLINICAL_FIELDS,
  type HealthContext,
  type LifecycleStage,
} from '../types/healthContext';
import {
  getHealthContext,
  mergeHealthContext,
  saveHealthContext,
} from './healthContextService';

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
  preferredName?: string;
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

  // Preferred name
  if (typeof clean.preferredName === 'string' && clean.preferredName.trim().length > 0) {
    result.preferredName = clean.preferredName.trim();
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
        location: {
          county: draft.county,
          subcounty: draft.subcounty,
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
