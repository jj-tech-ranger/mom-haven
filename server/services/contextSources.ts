import { adminDb } from '../clinicianAccess.js';
import { getHealthContextForUser, ServerHealthContext } from './healthContextService.js';
import { calculateGestationFromLmp } from '../../src/utils/clinicalCalculations.js';
import {
  HavenContextFact,
  HavenPregnancyContext,
  HavenChildContext,
  HavenDerivedTiming,
  HavenContextProvenance,
  PROVENANCE_TRUST_RANK,
} from '../types/havenContext.js';

/**
 * Trust hierarchy comparator.
 * Verified (5) > Authoritative (4) > System-Derived (3) > User-Reported (2) > Anonymous (1)
 */
export function compareProvenance(a: HavenContextProvenance, b: HavenContextProvenance): number {
  return (PROVENANCE_TRUST_RANK[a] || 0) - (PROVENANCE_TRUST_RANK[b] || 0);
}

export function resolveFactByTrust<T>(
  preferredFact?: HavenContextFact<T> | null,
  fallbackFact?: HavenContextFact<T> | null,
): HavenContextFact<T> | undefined {
  if (!preferredFact) return fallbackFact ?? undefined;
  if (!fallbackFact) return preferredFact;
  return compareProvenance(preferredFact.provenance, fallbackFact.provenance) >= 0
    ? preferredFact
    : fallbackFact;
}

/**
 * Calculates a child's age in months and a human-readable display string
 * deterministically given their date of birth.
 */
