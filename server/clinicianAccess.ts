import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

const FIREBASE_PROJECT_ID = 'mom-haven';

function adminReady() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    initializeApp({ credential: cert(JSON.parse(raw)), projectId: FIREBASE_PROJECT_ID });
    return;
  }
  // Explicit projectId prevents Admin SDK from depending on ambient gcloud
  // project configuration. Credentials still come from ADC in the local
  // environment or the service account supplied above in CI/production.
  initializeApp({ projectId: FIREBASE_PROJECT_ID });
}

adminReady();
const FIRESTORE_DATABASE_ID = 'mom-haven';
export const adminDb = getFirestore(undefined, FIRESTORE_DATABASE_ID);
export const adminAuth = getAuth();

export function getAdminMessaging(): Messaging | null {
  try {
    return getMessaging();
  } catch (err) {
    console.warn('[FirebaseAdmin] FCM messaging initialization note:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export async function requireClinician(uid: string) {
  const user = await adminDb.doc(`users/${uid}`).get();
  if (!user.exists || user.data()?.role !== 'CLINICIAN') throw new ApiError(403, 'Clinician access required.');
  const clinician = await adminDb.doc(`clinicians/${uid}`).get();
  if (!clinician.exists || clinician.data()?.verificationStatus !== 'approved') throw new ApiError(403, 'Your clinician account is awaiting verification.');
  return { uid, clinician: clinician.data()! };
}

export async function requireActiveSession(clinicianId: string, motherId: string): Promise<Record<string, any>> {
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

export async function isClinicianUser(uid: string): Promise<boolean> {
  try {
    const user = await adminDb.doc(`users/${uid}`).get();
    return user.exists && user.data()?.role === 'CLINICIAN';
  } catch {
    return false;
  }
}

export async function logAudit(actorId: string, actorRole: string, action: string, objectType: string, objectId: string, facilityId: string | null = null, motherId: string | null = null) {
  await adminDb.collection('auditEvents').add({ actorId, actorRole, action, objectType, objectId, facilityId, motherId, timestamp: FieldValue.serverTimestamp() });
}

export function serialize(value: any): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}
