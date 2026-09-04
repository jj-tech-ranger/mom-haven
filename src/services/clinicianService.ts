// src/services/clinicianService.ts
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
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Clinician, 
  ClinicianAccessSession, 
  ClinicianPrivateNote, 
  AuditEvent, 
  MotherProfile, 
  Pregnancy, 
  AncEncounter, 
  Child, 
  ChildVaccineRecord, 
  GrowthMeasurement, 
  PostnatalEncounter, 
  NewbornRecord,
  Provenance
} from '../types';

export interface KMHFLFacility {
  code: string;
  name: string;
  county: string;
  subcounty: string;
  type: string;
  level: string;
}

export const KENYA_KMHFL_FACILITIES: KMHFLFacility[] = [
  { code: '13024', name: 'Kariokor Health Centre', county: 'Nairobi', subcounty: 'Kamukunji', type: 'Health Centre', level: 'Level 3' },
  { code: '13123', name: 'Pumwani Maternity Hospital', county: 'Nairobi', subcounty: 'Kamukunji', type: 'Maternity Hospital', level: 'Level 5' },
  { code: '13000', name: 'Kenyatta National Hospital (KNH)', county: 'Nairobi', subcounty: 'Kibra', type: 'National Referral Hospital', level: 'Level 6' },
  { code: '13088', name: 'Mbagathi County Hospital', county: 'Nairobi', subcounty: 'Langata', type: 'County Referral Hospital', level: 'Level 4' },
  { code: '17822', name: 'Mama Lucy Kibaki Hospital', county: 'Nairobi', subcounty: 'Embakasi West', type: 'County Hospital', level: 'Level 5' },
  { code: '11540', name: 'Coast General Teaching & Referral Hospital', county: 'Mombasa', subcounty: 'Mvita', type: 'County Referral Hospital', level: 'Level 5' },
  { code: '15400', name: 'Jaramogi Oginga Odinga Teaching & Referral Hospital', county: 'Kisumu', subcounty: 'Kisumu Central', type: 'Teaching Hospital', level: 'Level 5' },
  { code: '14800', name: 'Nakuru Level 5 Hospital', county: 'Nakuru', subcounty: 'Nakuru Town West', type: 'County Hospital', level: 'Level 5' },
  { code: '15900', name: 'Moi Teaching and Referral Hospital (MTRH)', county: 'Uasin Gishu', subcounty: 'Ainabkoi', type: 'National Referral Hospital', level: 'Level 6' },
  { code: '13800', name: 'Nyeri County Referral Hospital', county: 'Nyeri', subcounty: 'Nyeri Town', type: 'County Referral Hospital', level: 'Level 5' },
];

export async function getClinicianProfile(uid: string): Promise<Clinician | null> {
  try {
    const docRef = doc(db, 'clinicians', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...snap.data(), uid: snap.id } as Clinician;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `clinicians/${uid}`);
    return null;
  }
}

