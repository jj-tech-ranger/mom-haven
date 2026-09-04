import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Pregnancy, AncEncounter, Child, Provenance, PregnancySummary, PreviousPregnancyRecord } from '../types';
import { reconcileMotherClinicalReminders } from './reminderGenerationService';
import {
  calculateGestationFromLmp,
  calculateLmpFromEdd,
  computeGestationalHeroMetrics,
  type GestationCalculation,
} from '../utils/clinicalCalculations';

export type { GestationCalculation } from '../utils/clinicalCalculations';
export { calculateGestationFromLmp, calculateLmpFromEdd } from '../utils/clinicalCalculations';

/**
 * Migration helper: converts string-based previousOutcomes into structured PreviousPregnancyRecord objects (MOH Handbook p.6)
 */
export function convertOutcomesToPreviousPregnancies(outcomes: string[]): PreviousPregnancyRecord[] {
  return outcomes.map((outcomeStr, idx) => ({
    id: `migrated-${idx + 1}-${Date.now()}`,
    pregnancyOrder: idx + 1,
    outcome: outcomeStr.includes('Alive') ? 'Alive and well'
      : outcomeStr.includes('Stillbirth') ? 'Fresh stillbirth'
      : outcomeStr.includes('Miscarriage') ? 'Abortion / Miscarriage'
      : outcomeStr,
    notes: outcomeStr,
  }));
}

/**
 * Strategy Choice: Option (a) Narrowly-scoped partner projection.
 * Why this approach:
 * 1. firestore.rules explicitly blocks partners from reading `/pregnancies`
 *    (`!isPartner() && !isClinician()`) to protect clinical data (ANC encounters,
 *    clinical notes, gravida/parity history).
 * 2. Creating and synchronizing a dedicated projection at `/pregnancySummaries/{motherId}`
 *    (and mirror `/partnerShares/{motherId}`) allows active partners (`activePartner(motherId)`)
 *    to read only logistics & gestational milestones without exposing clinical records.
 */
export async function syncPregnancySummary(
  motherId: string,
  pregnancy: Partial<Pregnancy> | null,
  motherName?: string
): Promise<void> {
  if (!motherId) return;

  try {
    let summary: PregnancySummary;

    if (!pregnancy || pregnancy.status === 'completed') {
      summary = {
        motherId,
        motherName,
        hasActivePregnancy: false,
        pregnancyId: pregnancy?.id,
        gestationalAgeWeeks: 0,
        gestationalWeeks: 0,
        trimester: 1,
        daysRemaining: 0,
        weeksRemaining: 0,
        status: pregnancy?.status === 'completed' ? 'completed' : 'none',
        updatedAt: new Date().toISOString(),
      };
    } else {
      const metrics = computeGestationalHeroMetrics(pregnancy);
      summary = {
        motherId,
        motherName,
        hasActivePregnancy: true,
        pregnancyId: pregnancy.id,
        lmp: pregnancy.lmp,
        edd: pregnancy.edd,
        eddFormatted: metrics?.eddFormatted,
        gestationalAgeWeeks: metrics?.gestationalAgeWeeks || pregnancy.gestationalAgeWeeks || 0,
        gestationalWeeks: metrics?.gestationalWeeks || pregnancy.gestationalAgeWeeks || 0,
        trimester: metrics?.trimester || 1,
        daysRemaining: metrics?.daysRemaining || 0,
        weeksRemaining: metrics?.weeksRemaining || 0,
        status: 'active',
        babyMilestone: metrics?.babySize,
        updatedAt: new Date().toISOString(),
      };
    }

    const summariesRef = doc(db, 'pregnancySummaries', motherId);
    const sharesRef = doc(db, 'partnerShares', motherId);

    await Promise.allSettled([
      setDoc(summariesRef, summary, { merge: true }),
      setDoc(sharesRef, summary, { merge: true }),
    ]);
  } catch (err) {
    console.warn('[pregnancyService] Could not sync pregnancy summary projection', err);
  }
}

export async function getPregnancySummary(motherId: string): Promise<PregnancySummary | null> {
  if (!motherId) return null;
  try {
    const sumRef = doc(db, 'pregnancySummaries', motherId);
    const sumSnap = await getDoc(sumRef);
    if (sumSnap.exists()) {
      return sumSnap.data() as PregnancySummary;
    }

    const shareRef = doc(db, 'partnerShares', motherId);
    const shareSnap = await getDoc(shareRef);
    if (shareSnap.exists()) {
      return shareSnap.data() as PregnancySummary;
    }

    return null;
  } catch (err) {
    console.warn('[pregnancyService] Could not fetch pregnancy summary projection', err);
    return null;
  }
}

