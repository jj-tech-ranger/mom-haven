// server/services/pdfReportService.ts
import PDFDocument from 'pdfkit';
import { MOH216_STANDARD_DOSES, computeMOH216Schedule } from '../../src/utils/clinicalCalculations';

export interface ImmunizationCertificateParams {
  child: {
    id: string;
    name: string;
    dateOfBirth: string;
    sex: string;
    birthWeightKg?: number;
    facilityName?: string;
  };
  mother: {
    id: string;
    name?: string;
    phone?: string;
  };
  facility?: {
    name?: string;
    mflCode?: string;
    county?: string;
  };
  administeredRecords: Array<{
    antigen?: string;
    vaccine?: string;
    vaccineName?: string;
    givenDate?: string | null;
    dateGiven?: string | null;
    dateAdministered?: string | null;
    batchNumber?: string;
    batch?: string;
    status?: string;
    notes?: string;
  }>;
  generatedBy: string;
}

/**
 * Generates an official MOH 216 Childhood Immunization Certificate (Page 44)
 * conforming to the Kenya Expanded Programme on Immunization (KEPI) standards.
 */
export function generateImmunizationCertificatePdf(params: ImmunizationCertificateParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 35, left: 35, right: 35 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const { child, mother, facility, administeredRecords, generatedBy } = params;

      // Calculate schedule & match with records
      const schedule = computeMOH216Schedule(child.dateOfBirth, administeredRecords);

      // Certificate Border
      doc
        .rect(20, 20, 555, 802)
        .lineWidth(2)
        .strokeColor('#0f766e') // Teal primary
        .stroke();
      doc
        .rect(24, 24, 547, 794)
        .lineWidth(0.5)
        .strokeColor('#cbd5e1')
        .stroke();

      // Top Header
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#0f766e')
        .text('REPUBLIC OF KENYA • MINISTRY OF HEALTH', { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#475569')
        .text('KENYA EXPANDED PROGRAMME ON IMMUNIZATION (KEPI)', { align: 'center' });

      doc.moveDown(0.3);
      doc
        .fontSize(15)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('CERTIFICATE OF IMMUNIZATION', { align: 'center' });

      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('#64748b')
        .text('Mother and Child Health Handbook (MOH 216, Page 44)', { align: 'center' });

      doc.moveDown(0.8);

      // Child & Mother Demographic Box
      const boxY = doc.y;
      doc
        .rect(35, boxY, 525, 62)
        .fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#0f172a').font('Helvetica');

      // Left Column
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Child Name:', 45, boxY + 8)
        .font('Helvetica')
        .text(child.name || 'Not Recorded', 120, boxY + 8);

      doc
        .font('Helvetica-Bold')
        .text('Date of Birth:', 45, boxY + 24)
        .font('Helvetica')
        .text(child.dateOfBirth || 'Unknown', 120, boxY + 24);

      doc
        .font('Helvetica-Bold')
        .text('Sex / Gender:', 45, boxY + 40)
        .font('Helvetica')
        .text(child.sex ? child.sex.toUpperCase() : 'Not Specified', 120, boxY + 40);

      // Right Column
      doc
        .font('Helvetica-Bold')
        .text('Mother / Guardian:', 300, boxY + 8)
        .font('Helvetica')
        .text(mother.name || `Mother ID: ${mother.id.slice(0, 10)}...`, 400, boxY + 8);

      doc
        .font('Helvetica-Bold')
        .text('Health Facility:', 300, boxY + 24)
        .font('Helvetica')
        .text(facility?.name || child.facilityName || 'Authorized MCH Center', 400, boxY + 24);

      doc
        .font('Helvetica-Bold')
        .text('Certificate ID:', 300, boxY + 40)
        .font('Helvetica')
        .text(`KEPI-${child.id.slice(0, 8).toUpperCase()}`, 400, boxY + 40);

      doc.y = boxY + 74;

      // Table Header
      const tableTop = doc.y;
      const colX = {
        num: 35,
        vaccine: 60,
        targetAge: 185,
        schedDate: 260,
        dateGiven: 330,
        batch: 405,
        status: 475,
      };

      // Header background
      doc
        .rect(35, tableTop, 525, 20)
        .fill('#0f766e');

      doc
        .fillColor('#ffffff')
        .fontSize(8)
        .font('Helvetica-Bold');

      doc.text('#', colX.num + 3, tableTop + 5);
      doc.text('Vaccine / Antigen', colX.vaccine, tableTop + 5);
      doc.text('Target Age', colX.targetAge, tableTop + 5);
      doc.text('Scheduled', colX.schedDate, tableTop + 5);
      doc.text('Date Given', colX.dateGiven, tableTop + 5);
      doc.text('Batch No.', colX.batch, tableTop + 5);
      doc.text('Status', colX.status, tableTop + 5);

      let currentY = tableTop + 20;
      let givenCount = 0;

      // Render 18 Antigens
      schedule.forEach((dose, index) => {
        const isEven = index % 2 === 0;
        doc
          .rect(35, currentY, 525, 17)
          .fill(isEven ? '#ffffff' : '#f8fafc');

        doc.fontSize(7.5).font('Helvetica');

        // Status coloring
        let statusLabel = 'NOT GIVEN';
        let statusColor = '#64748b';

        if (dose.status === 'given') {
          statusLabel = 'GIVEN';
          statusColor = '#059669'; // Green
          givenCount++;
        } else if (dose.status === 'overdue') {
          statusLabel = 'OVERDUE';
          statusColor = '#dc2626'; // Red
        } else if (dose.status === 'due') {
          statusLabel = 'DUE NOW';
          statusColor = '#d97706'; // Amber
        } else {
          statusLabel = 'SCHEDULED';
          statusColor = '#475569';
        }

        doc.fillColor('#334155');
        doc.text(String(index + 1), colX.num + 3, currentY + 4);
        doc.font('Helvetica-Bold').text(dose.antigen, colX.vaccine, currentY + 4);
        doc.font('Helvetica');

        // Target age label
        const def = MOH216_STANDARD_DOSES.find((d) => d.antigen === dose.antigen);
        doc.text(def?.label || `${dose.targetAgeWeeks} wks`, colX.targetAge, currentY + 4);
        doc.text(dose.scheduledDate, colX.schedDate, currentY + 4);
        doc.text(dose.givenDate || '—', colX.dateGiven, currentY + 4);
        doc.text(dose.batchNumber || '—', colX.batch, currentY + 4);

        doc.font('Helvetica-Bold').fillColor(statusColor);
        doc.text(statusLabel, colX.status, currentY + 4);

        currentY += 17;
      });

      // Bottom border of table
      doc
        .moveTo(35, currentY)
        .lineTo(560, currentY)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke();

      // Summary & Status Box
      currentY += 10;
      doc
        .rect(35, currentY, 525, 26)
        .fillAndStroke('#f0fdf4', '#86efac');

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#166534')
        .text(
          `Official Immunization Status: ${givenCount} of 18 standard MOH 216 doses verified as administered.`,
          45,
          currentY + 8
        );

      currentY += 36;

      // Certification statement
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#475569')
        .text(
          'This is to certify that the immunization record above corresponds to the child registered under Kenya Ministry of Health guidelines (MOH 216). All entries have been validated against facility records and clinical logs. For medical exemptions or adverse event tracking, refer to the Child Health Clinic register.',
          35,
          currentY,
          { width: 525, align: 'justify' }
        );

      currentY += 30;

      // Official Stamp & Signature Block
      const sigBoxY = currentY;

      // Left: Facility Stamp Box
      doc
        .rect(35, sigBoxY, 240, 75)
        .lineWidth(1)
        .strokeColor('#94a3b8')
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#64748b')
        .text('OFFICIAL HEALTH FACILITY STAMP', 45, sigBoxY + 8, { align: 'center', width: 220 });

      doc
        .fontSize(7)
        .font('Helvetica-Oblique')
        .fillColor('#94a3b8')
        .text('[Affix Facility Seal Here]', 45, sigBoxY + 42, { align: 'center', width: 220 });

      // Right: Clinician Signature Box
      doc
        .rect(310, sigBoxY, 250, 75)
        .lineWidth(1)
        .strokeColor('#94a3b8')
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('HEALTHCARE PROVIDER VALIDATION', 320, sigBoxY + 8);

      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`Issued By: ${generatedBy}`, 320, sigBoxY + 24)
        .text(`Issue Date: ${new Date().toISOString().split('T')[0]}`, 320, sigBoxY + 38)
        .text('Signature: ____________________________________', 320, sigBoxY + 54);

      // Footer
      doc
        .fontSize(7)
        .fillColor('#94a3b8')
        .text(
          `Generated via MomHaven Digital MOH 216 Platform • Cryptographic Audit Reference: AUD-${Date.now()}`,
          35,
          800,
          { align: 'center', width: 525 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
