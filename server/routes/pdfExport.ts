import express from 'express';
import PDFDocument from 'pdfkit';
import { adminAuth, adminDb, ApiError } from '../clinicianAccess.js';
import {
  computeMOH216ImmunizationSchedule,
  calculateWeightForAgeZScore,
  calculateLengthForAgeZScore,
} from '../../src/utils/clinicalCalculations.js';

export const exportRouter = express.Router();

exportRouter.get('/immunization-certificate/:childId', async (req, res) => {
  try {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sign-in required.' });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const callerUid = decoded.uid;

    const { childId } = req.params;
    if (!childId) {
      return res.status(400).json({ error: 'childId is required.' });
    }

    const childDoc = await adminDb.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({ error: 'Child not found.' });
    }
    const childData = childDoc.data() || {};
    const motherId = childData.motherId;

    // Authorization check: Mother herself, or clinician, or admin
    let isAuthorized = callerUid === motherId;
    let authorizedRole = isAuthorized ? 'MOTHER' : 'UNKNOWN';

    if (!isAuthorized) {
      const userDoc = await adminDb.collection('users').doc(callerUid).get();
      const userRole = userDoc.data()?.role;
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        isAuthorized = true;
        authorizedRole = userRole;
      } else if (userRole === 'CLINICIAN') {
        // Check active session
        const sessionSnap = await adminDb.collection('clinicianAccessSessions')
          .where('clinicianId', '==', callerUid)
          .where('motherId', '==', motherId)
          .where('status', '==', 'active')
          .limit(1)
          .get();
        if (!sessionSnap.empty) {
          isAuthorized = true;
          authorizedRole = 'CLINICIAN';
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to export records for this child.' });
    }

    // Fetch child records
    const immunizationsSnap = await adminDb.collection('children').doc(childId).collection('immunizations').get();
    const administeredRecords = immunizationsSnap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    })) as any[];

    const growthSnap = await adminDb.collection('children').doc(childId).collection('growth').orderBy('date', 'desc').limit(5).get();
    const growthRecords = growthSnap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    })) as any[];

    // Fetch mother profile for metadata
    let motherName = 'Registered Patient';
    if (motherId) {
      const motherDoc = await adminDb.collection('users').doc(motherId).get();
      if (motherDoc.exists) {
        motherName = motherDoc.data()?.displayName || motherDoc.data()?.fullName || motherName;
      }
    }

    // Compute schedule
    const now = new Date();
    const schedule = computeMOH216ImmunizationSchedule(childData.dateOfBirth, administeredRecords, now);

    // Compute growth interpretation
    const latestGrowth = growthRecords[0];
    let growthSummary = 'No recent anthropometric measurements on file.';
    if (latestGrowth && childData.dateOfBirth) {
      const dob = new Date(childData.dateOfBirth);
      const mDate = new Date(latestGrowth.date || now);
      const ageMonths = Math.max(0, (mDate.getTime() - dob.getTime()) / (30.4375 * 24 * 60 * 60 * 1000));
      const sex = childData.sex === 'male' ? 'male' : 'female';
      
      const weightZ = latestGrowth.weightKg ? calculateWeightForAgeZScore(latestGrowth.weightKg, ageMonths, sex) : null;
      const lengthZ = latestGrowth.lengthCm ? calculateLengthForAgeZScore(latestGrowth.lengthCm, ageMonths, sex) : null;

      growthSummary = `Latest Check (${latestGrowth.date}): Weight ${latestGrowth.weightKg ?? '--'} kg` +
        (weightZ ? ` (Z-Score: ${weightZ.zScoreRounded}, ${weightZ.classification.replace(/_/g, ' ')})` : '') +
        (latestGrowth.lengthCm ? `, Length ${latestGrowth.lengthCm} cm` : '') +
        (lengthZ ? ` (Z-Score: ${lengthZ.zScoreRounded})` : '');
    }

    // Audit log
    const auditRef = adminDb.collection('reportGenerationAudit').doc();
    await auditRef.set({
      id: auditRef.id,
      childId,
      motherId,
      generatedBy: callerUid,
      generatedByRole: authorizedRole,
      reportType: 'IMMUNIZATION_CERTIFICATE',
      createdAt: now.toISOString(),
      timestamp: now.toISOString(),
    });

    // Create PDF with PDFKit
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const cleanChildName = (childData.name || 'Child').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanChildName}_MOH216_Immunization_Certificate.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header section
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a8a')
      .text('REPUBLIC OF KENYA - MINISTRY OF HEALTH', { align: 'center' });
    doc.moveDown(0.25);
    doc.fontSize(12).font('Helvetica').fillColor('#334155')
      .text('KENYA EXPANDED PROGRAMME ON IMMUNIZATION (KEPI) / MOH 216', { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a')
      .text('OFFICIAL IMMUNIZATION CERTIFICATE & HEALTH SUMMARY', { align: 'center' });
    doc.moveDown(0.8);

    // Divider
    doc.strokeColor('#cbd5e1').lineWidth(1)
      .moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.6);

    // Child demographics
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('CHILD INFORMATION:');
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    doc.text(`Full Name: ${childData.name || 'Unnamed Child'}       Sex: ${(childData.sex || 'Not specified').toUpperCase()}       DOB: ${childData.dateOfBirth || '--'}`);
    doc.text(`Mother / Primary Guardian: ${motherName}       Child ID: ${childId}`);
    doc.moveDown(0.5);

    // Growth & Nutrition Banner
    doc.rect(40, doc.y, 515, 24).fillAndStroke('#f0fdf4', '#86efac');
    doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold')
      .text(`NUTRITIONAL STATUS (WHO Standards): ${growthSummary}`, 46, doc.y - 18, { width: 500 });
    doc.moveDown(0.8);

    // Immunization Table Header
    const tableTop = doc.y;
    doc.rect(40, tableTop, 515, 20).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('VACCINE', 46, tableTop + 5, { width: 140 });
    doc.text('DOSE', 190, tableTop + 5, { width: 80 });
    doc.text('TARGET AGE', 275, tableTop + 5, { width: 80 });
    doc.text('DUE DATE', 360, tableTop + 5, { width: 75 });
    doc.text('STATUS', 440, tableTop + 5, { width: 50 });
    doc.text('DATE GIVEN', 495, tableTop + 5, { width: 60 });

    let currentY = tableTop + 22;

    // Table rows
    doc.font('Helvetica').fontSize(8);
    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];
      if (currentY > 740) {
        doc.addPage();
        currentY = 40;
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(40, currentY, 515, 18).fill('#f8fafc');
      }

      // Status color code
      let statusColor = '#475569';
      if (item.status === 'given') statusColor = '#16a34a'; // Green
      else if (item.status === 'overdue') statusColor = '#dc2626'; // Red
      else if (item.status === 'due') statusColor = '#2563eb'; // Blue
      else if (item.status === 'scheduled') statusColor = '#64748b'; // Slate

      doc.fillColor('#0f172a').text(item.vaccineName, 46, currentY + 4, { width: 140 });
      doc.fillColor('#334155').text(item.dose, 190, currentY + 4, { width: 80 });
      doc.fillColor('#334155').text(item.targetAgeBracket, 275, currentY + 4, { width: 80 });
      doc.fillColor('#475569').text(item.scheduledDate, 360, currentY + 4, { width: 75 });
      
      doc.fillColor(statusColor).font('Helvetica-Bold')
        .text(item.status.toUpperCase(), 440, currentY + 4, { width: 50 });
      doc.font('Helvetica');

      doc.fillColor('#0f172a').text(item.dateGiven || '--', 495, currentY + 4, { width: 60 });

      currentY += 18;
    }

    // Footer & Certificate verification
    doc.moveDown(2);
    if (doc.y > 720) {
      doc.addPage();
    }
    const footerY = Math.max(doc.y, 720);
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke();
    doc.fillColor('#64748b').fontSize(7).font('Helvetica')
      .text(`Generated on ${now.toISOString()} via MomHaven Digital Health Platform. Official Kenya MOH 216 digital transcript.`, 40, footerY + 6, { align: 'center' });
    doc.text(`Audit ID: ${auditRef.id} | Authorized Role: ${authorizedRole}`, 40, footerY + 16, { align: 'center' });

    doc.end();
  } catch (err: any) {
    console.error('Failed to export immunization certificate:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to generate immunization certificate PDF.' });
    }
  }
});
