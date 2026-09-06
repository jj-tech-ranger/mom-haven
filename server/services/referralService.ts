import { adminDb, document, logAudit, ApiError } from '../clinicianAccess.js';
import type { Referral, ReferralSourceModule, ReferralUrgency, ReferralStatus } from '../../src/types.js';

export interface CreateReferralParams {
  motherId: string;
  childId?: string | null;
  pregnancyId?: string | null;
  sourceModule: ReferralSourceModule;
  sourceRecordId: string;
  reason: string;
  urgency: ReferralUrgency;
  status?: ReferralStatus;
  createdBy: string;
  facilityId?: string | null;
  facilityName?: string | null;
  targetFacility?: string | null;
  notes?: string | null;
}

/**
 * Creates an authoritative clinical referral document in Firestore
 */
export async function createReferral(params: CreateReferralParams): Promise<Referral> {
  const {
    motherId,
    childId = null,
    pregnancyId = null,
    sourceModule,
    sourceRecordId,
    reason,
    urgency,
    status = 'open',
    createdBy,
    facilityId = null,
    facilityName = null,
    targetFacility = null,
    notes = null,
  } = params;

  if (!motherId) throw new ApiError(400, 'motherId is required to create a referral.');
  if (!sourceModule) throw new ApiError(400, 'sourceModule is required.');
  if (!sourceRecordId) throw new ApiError(400, 'sourceRecordId is required.');
  if (!reason) throw new ApiError(400, 'reason is required.');

  const now = new Date().toISOString();
  const ref = adminDb.collection('referrals').doc();

  const referralData: Omit<Referral, 'id'> = {
    motherId,
    childId: childId || null,
    pregnancyId: pregnancyId || null,
    sourceModule,
    sourceRecordId,
    reason,
    urgency: urgency || 'routine',
    status,
    createdBy,
    createdAt: now,
    facilityId: facilityId || null,
    facilityName: facilityName || null,
    targetFacility: targetFacility || null,
    notes: notes || null,
  };

  await ref.set(referralData);
  await logAudit(createdBy, 'CLINICIAN', 'CREATED', 'referrals', ref.id, facilityId, motherId);

  return document(ref.id, referralData) as Referral;
}

/**
 * Surfaces open and acknowledged referrals for a facility roster
 */
export async function getOpenReferralsForFacility(facilityId: string): Promise<Referral[]> {
  const cleanId = String(facilityId || '').trim();
  if (!cleanId) return [];

  const snap = await adminDb
    .collection('referrals')
    .where('facilityId', '==', cleanId)
    .where('status', 'in', ['open', 'acknowledged'])
    .limit(100)
    .get();

  const referrals: Referral[] = snap.docs.map((d) => document(d.id, d.data()) as Referral);

  const urgencyWeight: Record<ReferralUrgency, number> = {
    emergency: 3,
    urgent: 2,
    routine: 1,
  };

  referrals.sort((a, b) => {
    const diff = (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return referrals;
}

/**
 * Returns all referrals for a given mother
 */
export async function getReferralsForMother(motherId: string): Promise<Referral[]> {
  const cleanId = String(motherId || '').trim();
  if (!cleanId) return [];

  const snap = await adminDb
    .collection('referrals')
    .where('motherId', '==', cleanId)
    .limit(100)
    .get();

  const referrals: Referral[] = snap.docs.map((d) => document(d.id, d.data()) as Referral);
  referrals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return referrals;
}

/**
 * Updates status of a referral (open -> acknowledged -> completed / cancelled)
 */
export async function updateReferralStatus(
  referralId: string,
  newStatus: ReferralStatus,
  actorUid: string,
  notes?: string
): Promise<Referral> {
  const docRef = adminDb.collection('referrals').doc(referralId);
  const snap = await docRef.get();
  if (!snap.exists) throw new ApiError(404, 'Referral not found.');

  const now = new Date().toISOString();
  const updateData: Record<string, any> = {
    status: newStatus,
    updatedAt: now,
  };

  if (newStatus === 'acknowledged') {
    updateData.acknowledgedAt = now;
    updateData.acknowledgedBy = actorUid;
  } else if (newStatus === 'completed') {
    updateData.completedAt = now;
    updateData.completedBy = actorUid;
  } else if (newStatus === 'cancelled') {
    updateData.cancelledAt = now;
    updateData.cancelledBy = actorUid;
  }

  if (notes) {
    const currentNotes = snap.data()?.notes || '';
    updateData.notes = currentNotes ? `${currentNotes}\n[${now.split('T')[0]}] ${notes}` : notes;
  }

  await docRef.update(updateData);
  await logAudit(actorUid, 'CLINICIAN', 'UPDATED', 'referrals', referralId, snap.data()?.facilityId || null, snap.data()?.motherId || null);

  const updatedSnap = await docRef.get();
  return document(updatedSnap.id, updatedSnap.data()) as Referral;
}
