import { Router, Request, Response } from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb, ApiError, logAudit, serialize } from '../clinicianAccess.js';

export const adminRouter = Router();

async function auth(req: Request) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Sign-in required.');
  try { return await adminAuth.verifyIdToken(header.slice(7)); } catch { throw new ApiError(401, 'Sign-in required.'); }
}

async function requireAdmin(req: Request) {
  const token = await auth(req);
  const user = await adminDb.doc(`users/${token.uid}`).get();
  if (!user.exists || user.data()?.role !== 'ADMIN') throw new ApiError(403, 'Admin access required.');
  return token;
}

function sendError(res: Response, e: any) { const status = e instanceof ApiError ? e.status : 500; res.status(status).json({ error: e?.message || 'Unable to complete request.' }); }
function clean(value: any) { return serialize(value); }

adminRouter.get('/dashboard', async (req, res) => {
  try {
    const token = await requireAdmin(req);
    const [facilities, clinicians, governance, gates, audits] = await Promise.all([
      adminDb.collection('facilities').limit(1000).get(),
      adminDb.collection('clinicians').limit(1000).get(),
      adminDb.collection('clinicalDecisionRegister').limit(1000).get(),
      adminDb.collection('releaseGates').limit(100).get(),
      adminDb.collection('auditEvents').limit(500).get(),
    ]);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const safetyAlerts = audits.docs.filter(d => {
      const x = d.data(); const t = x.timestamp instanceof Timestamp ? x.timestamp.toDate().getTime() : new Date(x.timestamp || 0).getTime();
      return t >= weekAgo && (String(x.action || '').toUpperCase().includes('SAFETY') || String(x.objectType || '').toLowerCase().includes('safetyalert'));
    }).length;
    const pendingClinicians = clinicians.docs.filter(d => d.data()?.verificationStatus === 'pending').length;
    const openGovernance = governance.docs.filter(d => !['approved', 'closed', 'verified'].includes(String(d.data()?.status || '').toLowerCase())).length;
    const release = gates.docs.map(d => ({ id: d.id, ...clean(d.data()) }));
    const blockedOrOpen = release.filter(g => ['blocked', 'open'].includes(String(g.status || '').toLowerCase())).length;
    const assessed = release.filter(g => g.status && !['unassessed', 'pending'].includes(String(g.status).toLowerCase())).length;
    const activity = audits.docs.map(d => d.data()).filter(x => {
      const type = String(x.objectType || '').toLowerCase();
      return !type.includes('pregnan') && !type.includes('child') && !type.includes('patient') && !type.includes('haven') && !type.includes('clinicalrecord') && !type.includes('privatenote');
    }).sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || ''))).slice(0, 20).map(x => ({
      time: clean(x.timestamp), actorId: String(x.actorId || ''), actorRole: String(x.actorRole || ''), action: String(x.action || ''), detail: `${String(x.objectType || '')} · ${String(x.objectId || '')}`,
    }));
    res.json({ stats: { activeFacilities: facilities.size, pendingClinicianVerification: pendingClinicians, openGovernanceItems: openGovernance, safetyAlertsThisWeek: safetyAlerts }, release: { gates: release, blockedOrOpen, total: release.length, assessed }, activity, scope: 'National' });
    await logAudit(token.uid, 'ADMIN', 'ADMIN_DASHBOARD_VIEWED', 'adminDashboard', token.uid);
  } catch (e) { sendError(res, e); }
});