export async function registerClinician(
  uid: string, 
  data: {
    name: string;
    email: string;
    licenseNumber: string;
    cadre: string;
    facilityId: string;
    facilityName: string;
  }
): Promise<{ success: boolean; status: string }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required to submit clinician verification.');
  }

  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/v1/clinician/verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${idToken}`,
      'x-firebase-id-token': idToken,
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      licenseNumber: data.licenseNumber,
      cadre: data.cadre,
      facilityId: data.facilityId,
      facilityName: data.facilityName,
    }),
  });

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(errPayload.error || 'Failed to submit clinician verification.');
  }

  return await response.json();
}

export async function redeemClinicShareCode(
  clinicianUid: string,
  clinicianName: string,
  facilityName: string,
  rawCode: string
): Promise<{ success: boolean; session?: ClinicianAccessSession; motherProfile?: MotherProfile; message: string }> {
  try {
    const cleanCode = rawCode.trim().toUpperCase();
    const colRef = collection(db, 'clinicianAccessSessions');
    const q = query(colRef, where('shareCode', '==', cleanCode), where('status', '==', 'active'));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { 
        success: false, 
        message: 'Invalid or unrecognized Clinic Share Code. Please check the code with the mother.' 
      };
    }

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data() as ClinicianAccessSession;
    const now = new Date();
    const expiryDate = new Date(sessionData.expiresAt);

    if (now > expiryDate) {
      // Mark as expired
      await updateDoc(doc(db, 'clinicianAccessSessions', sessionDoc.id), { status: 'expired' });
      return {
        success: false,
        message: 'This Clinic Share Code has expired (15-minute ephemeral window exceeded). Please ask the mother to generate a new code.'
      };
    }

    // Attach clinician metadata
    await updateDoc(doc(db, 'clinicianAccessSessions', sessionDoc.id), {
      clinicianId: clinicianUid,
      clinicianName,
      facilityName,
    });

    // Write audit event
    await logAuditEvent({
      actorId: clinicianUid,
      actorRole: 'CLINICIAN',
      action: 'CLINICIAN_SESSION_STARTED',
      objectType: 'clinicianAccessSessions',
      objectId: sessionDoc.id,
      timestamp: new Date().toISOString(),
      facilityId: facilityName,
      details: { motherId: sessionData.motherId, shareCode: cleanCode }
    });

    // Fetch basic mother profile
    const motherSnap = await getDoc(doc(db, 'motherProfiles', sessionData.motherId));
    const motherProfile = motherSnap.exists() ? ({ ...motherSnap.data(), id: motherSnap.id } as MotherProfile) : undefined;

    return {
      success: true,
      session: { ...sessionData, id: sessionDoc.id },
      motherProfile,
      message: 'Access granted. Ephemeral clinical session active.'
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'clinicianAccessSessions');
    throw err;
  }
}

export async function logAuditEvent(event: Omit<AuditEvent, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, 'auditEvents');
    const docRef = await addDoc(colRef, {
      ...event,
      timestamp: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('Audit log write error:', err);
    return '';
  }
}

export async function getClinicianAuditEvents(actorId: string): Promise<AuditEvent[]> {
  try {
    const colRef = collection(db, 'auditEvents');
    const q = query(colRef, where('actorId', '==', actorId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditEvent));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'auditEvents');
    return [];
  }
}

// Verification Stamping
export async function stampRecordVerification(
  recordPath: string,
  clinicianUid: string,
  clinicianName: string,
  facilityName: string,
  adjustments?: Record<string, any>
): Promise<void> {
  try {
    const docRef = doc(db, recordPath);
    const provenanceUpdate: Provenance = {
      status: 'VERIFIED',
      enteredBy: 'system',
      enteredAt: new Date().toISOString(),
      verifiedBy: `${clinicianName} (${facilityName})`,
      verifiedAt: new Date().toISOString(),
    };

    const updatePayload: Record<string, any> = {
      provenance: provenanceUpdate,
      updatedAt: new Date().toISOString(),
      ...(adjustments || {})
    };

    await updateDoc(docRef, updatePayload);

    await logAuditEvent({
      actorId: clinicianUid,
      actorRole: 'CLINICIAN',
      action: 'RECORD_VERIFIED',
      objectType: recordPath.split('/')[0] || 'record',
      objectId: docRef.id,
      timestamp: new Date().toISOString(),
      facilityId: facilityName,
      details: { recordPath, adjustments: adjustments || null }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, recordPath);
    throw err;
  }
}

// Private Clinician Notes (never visible to mother/partner)
export async function addClinicianPrivateNote(
  motherId: string,
  clinicianId: string,
  text: string,
  childId?: string | null
): Promise<string> {
  try {
    const colRef = collection(db, 'clinicianPrivateNotes');
    const docRef = await addDoc(colRef, {
      motherId,
      clinicianId,
      childId: childId || null,
      text,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'clinicianPrivateNotes');
    throw err;
  }
}

export async function getClinicianPrivateNotes(motherId: string): Promise<ClinicianPrivateNote[]> {
  try {
    const colRef = collection(db, 'clinicianPrivateNotes');
    const q = query(colRef, where('motherId', '==', motherId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ClinicianPrivateNote));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'clinicianPrivateNotes');
    return [];
  }
}
