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
import { Pregnancy, AncEncounter, Child, Provenance } from '../types';

export interface GestationCalculation {
  lmp: string;
  edd: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  trimester: 1 | 2 | 3;
  daysRemaining: number;
}

export function calculateGestationFromLmp(lmpString: string): GestationCalculation {
  const lmpDate = new Date(lmpString);
  const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
  const today = new Date();
  
  const diffTime = today.getTime() - lmpDate.getTime();
  const totalDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const weeks = Math.min(42, Math.floor(totalDays / 7));
  const days = totalDays % 7;
  
  const remainingTime = eddDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

  let trimester: 1 | 2 | 3 = 1;
  if (weeks >= 28) {
    trimester = 3;
  } else if (weeks >= 13) {
    trimester = 2;
  }

  return {
    lmp: lmpDate.toISOString().split('T')[0],
    edd: eddDate.toISOString().split('T')[0],
    gestationalAgeWeeks: weeks,
    gestationalAgeDays: days,
    trimester,
    daysRemaining,
  };
}

export function calculateLmpFromEdd(eddString: string): GestationCalculation {
  const eddDate = new Date(eddString);
  const lmpDate = new Date(eddDate.getTime() - 280 * 24 * 60 * 60 * 1000);
  return calculateGestationFromLmp(lmpDate.toISOString().split('T')[0]);
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
      return {
        ...data,
        id: d.id,
        gestationalAgeWeeks,
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'pregnancies');
    return null;
  }
}

export async function createActivePregnancy(
  motherId: string, 
  lmp: string, 
  edd: string, 
  history?: { gravida?: number; parity?: number; previousOutcomes?: string[] }
): Promise<string> {
  try {
    const calc = calculateGestationFromLmp(lmp);
    const pregRef = collection(db, 'pregnancies');
    const newDoc = await addDoc(pregRef, {
      motherId,
      status: 'active',
      lmp,
      edd,
      gestationalAgeWeeks: calc.gestationalAgeWeeks,
      gravida: history?.gravida || 1,
      parity: history?.parity || 0,
      previousOutcomes: history?.previousOutcomes || [],
      createdAt: new Date().toISOString(),
    });
    return newDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'pregnancies');
    throw err;
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

export async function addAncEncounter(
  pregnancyId: string, 
  encounter: Omit<AncEncounter, 'id'>
): Promise<string> {
  try {
    const encRef = collection(db, `pregnancies/${pregnancyId}/ancEncounters`);
    const docRef = await addDoc(encRef, {
      ...encounter,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `pregnancies/${pregnancyId}/ancEncounters`);
    throw err;
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
    // 1. Mark pregnancy completed
    const pregRef = doc(db, 'pregnancies', pregnancyId);
    await updateDoc(pregRef, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      outcomeDetails: outcome,
    });

    // 2. Create child record
    const childRef = collection(db, 'children');
    const childDoc = await addDoc(childRef, {
      motherId,
      pregnancyId,
      name: baby.name || `Baby ${outcome.outcomeType === 'Live Birth' ? '' : 'Angel'}`,
      dateOfBirth: outcome.deliveryDate,
      sex: baby.sex,
      createdAt: new Date().toISOString(),
    });

    // 3. Create initial newborn record in child subcollection
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

    return childDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'children');
    throw err;
  }
}