export function calculateChildAge(dobString: string, asOf: Date = new Date()): { ageMonths: number; ageFormatted: string } | null {
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;
  const diffTime = asOf.getTime() - dob.getTime();
  if (diffTime < 0) return { ageMonths: 0, ageFormatted: 'Newborn' };

  let months = (asOf.getFullYear() - dob.getFullYear()) * 12 + (asOf.getMonth() - dob.getMonth());
  if (asOf.getDate() < dob.getDate()) {
    months = Math.max(0, months - 1);
  }

  const totalDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  let ageFormatted = '';
  if (months === 0) {
    const weeks = Math.floor(totalDays / 7);
    ageFormatted = weeks === 0 ? 'Newborn' : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`;
  } else if (years === 0) {
    ageFormatted = `${months} ${months === 1 ? 'month' : 'months'} old`;
  } else {
    ageFormatted = remainingMonths === 0
      ? `${years} ${years === 1 ? 'year' : 'years'} old`
      : `${years} yr ${remainingMonths} mo old`;
  }

  return { ageMonths: months, ageFormatted };
}

export interface ClinicalPregnancyRecord {
  id: string;
  status: string;
  lmp?: string;
  edd?: string;
  gestationalAgeWeeks?: number;
  gravida?: number;
  parity?: number;
  verifiedAt?: string;
}

export interface ClinicalChildRecord {
  id: string;
  name?: string;
  dateOfBirth?: string;
  sex?: string;
  verifiedAt?: string;
}

/**
 * Fetches user metadata from Firestore with strict minimization.
 * Never leaks phone, nationalId, or private credentials.
 */
export async function fetchUserContext(uid: string): Promise<{ role?: string; displayName?: string } | null> {
  if (!uid) return null;
  try {
    const snapshot = await adminDb.collection('users').doc(uid).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    return {
      role: typeof data?.role === 'string' ? data.role : undefined,
      displayName: typeof data?.displayName === 'string' ? data.displayName : undefined,
    };
  } catch (error) {
    console.warn(`[ContextSources] Could not fetch user context for ${uid}:`, error);
    return null;
  }
}

/**
 * Fetches personalization context from Firestore healthContexts collection.
 */
export async function fetchPersonalizationContext(uid: string): Promise<ServerHealthContext | null> {
  if (!uid) return null;
  try {
    return await getHealthContextForUser(uid);
  } catch (error) {
    console.warn(`[ContextSources] Could not fetch personalization context for ${uid}:`, error);
    return null;
  }
}

/**
 * Fetches the active pregnancy record from Firestore pregnancies collection.
 * Context minimization: Only returns clinical fields necessary for maternal companion care.
 * Never includes clinician private notes or sensitive facility identifiers.
 */
export async function fetchClinicalPregnancyContext(uid: string): Promise<ClinicalPregnancyRecord | null> {
  if (!uid) return null;
  try {
    const snapshot = await adminDb
      .collection('pregnancies')
      .where('motherId', '==', uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      status: typeof data.status === 'string' ? data.status : 'active',
      lmp: typeof data.lmp === 'string' ? data.lmp : undefined,
      edd: typeof data.edd === 'string' ? data.edd : undefined,
      gestationalAgeWeeks: typeof data.gestationalAgeWeeks === 'number' ? data.gestationalAgeWeeks : undefined,
      gravida: typeof data.gravida === 'number' ? data.gravida : undefined,
      parity: typeof data.parity === 'number' ? data.parity : undefined,
      verifiedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    };
  } catch (error) {
    console.warn(`[ContextSources] Could not fetch clinical pregnancy for ${uid}:`, error);
    return null;
  }
}

/**
 * Fetches verified children records from Firestore children collection.
 * Context minimization: Caps at 5 children and strips diagnostic or encounter data.
 */
export async function fetchClinicalChildrenContext(uid: string): Promise<ClinicalChildRecord[]> {
  if (!uid) return [];
  try {
    const snapshot = await adminDb
      .collection('children')
      .where('motherId', '==', uid)
      .limit(5)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: typeof data.name === 'string' ? data.name : undefined,
        dateOfBirth: typeof data.dateOfBirth === 'string' ? data.dateOfBirth : undefined,
        sex: typeof data.sex === 'string' ? data.sex : undefined,
        verifiedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
      };
    });
  } catch (error) {
    console.warn(`[ContextSources] Could not fetch clinical children for ${uid}:`, error);
    return [];
  }
}

/**
 * Combines clinical pregnancy records and user-reported pregnancy preferences into
 * a provenance-aware HavenPregnancyContext and derived timing, strictly adhering to
 * the trust hierarchy (Verified clinical > System derived > User reported).
 */
export function resolvePregnancyContext(
  clinical: ClinicalPregnancyRecord | null,
  personalization: ServerHealthContext | null,
  asOf: Date = new Date(),
): {
  pregnancyFact?: HavenContextFact<HavenPregnancyContext>;
  derivedTimingFact?: HavenContextFact<HavenDerivedTiming>;
} {
  if (clinical) {
    let gestationalAgeWeeks = clinical.gestationalAgeWeeks;
    let trimester: 1 | 2 | 3 | undefined;
    let daysRemaining: number | undefined;

    if (clinical.lmp) {
      try {
        const calculation = calculateGestationFromLmp(clinical.lmp, asOf);
        gestationalAgeWeeks = calculation.gestationalAgeWeeks;
        trimester = calculation.trimester;
        daysRemaining = calculation.daysRemaining;
      } catch {
        // Fall back to recorded gestational age
      }
    }

    const pregnancyData: HavenPregnancyContext = {
      id: clinical.id,
      status: clinical.status,
      gestationalAgeWeeks,
      trimester,
      edd: clinical.edd,
      lmp: clinical.lmp,
      gravida: clinical.gravida,
      parity: clinical.parity,
      multiplePregnancy: personalization?.pregnancy?.multiplePregnancy,
    };

    const pregnancyFact: HavenContextFact<HavenPregnancyContext> = {
      value: pregnancyData,
      provenance: 'VERIFIED',
      source: 'pregnancies',
      verifiedAt: clinical.verifiedAt,
    };

    let derivedTimingFact: HavenContextFact<HavenDerivedTiming> | undefined;
    if (gestationalAgeWeeks !== undefined || trimester !== undefined) {
      derivedTimingFact = {
        value: {
          currentGestationalWeeks: gestationalAgeWeeks,
          trimester,
          daysRemainingToEdd: daysRemaining,
        },
        provenance: 'SYSTEM_DERIVED',
        source: 'clinicalCalculations',
      };
    }

    return { pregnancyFact, derivedTimingFact };
  }

  // Fallback: Check if user reported pregnancy signals in health context
  if (personalization?.pregnancy) {
    const preg = personalization.pregnancy;
    const week = preg.pregnancyWeek;
    let trimester: 1 | 2 | 3 | undefined;
    if (typeof week === 'number') {
      if (week >= 28) trimester = 3;
      else if (week >= 13) trimester = 2;
      else if (week > 0) trimester = 1;
    }

    const userReportedPregnancy: HavenPregnancyContext = {
      id: 'user-reported-pregnancy',
      status: 'active',
      gestationalAgeWeeks: week,
      trimester,
      edd: preg.dueDate,
      multiplePregnancy: preg.multiplePregnancy,
    };

    return {
      pregnancyFact: {
        value: userReportedPregnancy,
        provenance: 'USER_REPORTED',
        source: 'healthContexts.pregnancy',
      },
      derivedTimingFact: trimester ? {
        value: {
          currentGestationalWeeks: week,
          trimester,
        },
        provenance: 'USER_REPORTED',
        source: 'healthContexts.pregnancy',
      } : undefined,
    };
  }

  return {};
}

/**
 * Resolves children context with trust hierarchy:
 * Clinical children records (VERIFIED) take precedence over self-reported childAgeBracket (USER_REPORTED).
 */
export function resolveChildrenContext(
  clinicalChildren: ClinicalChildRecord[],
  personalization: ServerHealthContext | null,
  asOf: Date = new Date(),
): Array<HavenContextFact<HavenChildContext>> {
  if (clinicalChildren.length > 0) {
    return clinicalChildren.map((child) => {
      let ageMonths: number | undefined;
      let ageFormatted: string | undefined;

      if (child.dateOfBirth) {
        const ageCalc = calculateChildAge(child.dateOfBirth, asOf);
        if (ageCalc) {
          ageMonths = ageCalc.ageMonths;
          ageFormatted = ageCalc.ageFormatted;
        }
      }

      return {
        value: {
          id: child.id,
          name: child.name,
          dateOfBirth: child.dateOfBirth,
          ageMonths,
          ageFormatted,
          sex: child.sex,
        },
        provenance: 'VERIFIED',
        source: 'children',
        verifiedAt: child.verifiedAt,
      };
    });
  }

  // Fallback: If user self-reported child bracket in personalization context
  if (personalization?.childAgeBracket) {
    return [
      {
        value: {
          id: 'user-reported-child',
          name: undefined,
          ageFormatted: personalization.childAgeBracket,
        },
        provenance: 'USER_REPORTED',
        source: 'healthContexts.childAgeBracket',
      },
    ];
  }

  return [];
}
