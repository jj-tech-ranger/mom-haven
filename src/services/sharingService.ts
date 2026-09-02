// src/services/sharingService.ts
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

export interface PartnerRelationship {
  id: string;
  motherId: string;
  motherName?: string;
  partnerId: string | null;
  partnerName?: string;
  connectionCode: string;
  status: 'pending' | 'connected' | 'revoked';
  scope: 'Logistics & Support Only — No Clinical Records Access';
  createdAt: string;
  connectedAt?: string;
}

export interface ClinicianAccessSession {
  id: string;
  motherId: string;
  clinicianId: string | null;
  clinicianName?: string;
  facilityName?: string;
  shareCode: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
}

// Generate random alphanumeric 6-character code
function generateCode(prefix: string, length = 3): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

// 1. Partner Connection Flow
export async function createPartnerConnectionCode(motherId: string, motherName: string = 'Mother'): Promise<PartnerRelationship> {
  try {
    const code = generateCode('HAVEN', 3);
    const colRef = collection(db, 'partnerRelationships');
    const docData = {
      motherId,
      motherName,
      partnerId: null,
      partnerName: null,
      connectionCode: code,
      status: 'pending' as const,
      scope: 'Logistics & Support Only — No Clinical Records Access' as const,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(colRef, docData);
    return {
      ...docData,
      id: docRef.id,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'partnerRelationships');
    throw err;
  }
}

export async function getMotherPartnerRelationship(motherId: string): Promise<PartnerRelationship | null> {
  try {
    const colRef = collection(db, 'partnerRelationships');
    const q = query(colRef, where('motherId', '==', motherId), where('status', 'in', ['pending', 'connected']));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return {
        ...snap.docs[0].data(),
        id: snap.docs[0].id,
      } as PartnerRelationship;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'partnerRelationships');
    return null;
  }
}

export async function redeemPartnerConnectionCode(
  partnerId: string, 
  partnerName: string, 
  rawCode: string
): Promise<{ success: boolean; motherId?: string; motherName?: string; message: string }> {
  try {
    const code = rawCode.trim().toUpperCase();
    const colRef = collection(db, 'partnerRelationships');
    const q = query(colRef, where('connectionCode', '==', code), where('status', '==', 'pending'));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, message: 'Invalid or expired connection code. Please ask the mother to generate a new code.' };
    }

    const relDoc = snap.docs[0];
    const data = relDoc.data() as PartnerRelationship;

    await updateDoc(doc(db, 'partnerRelationships', relDoc.id), {
      partnerId,
      partnerName,
      status: 'connected',
      connectedAt: new Date().toISOString(),
    });

    return {
      success: true,
      motherId: data.motherId,
      motherName: data.motherName || 'Mother',
      message: `Successfully connected to ${data.motherName || 'Partner'}! You can now coordinate birth logistics and view shared appointments.`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'partnerRelationships');
    throw err;
  }
}

// 2. Clinician 15-Minute Ephemeral Access Flow
export async function createClinicShareCode(motherId: string): Promise<ClinicianAccessSession> {
  try {
    const code = generateCode('CLINIC', 4);
    const now = Date.now();
    const expiresAt = new Date(now + 15 * 60 * 1000).toISOString(); // exactly 15 minutes
    const colRef = collection(db, 'clinicianAccessSessions');

    const docData = {
      motherId,
      clinicianId: null,
      clinicianName: null,
      facilityName: null,
      shareCode: code,
      status: 'active' as const,
      createdAt: new Date(now).toISOString(),
      expiresAt,
    };
    const docRef = await addDoc(colRef, docData);
    return {
      ...docData,
      id: docRef.id,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'clinicianAccessSessions');
    throw err;
  }
}

export async function getActiveClinicianSessions(motherId: string): Promise<ClinicianAccessSession[]> {
  try {
    const colRef = collection(db, 'clinicianAccessSessions');
    const q = query(colRef, where('motherId', '==', motherId), where('status', '==', 'active'));
    const snap = await getDocs(q);
    const now = new Date().toISOString();
    return snap.docs
      .map(d => ({ ...d.data(), id: d.id } as ClinicianAccessSession))
      .filter(s => s.expiresAt > now);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'clinicianAccessSessions');
    return [];
  }
}

// 3. Unified Connected Access Dashboard
export async function getConnectedAccessList(motherId: string): Promise<{
  partners: PartnerRelationship[];
  clinicians: ClinicianAccessSession[];
}> {
  try {
    const [partSnap, clinSnap] = await Promise.all([
      getDocs(query(collection(db, 'partnerRelationships'), where('motherId', '==', motherId))),
      getDocs(query(collection(db, 'clinicianAccessSessions'), where('motherId', '==', motherId))),
    ]);

    const partners = partSnap.docs.map(d => ({ ...d.data(), id: d.id } as PartnerRelationship));
    const clinicians = clinSnap.docs.map(d => ({ ...d.data(), id: d.id } as ClinicianAccessSession));

    return { partners, clinicians };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'connectedAccess');
    return { partners: [], clinicians: [] };
  }
}

// 4. One-Tap Revocation
export async function revokePartnerAccess(relationshipId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'partnerRelationships', relationshipId), {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `partnerRelationships/${relationshipId}`);
    throw err;
  }
}

export async function revokeClinicianSession(sessionId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'clinicianAccessSessions', sessionId), {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `clinicianAccessSessions/${sessionId}`);
    throw err;
  }
}
