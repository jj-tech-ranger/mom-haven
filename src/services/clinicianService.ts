import { collection, doc, getDocs, getDoc, updateDoc, query, where, orderBy, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Clinician, ClinicianAccessSession, ClinicianPrivateNote, AuditEvent, MotherProfile, Provenance } from '../types';
import { KENYA_FACILITIES, MEADOWCARE_DEMO_FACILITY } from '../data/kenyaFacilities';

export interface KMHFLFacility { id?: string; code: string; name: string; county: string; subcounty: string; type: string; level: string; }

export interface ClinicianVerificationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'not_found';
  name?: string;
  email?: string;
  facilityName?: string | null;
  cadre?: string;
  rejectionReason?: string;
}

/** Temporary bundled directory entry for development/testing. Remove Meadowcare before production. */
export const KENYA_KMHFL_FACILITIES: KMHFLFacility[] = [
  ...KENYA_FACILITIES.map(f => ({
    id: f.id,
    code: f.code || f.id,
    name: f.name,
    county: f.county,
    subcounty: f.subcounty,
    type: f.type,
    level: f.level || '',
  })),
  {
    id: MEADOWCARE_DEMO_FACILITY.id,
    code: MEADOWCARE_DEMO_FACILITY.code || MEADOWCARE_DEMO_FACILITY.id,
    name: MEADOWCARE_DEMO_FACILITY.name,
    county: MEADOWCARE_DEMO_FACILITY.county,
    subcounty: MEADOWCARE_DEMO_FACILITY.subcounty,
    type: MEADOWCARE_DEMO_FACILITY.type,
    level: MEADOWCARE_DEMO_FACILITY.level || '',
  },
];

export async function getKenyaFacilities(): Promise<KMHFLFacility[]> {
  try {
    const snap = await getDocs(collection(db, 'facilities'));
    const firestoreFacilities = snap.docs.map(d => {
      const data = d.data() as Record<string, any>;
      return {
        id: d.id,
        code: String(data.kmhflCode || data.code || d.id),
        name: String(data.name || ''),
        county: String(data.county || ''),
        subcounty: String(data.subcounty || ''),
        type: String(data.type || ''),
        level: String(data.level || ''),
      } satisfies KMHFLFacility;
    }).filter(f => f.code && f.name);
    const byCode = new Map<string, KMHFLFacility>();
    [...firestoreFacilities, ...KENYA_KMHFL_FACILITIES].forEach(f => byCode.set(f.code, f));
    return Array.from(byCode.values());
  } catch (err) {
    console.warn('Facility directory read failed; using bundled fallback.', err);
    return KENYA_KMHFL_FACILITIES;
  }
}

export async function getClinicianProfile(uid: string): Promise<Clinician | null> {
  try { const snap = await getDoc(doc(db, 'clinicians', uid)); return snap.exists() ? { ...snap.data(), uid: snap.id } as Clinician : null; }
  catch (err) { handleFirestoreError(err, OperationType.GET, `clinicians/${uid}`); return null; }
}

/** Submit the initial clinician application without creating an authenticated account. */
export async function registerClinician(data: {
  name: string;
  email: string;
  licenseNumber: string;
  cadre: string;
  facilityId: string;
  facilityName: string;
}): Promise<{ status: 'pending' }> {
  const response = await fetch('/api/v1/clinician/verification', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let message = 'Failed to submit clinician verification. Please try again.';
    try { const payload = await response.json(); if (payload?.error) message = String(payload.error); } catch { /* safe fallback */ }
    throw new Error(message);
  }
  const result = await response.json();
  return { status: result.status === 'pending' ? 'pending' : 'pending' };
}

/** Public status lookup used only by the clinician verification screen. */
export async function checkClinicianVerification(email: string): Promise<ClinicianVerificationStatus> {
  const response = await fetch(`/api/v1/clinician/verification-status?email=${encodeURIComponent(email.trim().toLowerCase())}`);
  if (!response.ok) {
    let message = 'Unable to check verification status.';
    try { const payload = await response.json(); if (payload?.error) message = String(payload.error); } catch { /* safe fallback */ }
    throw new Error(message);
  }
  return response.json();
}

/** Attach the approved application to the newly-created Firebase email/password account. */
export async function claimApprovedClinician(): Promise<{ uid: string; status: 'approved' }> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous || !user.email) throw new Error('Please create your clinician account first.');
  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/v1/clinician/claim-approved', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    let message = 'Unable to activate the approved clinician account.';
    try { const payload = await response.json(); if (payload?.error) message = String(payload.error); } catch { /* safe fallback */ }
    throw new Error(message);
  }
  const result = await response.json();
  return { uid: user.uid, status: result.status === 'approved' ? 'approved' : 'approved' };
}

