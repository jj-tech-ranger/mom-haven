import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function adminReady() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    initializeApp({ credential: cert(JSON.parse(raw)) });
    return;
  }
  initializeApp();
}

adminReady();
const FIRESTORE_DATABASE_ID = 'mom-haven';
export const adminDb = getFirestore(undefined, FIRESTORE_DATABASE_ID);
export const adminAuth = getAuth();

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function repairApprovedClinicianAccount(uid: string) {
  const authUser = await adminAuth.getUser(uid);
  const email = String(authUser.email || '').trim().toLowerCase();
  if (!email) return null;

  const existingClinician = await adminDb.doc(`clinicians/${uid}`).get();
  if (existingClinician.exists && existingClinician.data()?.verificationStatus === 'approved') {
    const now = FieldValue.serverTimestamp();
    await adminDb.doc(`users/${uid}`).set({
      displayName: String(existingClinician.data()?.name || authUser.displayName || email.split('@')[0]),
      email,
      role: 'CLINICIAN',
      updatedAt: now,
    }, { merge: true });
    return { uid, clinician: existingClinician.data()! };
  }

  const q = await adminDb.collection('clinicians')
    .where('email', '==', email)
    .where('verificationStatus', '==', 'approved')
    .limit(10)
    .get();
  const application = q.docs.find(d => !d.data()?.uid);
  if (!application) return null;

  const source = application.data();
  const now = FieldValue.serverTimestamp();
  const clinicianData = {
    ...source,
    uid,
    email,
    name: String(source.name || authUser.displayName || email.split('@')[0]),
    verificationStatus: 'approved',
    applicationId: application.id,
    activatedAt: now,
    updatedAt: now,
  };

  await adminDb.doc(`users/${uid}`).set({
    displayName: clinicianData.name,
    email,
    role: 'CLINICIAN',
    updatedAt: now,
  }, { merge: true });
  await adminDb.doc(`clinicians/${uid}`).set(clinicianData, { merge: true });
  await adminDb.doc(`users/${application.id}`).delete();
  await application.ref.delete();
  await logAudit(uid, 'CLINICIAN', 'CLINICIAN_ACCOUNT_ACTIVATED', 'clinicians', uid, source.facilityId || null);
  return { uid, clinician: clinicianData };
}

export async function requireClinician(uid: string) {
  const user = await adminDb.doc(`users/${uid}`).get();
  let userData = user.exists ? user.data() : null;

  if (userData?.role !== 'CLINICIAN') {
    const repaired = await repairApprovedClinicianAccount(uid);
    if (repaired) return repaired;
    userData = (await adminDb.doc(`users/${uid}`).get()).data() || null;
  }

  if (!userData || userData.role !== 'CLINICIAN') throw new ApiError(403, 'Clinician access required.');
  const clinician = await adminDb.doc(`clinicians/${uid}`).get();
  if (!clinician.exists || clinician.data()?.verificationStatus !== 'approved') throw new ApiError(403, 'Your clinician account is awaiting verification.');
  return { uid, clinician: clinician.data()! };
}

export async function requireActiveSession(clinicianId: string, motherId: string) {
  const snapshot = await adminDb.collection('clinicianAccessSessions')
    .where('clinicianId', '==', clinicianId).where('motherId', '==', motherId).where('status', '==', 'active').limit(1).get();
  if (snapshot.empty) throw new ApiError(403, 'No active access session for this patient.');
  const sessionDoc = snapshot.docs[0];
  const session = sessionDoc.data();
  const expires = session.expiresAt instanceof Timestamp ? session.expiresAt.toDate() : new Date(session.expiresAt);
  if (expires <= new Date()) {
    await sessionDoc.ref.update({ status: 'expired' });
    throw new ApiError(403, 'Access session has expired.');
  }
  return { sessionId: sessionDoc.id, ...session };
}

export async function logAudit(actorId: string, actorRole: string, action: string, objectType: string, objectId: string, facilityId: string | null = null, motherId: string | null = null) {
  await adminDb.collection('auditEvents').add({ actorId, actorRole, action, objectType, objectId, facilityId, motherId, timestamp: FieldValue.serverTimestamp() });
}

export function serialize(value: any): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value?.toDate instanceof Function) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  return value;
}

export function document(id: string, data: any) { return serialize({ id, ...data }); }
