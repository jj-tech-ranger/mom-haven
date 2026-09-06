// server/routes/reports.ts
import { Router } from 'express';
import { adminAuth, adminDb, requireActiveSession, isClinicianUser } from '../clinicianAccess.js';
import { generateImmunizationCertificatePdf } from '../services/pdfReportService.js';

export const reportsRouter = Router();

async function authenticateAnyUser(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, message: 'Authentication required.' };
  }
  const token = authHeader.slice(7);
  return await adminAuth.verifyIdToken(token);
}

/**
 * GET /api/v1/reports/immunization-certificate/:childId
 * Generates official MOH 216 Childhood Immunization Certificate PDF (Page 44)
 */
reportsRouter.get('/immunization-certificate/:childId', async (req, res) => {
  try {
    const token = await authenticateAnyUser(req);
    const { childId } = req.params;
    if (!childId) {
      return res.status(400).json({ error: 'childId parameter is required.' });
    }

    // Fetch Child Document
    const childDoc = await adminDb.doc(`children/${childId}`).get();
    if (!childDoc.exists) {
      return res.status(404).json({ error: 'Child record not found.' });
    }

    const childData = { id: childDoc.id, ...childDoc.data() } as any;
    const motherId = childData.motherId;

    // Authorization Check: Must be Mother, Active Clinician, or Admin
    const isClinician = await isClinicianUser(token.uid);
    const isAdmin = token.role === 'admin' || token.admin === true;
    const isMother = token.uid === motherId;

    if (!isMother && !isAdmin) {
      if (isClinician) {
        // Enforce active session for clinicians
        await requireActiveSession(token.uid, motherId);
      } else {
        return res.status(403).json({ error: 'Access denied. You do not have permission to view this child certificate.' });
      }
    }

    // Fetch Mother Document
    let motherData: any = { id: motherId };
    const motherDoc = await adminDb.doc(`motherProfiles/${motherId}`).get();
    if (motherDoc.exists) {
      motherData = { id: motherId, ...motherDoc.data() };
    } else {
      const userDoc = await adminDb.doc(`users/${motherId}`).get();
      if (userDoc.exists) motherData = { id: motherId, ...userDoc.data() };
    }

    // Fetch Child's Immunization Records
    const [subSnap, topSnap] = await Promise.all([
      adminDb.collection(`children/${childId}/immunizationRecords`).get(),
      adminDb.collection('immunizationRecords').where('childId', '==', childId).get(),
    ]);

    // Deduplicate by antigen
    const recordsMap = new Map<string, any>();
    for (const d of [...subSnap.docs, ...topSnap.docs]) {
      const data = d.data();
      const key = (data.antigen || data.vaccineName || data.vaccine || '').trim().toLowerCase();
      if (key && !recordsMap.has(key)) {
        recordsMap.set(key, data);
      }
    }

    const administeredRecords = Array.from(recordsMap.values());

    // Generate PDF Buffer
    const issuerLabel = isClinician
      ? `Healthcare Provider (${token.email || token.uid.slice(0, 8)})`
      : (isAdmin ? 'Ministry of Health Authorized Admin' : 'MomHaven Digital Records System');

    const pdfBuffer = await generateImmunizationCertificatePdf({
      child: {
        id: childData.id,
        name: childData.name || childData.childName || 'Child',
        dateOfBirth: childData.dateOfBirth || childData.dob || '',
        sex: childData.gender || childData.sex || 'female',
        birthWeightKg: childData.birthWeightKg || childData.birthWeight,
        facilityName: childData.facilityName || childData.birthFacility,
      },
      mother: {
        id: motherId,
        name: motherData.displayName || motherData.name || motherData.fullName,
        phone: motherData.phone || motherData.phoneNumber,
      },
      facility: {
        name: childData.facilityName || 'Authorized MCH Clinic',
        county: motherData.county,
      },
      administeredRecords,
      generatedBy: issuerLabel,
    });

    // Write server-side report audit record
    const auditRef = await adminDb.collection('reportGenerationAudit').add({
      motherId,
      childId: childData.id,
      reportType: 'immunization_certificate',
      generatedAt: new Date().toISOString(),
      generatedBy: token.uid,
      userRole: isClinician ? 'CLINICIAN' : (isAdmin ? 'ADMIN' : 'MOTHER'),
      fileName: `MOH216_Immunization_Certificate_${childData.name || childId}.pdf`,
    });

    const safeName = (childData.name || 'Child').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MOH216_Immunization_Certificate_${safeName}.pdf"`);
    res.setHeader('X-Report-Audit-Id', auditRef.id);
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error('[reportsRouter] Failed to generate certificate:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Failed to generate certificate.' });
  }
});