export async function redeemClinicShareCode(clinicianUid: string, clinicianName: string, facilityName: string, rawCode: string): Promise<{ success: boolean; session?: ClinicianAccessSession; motherProfile?: MotherProfile; message: string }> {
  try {
    const cleanCode = rawCode.trim().toUpperCase();
    const snap = await getDocs(query(collection(db, 'clinicianAccessSessions'), where('shareCode', '==', cleanCode), where('status', '==', 'active')));
    if (snap.empty) return { success: false, message: 'Invalid or unrecognized Clinic Share Code. Please check the code with the mother.' };
    const sessionDoc = snap.docs[0]; const sessionData = sessionDoc.data() as ClinicianAccessSession;
    if (new Date() > new Date(sessionData.expiresAt)) { await updateDoc(doc(db, 'clinicianAccessSessions', sessionDoc.id), { status: 'expired' }); return { success: false, message: 'This Clinic Share Code has expired. Please ask the mother to generate a new code.' }; }
    await updateDoc(doc(db, 'clinicianAccessSessions', sessionDoc.id), { clinicianId: clinicianUid, clinicianName, facilityName });
    await logAuditEvent({ actorId: clinicianUid, actorRole: 'CLINICIAN', action: 'CLINICIAN_SESSION_STARTED', objectType: 'clinicianAccessSessions', objectId: sessionDoc.id, timestamp: new Date().toISOString(), facilityId: facilityName, details: { motherId: sessionData.motherId, shareCode: cleanCode } });
    const motherSnap = await getDoc(doc(db, 'motherProfiles', sessionData.motherId));
    const motherProfile = motherSnap.exists() ? ({ ...motherSnap.data(), id: motherSnap.id } as MotherProfile) : undefined;
    return { success: true, session: { ...sessionData, id: sessionDoc.id }, motherProfile, message: 'Access granted. Ephemeral clinical session active.' };
  } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'clinicianAccessSessions'); throw err; }
}

export async function logAuditEvent(event: Omit<AuditEvent, 'id'>): Promise<string> {
  try { return (await addDoc(collection(db, 'auditEvents'), { ...event, timestamp: new Date().toISOString() })).id; }
  catch (err) { console.warn('Audit log write error:', err); return ''; }
}

export async function getClinicianAuditEvents(actorId: string): Promise<AuditEvent[]> {
  try { const snap = await getDocs(query(collection(db, 'auditEvents'), where('actorId', '==', actorId), orderBy('timestamp', 'desc'))); return snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditEvent)); }
  catch (err) { handleFirestoreError(err, OperationType.LIST, 'auditEvents'); return []; }
}

export async function stampRecordVerification(recordPath: string, clinicianUid: string, clinicianName: string, facilityName: string, adjustments?: Record<string, any>): Promise<void> {
  try { const docRef = doc(db, recordPath); const provenanceUpdate: Provenance = { status: 'VERIFIED', enteredBy: 'system', enteredAt: new Date().toISOString(), verifiedBy: `${clinicianName} (${facilityName})`, verifiedAt: new Date().toISOString() }; await updateDoc(docRef, { provenance: provenanceUpdate, updatedAt: new Date().toISOString(), ...(adjustments || {}) }); await logAuditEvent({ actorId: clinicianUid, actorRole: 'CLINICIAN', action: 'RECORD_VERIFIED', objectType: recordPath.split('/')[0] || 'record', objectId: docRef.id, timestamp: new Date().toISOString(), facilityId: facilityName, details: { recordPath, adjustments: adjustments || null } }); }
  catch (err) { handleFirestoreError(err, OperationType.WRITE, recordPath); throw err; }
}

export async function addClinicianPrivateNote(motherId: string, clinicianId: string, text: string, childId?: string | null): Promise<string> {
  try { return (await addDoc(collection(db, 'clinicianPrivateNotes'), { motherId, clinicianId, childId: childId || null, text, createdAt: new Date().toISOString() })).id; }
  catch (err) { handleFirestoreError(err, OperationType.CREATE, 'clinicianPrivateNotes'); throw err; }
}

export async function getClinicianPrivateNotes(motherId: string): Promise<ClinicianPrivateNote[]> {
  try { const snap = await getDocs(query(collection(db, 'clinicianPrivateNotes'), where('motherId', '==', motherId), orderBy('createdAt', 'desc'))); return snap.docs.map(d => ({ ...d.data(), id: d.id } as ClinicianPrivateNote)); }
  catch (err) { handleFirestoreError(err, OperationType.LIST, 'clinicianPrivateNotes'); return []; }
}
