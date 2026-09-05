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
import { clearPartnerShare } from './partnerContextService';
import type { ConsentRecord } from '../types';

export interface PartnerSharingScopes {
  logistics: boolean;
  emergencyContacts: boolean;
  moodSignal: boolean;
  sharedReminders: boolean;
}

export const DEFAULT_SHARING_SCOPES: PartnerSharingScopes = {
  logistics: true,
  emergencyContacts: true,
  moodSignal: false, // strictly opt-in by default
  sharedReminders: true,
};

export interface PartnerRelationship {
  id: string;
  motherId: string;
  motherName?: string;
  partnerId: string | null;
  partnerName?: string;
  code?: string;
  connectionCode: string;
  status: 'pending' | 'active' | 'revoked';
  scope: 'Logistics & Support Only — No Clinical Records Access';
  sharingScopes?: PartnerSharingScopes;
  createdAt: string;
  connectedAt?: string;
  revokedAt?: string;
  usedBy?: string;
  usedAt?: string;
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

// Generate random alphanumeric code
export function generateCode(prefix: string, length = 3): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

/**
 * Generates the deterministic composite document ID for partner relationships.
 * Contract: firestore.rules line 9 activePartner(motherId) requires:
 * doc ID == motherId + '_' + partnerId
 */
export function buildPartnerRelationshipDocId(motherId: string, partnerId: string): string {
  return `${motherId}_${partnerId}`;
}

/**
 * Validates that a partner status matches the firestore.rules contract.
 */
export function isValidPartnerStatus(status: unknown): status is PartnerRelationship['status'] {
  return status === 'pending' || status === 'active' || status === 'revoked';
}

// 1. Partner Connection Flow

/**
 * Generates a human-readable partner connection code and stores the pending invitation.
 *
 * Chosen approach for pending doc shape:
 * We use the predictable document ID `code` (e.g. 'HAVEN-7K9') for the pending
 * partnerRelationships document, and simultaneously create the matching companion
 * `partnerConnections/{code}` document.
 *
 * Why this approach:
 * 1. Predictable ID `code` directly satisfies firestore.rules line 24:
 *    `allow read: if signed() && ... (resource.data.status == 'pending' && id == resource.data.code)`
 *    allowing any signed-in partner redeeming the code to read the pending doc directly by ID
 *    without requiring a collection scan.
 * 2. Creating `partnerConnections/{code}` satisfies firestore.rules line 24 for the partner:
 *    `exists(/databases/$(database)/documents/partnerConnections/$(request.resource.data.code)) && ...`
 *    which is a prerequisite for the partner to create the active relationship doc.
 * 3. On redemption, the active relationship is stored under the canonical composite ID
 *    `${motherId}_${partnerId}` with `status: 'active'`, satisfying `activePartner(motherId)`.
 */
export async function createPartnerConnectionCode(motherId: string, motherName: string = 'Mother'): Promise<PartnerRelationship> {
  try {
    const code = generateCode('HAVEN', 3);

    // 1. Create companion partnerConnections document for firestore.rules redemption verification
    try {
      const connRef = doc(db, 'partnerConnections', code);
      await setDoc(connRef, {
        motherId,
        motherName,
        code,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (connErr) {
      console.warn('Could not create companion partnerConnections doc', connErr);
    }

    // 2. Create pending relationship document with predictable ID = code
    const pendingRef = doc(db, 'partnerRelationships', code);
    const docData: Omit<PartnerRelationship, 'id'> = {
      motherId,
      motherName,
      partnerId: null,
      partnerName: null,
      code,
      connectionCode: code,
      status: 'pending',
      scope: 'Logistics & Support Only — No Clinical Records Access',
      sharingScopes: DEFAULT_SHARING_SCOPES,
      createdAt: new Date().toISOString(),
    };
    await setDoc(pendingRef, docData);

    return {
      ...docData,
      id: code,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'partnerRelationships');
    throw err;
  }
}

export async function getMotherPartnerRelationship(motherId: string): Promise<PartnerRelationship | null> {
  try {
    const colRef = collection(db, 'partnerRelationships');
    const q = query(colRef, where('motherId', '==', motherId), where('status', 'in', ['pending', 'active']));
    const snap = await getDocs(q);
    if (!snap.empty) {
      // Prioritize active relationship over pending invitations
      const activeDoc = snap.docs.find(d => d.data().status === 'active');
      const chosen = activeDoc || snap.docs[0];
      return {
        ...chosen.data(),
        id: chosen.id,
      } as PartnerRelationship;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'partnerRelationships');
    return null;
  }
}

export async function getPartnerActiveRelationship(partnerId: string): Promise<PartnerRelationship | null> {
  try {
    const colRef = collection(db, 'partnerRelationships');
    const q = query(colRef, where('partnerId', '==', partnerId), where('status', '==', 'active'));
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
): Promise<{ success: boolean; motherId?: string; motherName?: string; relationshipId?: string; message: string }> {
  try {
    const code = rawCode.trim().toUpperCase();

    // Step 1: Look up the pending invitation.
    // Check predictable doc ID `code` first (matches firestore.rules id==resource.data.code),
    // and fallback to collection query by connectionCode for backward compatibility with legacy auto-id docs.
    let pendingDocData: any = null;
    let pendingDocId: string | null = null;

    try {
      const predictableDocRef = doc(db, 'partnerRelationships', code);
      const predictableSnap = await getDoc(predictableDocRef);
      if (predictableSnap.exists()) {
        const data = predictableSnap.data();
        if (data.status === 'pending') {
          pendingDocData = data;
          pendingDocId = predictableSnap.id;
        }
      }
    } catch {
      // If direct doc lookup fails, continue to collection query
    }

    if (!pendingDocData) {
      // Fallback query for any legacy auto-generated pending docs
      const colRef = collection(db, 'partnerRelationships');
      const q = query(colRef, where('connectionCode', '==', code), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        pendingDocData = snap.docs[0].data();
        pendingDocId = snap.docs[0].id;
      }
    }

    // Also check companion partnerConnections doc if partnerRelationships was missing directly
    if (!pendingDocData) {
      try {
        const connSnap = await getDoc(doc(db, 'partnerConnections', code));
        if (connSnap.exists() && connSnap.data().status === 'pending') {
          pendingDocData = connSnap.data();
          pendingDocId = code;
        }
      } catch {
        // Ignore
      }
    }

    if (!pendingDocData) {
      return { 
        success: false, 
        message: 'Invalid or expired connection code. Please ask the mother to generate a new code.' 
      };
    }

    const motherId = pendingDocData.motherId;
    const motherName = pendingDocData.motherName || 'Mother';

    // Step 2: Write the canonical active relationship doc at composite ID `${motherId}_${partnerId}`
    // Contract: firestore.rules activePartner(motherId) requires:
    // 1. Doc ID exactly `${motherId}_${partnerId}`
    // 2. status: 'active' (NOT 'connected')
    // 3. code: string matching partnerConnections doc
    const relationshipId = buildPartnerRelationshipDocId(motherId, partnerId);
    const activeDocRef = doc(db, 'partnerRelationships', relationshipId);

    const activeData: PartnerRelationship = {
      id: relationshipId,
      motherId,
      motherName,
      partnerId,
      partnerName,
      code,
      connectionCode: code,
      status: 'active',
      scope: 'Logistics & Support Only — No Clinical Records Access',
      sharingScopes: pendingDocData.sharingScopes || DEFAULT_SHARING_SCOPES,
      createdAt: pendingDocData.createdAt || new Date().toISOString(),
      connectedAt: new Date().toISOString(),
    };

    await setDoc(activeDocRef, activeData);

    // Step 3: Transition the pending invitation doc to 'used'
    // Per firestore.rules line 24:
    // allow update: if signed() && (... (resource.data.status=='pending' && request.resource.data.status=='used' && request.resource.data.usedBy==request.auth.uid));
    if (pendingDocId) {
      try {
        await updateDoc(doc(db, 'partnerRelationships', pendingDocId), {
          status: 'used',
          usedBy: partnerId,
          usedAt: new Date().toISOString(),
        });
      } catch (markErr) {
        console.warn('Could not mark pending partnerRelationships doc as used', markErr);
      }
    }

    // Also attempt updating partnerConnections doc if exists
    try {
      await updateDoc(doc(db, 'partnerConnections', code), {
        status: 'used',
        usedBy: partnerId,
        usedAt: new Date().toISOString(),
      });
    } catch {
      // Ignored if rules disallow partner direct update
    }

    return {
      success: true,
      motherId,
      motherName,
      relationshipId,
      message: `Successfully connected to ${motherName}! You can now coordinate birth logistics and view shared appointments.`
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

    // Record auditable consent record for clinician ephemeral access session
    await writeConsentRecord({
      motherId,
      consentType: 'clinician_access',
      targetType: 'clinician',
      targetId: null,
      targetName: 'Clinic Healthcare Provider',
      scopes: ['clinical_records_review'],
      shareCode: code,
      expiresAt,
      metadata: {
        sessionId: docRef.id,
      },
    }).catch((err) => console.warn('[SharingService] Failed to write clinician consent record:', err));

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
    const relRef = doc(db, 'partnerRelationships', relationshipId);
    const snap = await getDoc(relRef);
    const motherId = snap.exists() ? snap.data()?.motherId : null;

    await updateDoc(relRef, {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
    });

    // Also clear partnerShares for immediate privacy revocation
    if (motherId) {
      await clearPartnerShare(motherId).catch(() => {});
      try {
        const partnerId = snap.data()?.partnerId;
        const code = snap.data()?.code;
        const cSnap = await getDocs(query(collection(db, 'consentRecords'), where('motherId', '==', motherId)));
        for (const cDoc of cSnap.docs) {
          const cData = cDoc.data();
          if (cData.consentType === 'partner_access' && !cData.revokedAt) {
            if (!partnerId || cData.targetId === partnerId || cData.shareCode === code) {
              await revokeConsentRecord(cDoc.id);
            }
          }
        }
      } catch (cErr) {
        console.warn('Could not revoke matching consent records:', cErr);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `partnerRelationships/${relationshipId}`);
    throw err;
  }
}

export async function revokeClinicianSession(sessionId: string): Promise<void> {
  try {
    const sRef = doc(db, 'clinicianAccessSessions', sessionId);
    const sSnap = await getDoc(sRef);
    const motherId = sSnap.exists() ? sSnap.data()?.motherId : null;

    await updateDoc(sRef, {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
    });

    if (motherId) {
      try {
        const cSnap = await getDocs(query(collection(db, 'consentRecords'), where('motherId', '==', motherId)));
        for (const cDoc of cSnap.docs) {
          const cData = cDoc.data();
          if (cData.consentType === 'clinician_access' && !cData.revokedAt) {
            if (cData.metadata?.sessionId === sessionId || cData.shareCode === sSnap.data()?.shareCode) {
              await revokeConsentRecord(cDoc.id);
            }
          }
        }
      } catch (cErr) {
        console.warn('Could not revoke matching clinician consent records:', cErr);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `clinicianAccessSessions/${sessionId}`);
    throw err;
  }
}

// 5. Multi-partner queries and granular scope updates
export async function getMotherPartnerRelationships(motherId: string): Promise<PartnerRelationship[]> {
  try {
    const colRef = collection(db, 'partnerRelationships');
    const q = query(colRef, where('motherId', '==', motherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PartnerRelationship));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'partnerRelationships');
    return [];
  }
}

export async function updatePartnerSharingScopes(
  motherId: string,
  partnerId: string,
  scopes: Partial<PartnerSharingScopes>
): Promise<PartnerSharingScopes> {
  const relationshipId = buildPartnerRelationshipDocId(motherId, partnerId);
  return updatePartnerSharingScopesById(relationshipId, scopes);
}

export async function updatePartnerSharingScopesById(
  relationshipId: string,
  scopes: Partial<PartnerSharingScopes>
): Promise<PartnerSharingScopes> {
  try {
    const relRef = doc(db, 'partnerRelationships', relationshipId);
    const snap = await getDoc(relRef);
    const motherId = snap.exists() ? snap.data().motherId : null;
    const currentScopes: PartnerSharingScopes = snap.exists() && snap.data().sharingScopes
      ? snap.data().sharingScopes
      : DEFAULT_SHARING_SCOPES;

    const newScopes: PartnerSharingScopes = {
      ...currentScopes,
      ...scopes,
    };

    await updateDoc(relRef, {
      sharingScopes: newScopes,
      updatedAt: new Date().toISOString(),
    });

    // If moodSignal is switched off, clear partnerShares/{motherId} so the partner immediately sees no mood signal data
    if (scopes.moodSignal === false && motherId) {
      await clearPartnerShare(motherId).catch(() => {});
    }

    return newScopes;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `partnerRelationships/${relationshipId}`);
    throw err;
  }
}

// 6. Auditable Consent Records
export interface WriteConsentRecordInput {
  motherId: string;
  consentType: 'partner_access' | 'clinician_access';
  targetType: 'partner' | 'clinician';
  targetId?: string | null;
  targetName?: string | null;
  scopes?: string[];
  shareCode?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Writes an auditable consent record to /consentRecords/{id}
 */
export async function writeConsentRecord(input: WriteConsentRecordInput): Promise<ConsentRecord> {
  const now = new Date().toISOString();
  const docData: Omit<ConsentRecord, 'id'> = {
    motherId: input.motherId,
    consentType: input.consentType,
    targetType: input.targetType,
    targetId: input.targetId || null,
    targetName: input.targetName || null,
    scopes: input.scopes || (input.targetType === 'partner' ? ['logistics', 'emergencyContacts'] : ['clinical_records_review']),
    shareCode: input.shareCode || null,
    grantedAt: now,
    expiresAt: input.expiresAt || null,
    revokedAt: null,
    metadata: input.metadata || {},
    createdAt: now,
  };

  try {
    const colRef = collection(db, 'consentRecords');
    const docRef = await addDoc(colRef, docData);
    return {
      ...docData,
      id: docRef.id,
    };
  } catch (err) {
    console.warn('[SharingService] writeConsentRecord failed to persist to Firestore:', err);
    return {
      ...docData,
      id: `local_${Date.now()}`,
    };
  }
}

/**
 * Fetches all auditable consent records for a mother, sorted chronologically descending
 */
export async function getConsentRecords(motherId: string): Promise<ConsentRecord[]> {
  if (!motherId) return [];
  try {
    const colRef = collection(db, 'consentRecords');
    const q = query(colRef, where('motherId', '==', motherId));
    const snap = await getDocs(q);
    const records = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ConsentRecord));
    return records.sort((a, b) => {
      const timeA = new Date(a.grantedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.grantedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (err) {
    console.warn('[SharingService] getConsentRecords failed:', err);
    return [];
  }
}

/**
 * Updates a consent record with revokedAt timestamp
 */
export async function revokeConsentRecord(recordId: string): Promise<void> {
  if (!recordId) return;
  try {
    const recordRef = doc(db, 'consentRecords', recordId);
    await updateDoc(recordRef, {
      revokedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SharingService] revokeConsentRecord failed:', err);
  }
}

