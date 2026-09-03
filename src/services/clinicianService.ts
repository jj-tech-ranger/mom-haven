import { collection, doc, getDocs, getDoc, updateDoc, query, where, orderBy, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Clinician, ClinicianAccessSession, ClinicianPrivateNote, AuditEvent, MotherProfile, Provenance } from '../types';

export interface KMHFLFacility { code: string; name: string; county: string; subcounty: string; type: string; level: string; }

/**
 * Static fallback kept for deployments that intentionally bundle facility data.
 * The production registration flow reads the authoritative Firestore facilities
 * collection first, so newly provisioned facilities become available without a rebuild.
 */
export const KENYA_KMHFL_FACILITIES: KMHFLFacility[] = [];

export async function getKenyaFacilities(): Promise<KMHFLFacility[]> {
  try {
    const snap = await getDocs(collection(db, 'facilities'));
    const facilities = snap.docs.map(d => {
      const data = d.data() as Record<string, any>;
      return {
        code: String(data.kmhflCode || data.code || data.id || d.id),
        name: String(data.name || ''),
        county: String(data.county || ''),
        subcounty: String(data.subcounty || ''),
        type: String(data.type || ''),
        level: String(data.level || ''),
      } satisfies KMHFLFacility;
    }).filter(f => f.code && f.name);

    return facilities.length ? facilities : KENYA_KMHFL_FACILITIES;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'facilities');
    return KENYA_KMHFL_FACILITIES;
  }
}

export async function getClinicianProfile(uid: string): Promise<Clinician | null> {
  try { const snap = await getDoc(doc(db, 'clinicians', uid)); return snap.exists() ? { ...snap.data(), uid: snap.id } as Clinician : null; }
  catch (err) { handleFirestoreError(err, OperationType.GET, `clinicians/${uid}`); return null; }
}

/**
 * Submit clinician credentialing using the Firebase Auth user's real UID.
 * The server is the only writer for clinician records; this prevents a client
 * from manufacturing a clinician UID or self-approving a credential record.
 */
export async function registerClinician(data: {
  licenseNumber: string;
  cadre: string;
  facilityId: string;
  facilityName: string;
}): Promise<{ uid: string; status: 'pending' }> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Please continue with Google before submitting clinician access.');

  const idToken = await user.getIdToken();
  const response = await fetch('/api/v1/clinician/verification', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = 'Failed to submit clinician verification. Please try again.';
    try {
      const payload = await response.json();
      if (payload?.error) message = String(payload.error);
    } catch { /* keep the safe fallback message */ }
    throw new Error(message);
  }

  const result = await response.json();
  return { uid: user.uid, status: result.status === 'pending' ? 'pending' : 'pending' };
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
  try {
    const docRef = doc(db, recordPath); const provenanceUpdate: Provenance = { status: 'VERIFIED', enteredBy: 'system', enteredAt: new Date().toISOString(), verifiedBy: `${clinicianName} (${facilityName})`, verifiedAt: new Date().toISOString() };
    await updateDoc(docRef, { provenance: provenanceUpdate, updatedAt: new Date().toISOString(), ...(adjustments || {}) });
    await logAuditEvent({ actorId: clinicianUid, actorRole: 'CLINICIAN', action: 'RECORD_VERIFIED', objectType: recordPath.split('/')[0] || 'record', objectId: docRef.id, timestamp: new Date().toISOString(), facilityId: facilityName, details: { recordPath, adjustments: adjustments || null } });
  } catch (err) { handleFirestoreError(err, OperationType.WRITE, recordPath); throw err; }
}

export async function addClinicianPrivateNote(motherId: string, clinicianId: string, text: string, childId?: string | null): Promise<string> {
  try { return (await addDoc(collection(db, 'clinicianPrivateNotes'), { motherId, clinicianId, childId: childId || null, text, createdAt: new Date().toISOString() })).id; }
  catch (err) { handleFirestoreError(err, OperationType.CREATE, 'clinicianPrivateNotes'); throw err; }
}

export async function getClinicianPrivateNotes(motherId: string): Promise<ClinicianPrivateNote[]> {
  try { const snap = await getDocs(query(collection(db, 'clinicianPrivateNotes'), where('motherId', '==', motherId), orderBy('createdAt', 'desc'))); return snap.docs.map(d => ({ ...d.data(), id: d.id } as ClinicianPrivateNote)); }
  catch (err) { handleFirestoreError(err, OperationType.LIST, 'clinicianPrivateNotes'); return []; }
}