export async function getActivePregnancy(motherId: string): Promise<Pregnancy | null> {
  try {
    const pregRef = collection(db, 'pregnancies');
    const q = query(
      pregRef, 
      where('motherId', '==', motherId), 
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data() as Pregnancy;
      // Recompute gestational age weeks in real-time if LMP exists
      let gestationalAgeWeeks = data.gestationalAgeWeeks || 0;
      if (data.lmp) {
        const calc = calculateGestationFromLmp(data.lmp);
        gestationalAgeWeeks = calc.gestationalAgeWeeks;
      }
      const fullPregnancy = {
        ...data,
        id: d.id,
        gestationalAgeWeeks,
      };

      // Opportunistically update the partner-readable summary projection
      syncPregnancySummary(motherId, fullPregnancy).catch(() => {});

      return fullPregnancy;
    }

    // If query returned empty for a partner, check if a summary projection exists
    const summary = await getPregnancySummary(motherId);
    if (summary && summary.hasActivePregnancy) {
      return {
        id: summary.pregnancyId || `summary_${motherId}`,
        motherId,
        status: 'active',
        lmp: summary.lmp,
        edd: summary.edd,
        gestationalAgeWeeks: summary.gestationalAgeWeeks,
        createdAt: summary.updatedAt || new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    // Under firestore.rules line 14:
    // allow read: if signed() && resource.data.motherId == request.auth.uid && !isPartner() && !isClinician() && !isAdmin()
    // Partners are explicitly denied direct access to /pregnancies.
    // Fall back to the partner-accessible projection (pregnancySummaries / partnerShares).
    try {
      const summary = await getPregnancySummary(motherId);
      if (summary && summary.hasActivePregnancy) {
        return {
          id: summary.pregnancyId || `summary_${motherId}`,
          motherId,
          status: 'active',
          lmp: summary.lmp,
          edd: summary.edd,
          gestationalAgeWeeks: summary.gestationalAgeWeeks,
          createdAt: summary.updatedAt || new Date().toISOString(),
        };
      }
    } catch {
      // Ignore projection read errors
    }

    handleFirestoreError(err, OperationType.GET, 'pregnancies');
    return null;
  }
}

export async function createActivePregnancy(
  motherId: string, 
  lmp: string, 
  edd: string, 
  history?: {
    gravida?: number;
    parity?: number;
    previousOutcomes?: string[];
    previousPregnancies?: PreviousPregnancyRecord[];
  }
): Promise<string> {
  try {
    const calc = calculateGestationFromLmp(lmp);
    const pregRef = collection(db, 'pregnancies');

    const structuredPrevious: PreviousPregnancyRecord[] =
      history?.previousPregnancies && history.previousPregnancies.length > 0
        ? history.previousPregnancies
        : history?.previousOutcomes && history.previousOutcomes.length > 0
        ? convertOutcomesToPreviousPregnancies(history.previousOutcomes)
        : [];

    const newDoc = await addDoc(pregRef, {
      motherId,
      status: 'active',
      lmp,
      edd,
      gestationalAgeWeeks: calc.gestationalAgeWeeks,
      gravida: history?.gravida || 1,
      parity: history?.parity || 0,
      previousOutcomes: history?.previousOutcomes || [],
      previousPregnancies: structuredPrevious,
      createdAt: new Date().toISOString(),
    });

    syncPregnancySummary(motherId, {
      id: newDoc.id,
      motherId,
      status: 'active',
      lmp,
      edd,
      gestationalAgeWeeks: calc.gestationalAgeWeeks,
    }).catch(() => {});

    // Automatically generate scheduled ANC reminders from Kenya MOH schedule (Prompt 2.2)
    reconcileMotherClinicalReminders(motherId, {
      activePregnancy: {
        id: newDoc.id,
        motherId,
        status: 'active',
        lmp,
        edd,
        gestationalAgeWeeks: calc.gestationalAgeWeeks,
        createdAt: new Date().toISOString(),
      },
    }).catch((reconcileErr) => {
      console.warn('[pregnancyService] Reminder auto-generation notice:', reconcileErr);
    });

    return newDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'pregnancies');
    throw err;
  }
}

/**
 * Migration routine: reads pregnancy document, and if it has previousOutcomes but no previousPregnancies,
 * converts strings to structured PreviousPregnancyRecord[] and writes back to Firestore.
 */
export async function migratePregnancyOutcomes(pregnancyId: string): Promise<PreviousPregnancyRecord[]> {
  try {
    const pregRef = doc(db, 'pregnancies', pregnancyId);
    const snap = await getDoc(pregRef);
    if (!snap.exists()) return [];

    const data = snap.data();
    if (data.previousPregnancies && Array.isArray(data.previousPregnancies) && data.previousPregnancies.length > 0) {
      return data.previousPregnancies;
    }

    if (data.previousOutcomes && Array.isArray(data.previousOutcomes) && data.previousOutcomes.length > 0) {
      const migrated = convertOutcomesToPreviousPregnancies(data.previousOutcomes);
      await updateDoc(pregRef, {
        previousPregnancies: migrated,
        updatedAt: new Date().toISOString(),
      });
      return migrated;
    }

    return [];
  } catch (err) {
    console.warn('[pregnancyService] migratePregnancyOutcomes notice:', err);
    return [];
  }
}

export async function updatePregnancy(pregnancyId: string, data: Partial<Pregnancy>): Promise<void> {
  try {
    const pregRef = doc(db, 'pregnancies', pregnancyId);
    await updateDoc(pregRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `pregnancies/${pregnancyId}`);
    throw err;
  }
}

export async function getAncEncounters(pregnancyId: string): Promise<AncEncounter[]> {
  try {
    const encRef = collection(db, `pregnancies/${pregnancyId}/ancEncounters`);
    const q = query(encRef, orderBy('visitNumber', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as AncEncounter));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `pregnancies/${pregnancyId}/ancEncounters`);
    return [];
  }
}

