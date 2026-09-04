// src/services/childService.ts
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
  addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Child, 
  NewbornRecord, 
  PostnatalEncounter, 
  ChildVaccineRecord, 
  GrowthMeasurement, 
  ChildMilestoneRecord,
  Provenance
} from '../types';
import { reconcileMotherClinicalReminders } from './reminderGenerationService';

export function calculateChildAge(dobString: string): {
  totalDays: number;
  months: number;
  days: number;
  ageFormatted: string;
} {
  const dob = new Date(dobString);
  const now = new Date();
  
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const totalDays = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)));

  let ageFormatted = '';
  if (totalMonths < 1) {
    ageFormatted = `${days} day${days === 1 ? '' : 's'} old`;
  } else if (years < 1) {
    ageFormatted = `${totalMonths} mo${totalMonths === 1 ? '' : 's'}${days > 0 ? `, ${days}d` : ''}`;
  } else {
    ageFormatted = `${years} yr${years === 1 ? '' : 's'}${months > 0 ? `, ${months} mo` : ''}`;
  }

  return {
    totalDays,
    months: totalMonths,
    days,
    ageFormatted
  };
}

export async function getChildren(motherId: string): Promise<Child[]> {
  try {
    const colRef = collection(db, 'children');
    const q = query(colRef, where('motherId', '==', motherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as Child));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'children');
    return [];
  }
}

export async function createChild(
  motherId: string,
  data: {
    name: string;
    dob: string;
    sex: 'male' | 'female';
    birthWeightKg?: number;
    birthLengthCm?: number;
    headCircumferenceCm?: number;
    pregnancyId?: string;
  }
): Promise<string> {
  try {
    const colRef = collection(db, 'children');
    const childDoc = await addDoc(colRef, {
      motherId,
      name: data.name,
      dateOfBirth: data.dob,
      sex: data.sex,
      birthWeightKg: data.birthWeightKg || null,
      birthLengthCm: data.birthLengthCm || null,
      headCircumferenceCm: data.headCircumferenceCm || null,
      pregnancyId: data.pregnancyId || null,
      createdAt: new Date().toISOString(),
      provenance: {
        status: 'REPORTED',
        enteredBy: motherId,
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      }
    });

    // Auto-generate KEPI vaccine doses and Vitamin A/Deworming reminders (Prompt 2.2)
    reconcileMotherClinicalReminders(motherId, {
      children: [{
        id: childDoc.id,
        motherId,
        name: data.name,
        dateOfBirth: data.dob,
        sex: data.sex,
        createdAt: new Date().toISOString(),
      }],
    }).catch((reconcileErr) => {
      console.warn('[childService] Child reminder auto-generation notice:', reconcileErr);
    });

    return childDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'children');
    throw err;
  }
}

// Newborn Records
export async function getNewbornRecords(childId: string): Promise<NewbornRecord[]> {
  try {
    const colRef = collection(db, `children/${childId}/newbornRecords`);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as NewbornRecord));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `children/${childId}/newbornRecords`);
    return [];
  }
}

export async function addNewbornRecord(childId: string, record: Omit<NewbornRecord, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, `children/${childId}/newbornRecords`);
    const docRef = await addDoc(colRef, {
      ...record,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `children/${childId}/newbornRecords`);
    throw err;
  }
}

// Postnatal (PNC) Encounters
export async function getPostnatalEncounters(childId: string): Promise<PostnatalEncounter[]> {
  try {
    const colRef = collection(db, `children/${childId}/postnatalEncounters`);
    const q = query(colRef, orderBy('visitDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as PostnatalEncounter));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `children/${childId}/postnatalEncounters`);
    return [];
  }
}

export async function addPostnatalEncounter(childId: string, encounter: Omit<PostnatalEncounter, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, `children/${childId}/postnatalEncounters`);
    const docRef = await addDoc(colRef, {
      ...encounter,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `children/${childId}/postnatalEncounters`);
    throw err;
  }
}

// Immunization Records
export async function getImmunizationRecords(childId: string): Promise<ChildVaccineRecord[]> {
  try {
    const colRef = collection(db, `children/${childId}/immunizationRecords`);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as ChildVaccineRecord));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `children/${childId}/immunizationRecords`);
    return [];
  }
}

export async function addImmunizationRecord(childId: string, record: Omit<ChildVaccineRecord, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, `children/${childId}/immunizationRecords`);
    const docRef = await addDoc(colRef, {
      ...record,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `children/${childId}/immunizationRecords`);
    throw err;
  }
}

// Growth & MUAC Measurements
export async function getGrowthMeasurements(childId: string): Promise<GrowthMeasurement[]> {
  try {
    const colRef = collection(db, `children/${childId}/growthMeasurements`);
    const q = query(colRef, orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as GrowthMeasurement));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `children/${childId}/growthMeasurements`);
    return [];
  }
}

export async function addGrowthMeasurement(childId: string, measurement: Omit<GrowthMeasurement, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, `children/${childId}/growthMeasurements`);
    const docRef = await addDoc(colRef, {
      ...measurement,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `children/${childId}/growthMeasurements`);
    throw err;
  }
}

// Developmental Milestones
export async function getMilestoneRecords(childId: string): Promise<ChildMilestoneRecord[]> {
  try {
    const colRef = collection(db, `children/${childId}/milestoneRecords`);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as ChildMilestoneRecord));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `children/${childId}/milestoneRecords`);
    return [];
  }
}

export async function toggleMilestoneRecord(
  childId: string, 
  milestoneId: string, 
  domain: string,
  achieved: boolean,
  motherId: string
): Promise<void> {
  try {
    const docRef = doc(db, `children/${childId}/milestoneRecords`, milestoneId);
    if (achieved) {
      await setDoc(docRef, {
        childId,
        milestoneId,
        domain,
        achievedDate: new Date().toISOString(),
        provenance: {
          status: 'REPORTED',
          enteredBy: motherId,
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        }
      });
    } else {
      // mark unachieved or delete
      await setDoc(docRef, {
        childId,
        milestoneId,
        domain,
        achievedDate: null,
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `children/${childId}/milestoneRecords/${milestoneId}`);
  }
}

// Illness & IMCI Records
export async function getIllnessRecords(childId: string): Promise<any[]> {
  try {
    const colRef = collection(db, `children/${childId}/illnessRecords`);
    const q = query(colRef, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `children/${childId}/illnessRecords`);
    return [];
  }
}

export async function addIllnessRecord(childId: string, record: any): Promise<string> {
  try {
    const colRef = collection(db, `children/${childId}/illnessRecords`);
    const docRef = await addDoc(colRef, {
      ...record,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `children/${childId}/illnessRecords`);
    throw err;
  }
}

// MUAC Measurements
export async function getMuacMeasurements(childId: string): Promise<any[]> {
  try {
    const colRef = collection(db, `children/${childId}/muacMeasurements`);
    const q = query(colRef, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `children/${childId}/muacMeasurements`);
    return [];
  }
}

export async function addMuacMeasurement(childId: string, measurement: any): Promise<string> {
  try {
    const colRef = collection(db, `children/${childId}/muacMeasurements`);
    const docRef = await addDoc(colRef, {
      ...measurement,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `children/${childId}/muacMeasurements`);
    throw err;
  }
}

