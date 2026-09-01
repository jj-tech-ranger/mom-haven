import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, serialize } from '../clinicianAccess.js';

const clean = (value: any) => serialize(value);

export async function getAdminDashboard() {
  const [facilities, clinicians, governance, gates, audits] = await Promise.all([
    adminDb.collection('facilities').limit(1000).get(),
    adminDb.collection('clinicians').limit(1000).get(),
    adminDb.collection('clinicalDecisionRegister').limit(1000).get(),
    adminDb.collection('releaseGates').limit(100).get(),
    adminDb.collection('auditEvents').limit(500).get(),
  ]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const safetyAlerts = audits.docs.filter(d => {
    const x = d.data();
    const t = x.timestamp instanceof Timestamp ? x.timestamp.toDate().getTime() : new Date(x.timestamp || 0).getTime();
    return t >= weekAgo && String(x.action || '').toUpperCase().includes('SAFETY');
  }).length;
  const pending = clinicians.docs.filter(d => d.data()?.verificationStatus === 'pending').length;
  const openGovernance = governance.docs.filter(d => !['approved', 'clinically_reviewed', 'source_verified', 'closed', 'verified'].includes(String(d.data()?.status || '').toLowerCase())).length;
  const gatesOut = gates.docs.map(d => ({ id: d.id, ...clean(d.data()) }));
  const assessed = gatesOut.filter(g => g.status && !['unassessed', 'pending'].includes(String(g.status).toLowerCase())).length;
  const activity = audits.docs.map(d => d.data()).filter(x => {
    const t = String(x.objectType || '').toLowerCase();
    return !['pregnan', 'child', 'patient', 'haven', 'clinicalrecord', 'privatenote'].some(v => t.includes(v));
  }).sort((a, b) => {
    const at = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : new Date(a.timestamp || 0).getTime();
    const bt = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : new Date(b.timestamp || 0).getTime();
    return bt - at;
  }).slice(0, 20).map(x => ({
    time: clean(x.timestamp),
    actorId: String(x.actorId || ''),
    action: String(x.action || ''),
    detail: `${String(x.objectType || '')} · ${String(x.objectId || '')}`,
  }));

  return {
    stats: { activeFacilities: facilities.size, pendingClinicianVerification: pending, openGovernanceItems: openGovernance, safetyAlertsThisWeek: safetyAlerts },
    release: { gates: gatesOut, total: gatesOut.length, assessed },
    activity,
    scope: 'National',
  };
}