import { SyncEngine } from './syncEngine';

export async function addAncEncounter(
  pregnancyId: string, 
  encounter: Omit<AncEncounter, 'id'>
): Promise<string> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    const res = await SyncEngine.saveAncEncounterOfflineAware(pregnancyId, encounter);
    return res.id;
  }
  try {
    const encRef = collection(db, `pregnancies/${pregnancyId}/ancEncounters`);
    const docRef = await addDoc(encRef, {
      ...encounter,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('[pregnancyService] Direct addAncEncounter failed, queuing offline outbox:', err);
    const res = await SyncEngine.saveAncEncounterOfflineAware(pregnancyId, encounter);
    return res.id;
  }
}

export async function updateAncEncounter(
  pregnancyId: string,
  encounterId: string,
  data: Partial<AncEncounter>
): Promise<void> {
  try {
    const docRef = doc(db, `pregnancies/${pregnancyId}/ancEncounters`, encounterId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `pregnancies/${pregnancyId}/ancEncounters/${encounterId}`);
    throw err;
  }
}

export async function completePregnancyTransition(
  motherId: string,
  pregnancyId: string,
  outcome: {
    deliveryDate: string;
    deliveryTime?: string;
    deliveryType: 'SVD' | 'CS' | 'Assisted';
    outcomeType: 'Live Birth' | 'Multiple Birth' | 'Stillbirth';
    facilityName?: string;
    attendantCadre?: string;
  },
  baby: {
    name?: string;
    sex: 'male' | 'female';
    birthWeightKg: number;
    birthLengthCm?: number;
    headCircumferenceCm?: number;
    apgarScore?: string;
  }
): Promise<string> {
  try {
    const pregRef = doc(db, 'pregnancies', pregnancyId);
    await updateDoc(pregRef, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      outcomeDetails: outcome,
    });

    syncPregnancySummary(motherId, {
      id: pregnancyId,
      motherId,
      status: 'completed',
    }).catch(() => {});

    const childRef = collection(db, 'children');
    const childDoc = await addDoc(childRef, {
      motherId,
      pregnancyId,
      name: baby.name || `Baby ${outcome.outcomeType === 'Live Birth' ? '' : 'Angel'}`,
      dateOfBirth: outcome.deliveryDate,
      sex: baby.sex,
      createdAt: new Date().toISOString(),
    });

    const nbRef = collection(db, `children/${childDoc.id}/newbornRecords`);
    const provenance: Provenance = {
      status: 'REPORTED',
      enteredBy: motherId,
      enteredAt: new Date().toISOString(),
      verifiedBy: null,
      verifiedAt: null,
    };

    await addDoc(nbRef, {
      childId: childDoc.id,
      birthWeightKg: baby.birthWeightKg,
      birthLengthCm: baby.birthLengthCm || 0,
      headCircumferenceCm: baby.headCircumferenceCm || 0,
      apgarScore: baby.apgarScore || '',
      deliveryType: outcome.deliveryType,
      facilityName: outcome.facilityName || '',
      provenance,
    });

    // Auto-generate PNC contact reminders & newborn KEPI vaccines (Prompt 2.2)
    reconcileMotherClinicalReminders(motherId, {
      newOutcome: {
        deliveryDate: outcome.deliveryDate,
        pregnancyId,
        childId: childDoc.id,
      },
      children: [{
        id: childDoc.id,
        motherId,
        name: baby.name || 'Baby',
        dateOfBirth: outcome.deliveryDate,
        sex: baby.sex,
        createdAt: new Date().toISOString(),
      }],
    }).catch((reconcileErr) => {
      console.warn('[pregnancyService] Transition reminder auto-generation notice:', reconcileErr);
    });

    return childDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'children');
    throw err;
  }
}