adminRouter.get('/facilities', async (req, res) => { try { await requireAdmin(req); const q = await adminDb.collection('facilities').limit(1000).get(); res.json({ items: q.docs.map(d => ({ id: d.id, ...clean(d.data()) })) }); } catch (e) { sendError(res, e); } });
adminRouter.post('/facilities', async (req, res) => {
  try {
    const token = await requireAdmin(req); const b = req.body || {};
    const required = ['name', 'kmhflCode', 'county', 'subcounty', 'contactPhone'];
    if (required.some(k => !String(b[k] || '').trim())) throw new ApiError(400, 'Name, KMHFL code, county, subcounty and contact phone are required.');
    const ref = adminDb.collection('facilities').doc();
    await ref.set({ name: String(b.name).trim(), kmhflCode: String(b.kmhflCode).trim(), county: String(b.county).trim(), subcounty: String(b.subcounty).trim(), contactPhone: String(b.contactPhone).trim(), level: b.level ? String(b.level).trim() : null, ambulanceAvailable: b.ambulanceAvailable === true, maternityWardAvailable: b.maternityWardAvailable === true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await logAudit(token.uid, 'ADMIN', 'FACILITY_CREATED', 'facilities', ref.id);
    res.status(201).json({ id: ref.id });
  } catch (e) { sendError(res, e); }
});
adminRouter.patch('/facilities/:id', async (req, res) => {
  try { const token = await requireAdmin(req); const ref = adminDb.doc(`facilities/${req.params.id}`); if (!(await ref.get()).exists) throw new ApiError(404, 'Facility not found.'); const b = req.body || {}; const allowed = ['name','kmhflCode','county','subcounty','contactPhone','level','ambulanceAvailable','maternityWardAvailable']; const patch: Record<string, any> = {}; for (const k of allowed) if (b[k] !== undefined) patch[k] = typeof b[k] === 'string' ? b[k].trim() : b[k]; patch.updatedAt = FieldValue.serverTimestamp(); await ref.update(patch); await logAudit(token.uid, 'ADMIN', 'FACILITY_UPDATED', 'facilities', ref.id); res.json({ success: true }); } catch (e) { sendError(res, e); }
});

adminRouter.get('/clinicians', async (req, res) => {
  try {
    await requireAdmin(req);
    const q = await adminDb.collection('clinicians').limit(1000).get();
    const items = await Promise.all(q.docs.map(async d => { const c = d.data(); const u = await adminDb.doc(`users/${d.id}`).get(); return { id: d.id, ...clean(c), displayName: u.data()?.displayName || u.data()?.email || d.id, email: u.data()?.email || '' }; }));
    res.json({ items });
  } catch (e) { sendError(res, e); }
});
adminRouter.get('/clinicians/:id', async (req, res) => { try { await requireAdmin(req); const c = await adminDb.doc(`clinicians/${req.params.id}`).get(); if (!c.exists) throw new ApiError(404, 'Clinician not found.'); const u = await adminDb.doc(`users/${req.params.id}`).get(); res.json({ clinician: { id: c.id, ...clean(c.data()), displayName: u.data()?.displayName || u.data()?.email || c.id, email: u.data()?.email || '' } }); } catch (e) { sendError(res, e); } });

async function clinicianStatus(req: Request, res: Response, status: 'approved'|'rejected'|'suspended') {
  try {
    const token = await requireAdmin(req); const ref = adminDb.doc(`clinicians/${req.params.clinicianId}`); const snap = await ref.get(); if (!snap.exists) throw new ApiError(404, 'Clinician not found.');
    const patch: Record<string, any> = { verificationStatus: status, updatedAt: FieldValue.serverTimestamp() }; if (status === 'rejected') patch.rejectionReason = String(req.body?.reason || '').trim() || 'Verification request was not approved.';
    await ref.update(patch); const action = status === 'approved' ? 'CLINICIAN_APPROVED' : status === 'rejected' ? 'CLINICIAN_REJECTED' : 'CLINICIAN_SUSPENDED'; await logAudit(token.uid, 'ADMIN', action, 'clinicians', ref.id, snap.data()?.facilityId || null); res.json({ success: true, verificationStatus: status });
  } catch (e) { sendError(res, e); }
}
adminRouter.post('/clinician/:clinicianId/approve', (req, res) => void clinicianStatus(req, res, 'approved'));
adminRouter.post('/clinician/:clinicianId/reject', (req, res) => void clinicianStatus(req, res, 'rejected'));
adminRouter.post('/clinician/:clinicianId/suspend', (req, res) => void clinicianStatus(req, res, 'suspended'));

adminRouter.get('/audit', async (req, res) => {
  try {
    await requireAdmin(req); const q = await adminDb.collection('auditEvents').limit(500).get(); const items = q.docs.map(d => ({ id: d.id, ...d.data() })).filter((x: any) => { const t = String(x.objectType || '').toLowerCase(); return !t.includes('pregnan') && !t.includes('child') && !t.includes('patient') && !t.includes('haven') && !t.includes('privatenote'); }).map((x: any) => ({ id: x.id, timestamp: clean(x.timestamp), actorId: x.actorId, actorRole: x.actorRole, action: x.action, objectType: x.objectType, objectId: x.objectId, facilityId: x.facilityId || null })); res.json({ items });
  } catch (e) { sendError(res, e); }
});
