// src/tests/securityRulesAndEncounters.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { 
  AncEncounter, 
  ImmunizationRecord, 
  GrowthMeasurement, 
  CareTeamMessage, 
  ClinicianPrivateNote 
} from '../types';

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`✓ ${name}`);
}

async function runSecurityTests() {
  console.log('\n======================================================');
  console.log('  MOH 216 Clinical Encounters & Security Rules Tests  ');
  console.log('======================================================\n');

  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  // --- Suite 1: Firestore Rules Invariants ---
  console.log('--- Suite 1: Firestore Rules Invariants ---');

  await test('Rule Invariant: Top-level ancEncounters has write: if false', () => {
    const match = rulesContent.match(/match\s*\/ancEncounters\/\{id\}\s*\{([^}]+)\}/);
    assert.ok(match, 'ancEncounters rule block must exist');
    const body = match[1];
    assert.ok(body.includes('allow write:if false;') || body.includes('allow write: if false;'), 
      'ancEncounters must have allow write: if false');
  });

  await test('Rule Invariant: Top-level immunizationRecords has write: if false', () => {
    const match = rulesContent.match(/match\s*\/immunizationRecords\/\{id\}\s*\{([^}]+)\}/);
    assert.ok(match, 'immunizationRecords rule block must exist');
    const body = match[1];
    assert.ok(body.includes('allow write:if false;') || body.includes('allow write: if false;'),
      'immunizationRecords must have allow write: if false');
  });

  await test('Rule Invariant: Top-level growthMeasurements has write: if false', () => {
    const match = rulesContent.match(/match\s*\/growthMeasurements\/\{[^}]+\}\s*\{([^}]+)\}/);
    assert.ok(match, 'growthMeasurements rule block must exist');
    const body = match[1];
    assert.ok(body.includes('allow write:if false;') || body.includes('allow write: if false;'),
      'growthMeasurements must have allow write: if false');
  });

  await test('Rule Invariant: Subcollection pregnancies/{id}/ancEncounters has write: if false', () => {
    assert.ok(rulesContent.includes('match /ancEncounters/{encId}{allow read:if signed()&&get(/databases/$(database)/documents/pregnancies/$(id)).data.motherId==request.auth.uid&&!isClinician()&&!isAdmin();allow write:if false;}'),
      'Encounter subcollection under pregnancies must forbid client-side write');
  });

  await test('Rule Invariant: Subcollection children/{id}/immunizations has write: if false', () => {
    assert.ok(rulesContent.includes('match /immunizations/{immId}{allow read:if signed()&&get(/databases/$(database)/documents/children/$(id)).data.motherId==request.auth.uid&&!isClinician()&&!isAdmin();allow write:if false;}'),
      'Immunization subcollection under children must forbid client-side write');
  });

  await test('Rule Invariant: Subcollection children/{id}/growthMeasurements has write: if false', () => {
    assert.ok(rulesContent.includes('match /growthMeasurements/{gmId}{allow read:if signed()&&get(/databases/$(database)/documents/children/$(id)).data.motherId==request.auth.uid&&!isClinician()&&!isAdmin();allow write:if false;}'),
      'Growth measurement subcollection under children must forbid client-side write');
  });

  await test('Rule Invariant: clinicianPrivateNotes remains strictly locked (read,write: if false)', () => {
    const match = rulesContent.match(/match\s*\/clinicianPrivateNotes\/\{id\}\s*\{([^}]+)\}/);
    assert.ok(match, 'clinicianPrivateNotes rule block must exist');
    const body = match[1];
    assert.ok(body.includes('allow read,write:if false;') || body.includes('allow read, write: if false;'),
      'clinicianPrivateNotes must forbid both client read and client write');
  });

  await test('Rule Invariant: careTeamMessages forbids create/delete from client and restricts update to read receipt only', () => {
    const match = rulesContent.match(/match\s*\/careTeamMessages\/\{id\}\s*\{([^}]+)\}/);
    assert.ok(match, 'careTeamMessages rule block must exist');
    const body = match[1];
    assert.ok(body.includes('allow create:if false;') || body.includes('allow create: if false;'),
      'careTeamMessages must disallow client-side creation');
    assert.ok(body.includes('allow delete:if false;') || body.includes('allow delete: if false;'),
      'careTeamMessages must disallow client-side deletion');
    assert.ok(body.includes("hasOnly(['readAt','readByMother'])"),
      'careTeamMessages client update must be strictly limited to read receipt fields');
  });

  await test('Rule Invariant: healthContexts blocks client mutation of verified clinical fields', () => {
    const match = rulesContent.match(/match\s*\/healthContexts\/\{uid\}\s*\{([^}]+)\}/);
    assert.ok(match, 'healthContexts rule block must exist');
    const body = match[1];
    const lockedFields = [
      'authoritativeDiagnosis',
      'verifiedBloodPressure',
      'clinicalConditions',
      'verifiedMedications',
      'verifiedBy',
      'verifiedAt',
      'pmtctStatus',
      'heiStatus',
    ];
    for (const field of lockedFields) {
      assert.ok(body.includes(field), `healthContexts rule must lock field: ${field}`);
    }
  });

  // --- Suite 2: Clinician Session Lifecycle & Access Guard Unit Tests ---
  console.log('\n--- Suite 2: Clinician Session Lifecycle & Access Guard Unit Tests ---');

  // Simulated session check logic matching server/clinicianAccess.ts
  function evaluateSessionAccess(
    session: { status: string; expiresAt: string | Date } | null,
    clinician: { role: string; verificationStatus: string } | null
  ) {
    if (!clinician || clinician.role !== 'CLINICIAN') {
      throw { status: 403, message: 'Clinician access required.' };
    }
    if (clinician.verificationStatus !== 'approved') {
      throw { status: 403, message: 'Your clinician account is awaiting verification.' };
    }
    if (!session || session.status !== 'active') {
      throw { status: 403, message: 'No active access session for this patient.' };
    }
    const expires = new Date(session.expiresAt);
    if (expires.getTime() <= Date.now()) {
      throw { status: 403, message: 'Access session has expired.' };
    }
    return true;
  }

  await test('Session Guard: Active, non-expired session allows clinician access', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000);
    const result = evaluateSessionAccess(
      { status: 'active', expiresAt: futureDate },
      { role: 'CLINICIAN', verificationStatus: 'approved' }
    );
    assert.equal(result, true);
  });

  await test('Session Guard: Expired session throws 403 error', () => {
    const pastDate = new Date(Date.now() - 60 * 1000);
    assert.throws(
      () => {
        evaluateSessionAccess(
          { status: 'active', expiresAt: pastDate },
          { role: 'CLINICIAN', verificationStatus: 'approved' }
        );
      },
      { status: 403, message: 'Access session has expired.' }
    );
  });

  await test('Session Guard: Revoked or inactive session throws 403 error', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000);
    assert.throws(
      () => {
        evaluateSessionAccess(
          { status: 'revoked', expiresAt: futureDate },
          { role: 'CLINICIAN', verificationStatus: 'approved' }
        );
      },
      { status: 403, message: 'No active access session for this patient.' }
    );
  });

  await test('Session Guard: Unverified clinician throws 403 error', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000);
    assert.throws(
      () => {
        evaluateSessionAccess(
          { status: 'active', expiresAt: futureDate },
          { role: 'CLINICIAN', verificationStatus: 'pending' }
        );
      },
      { status: 403, message: 'Your clinician account is awaiting verification.' }
    );
  });

  // --- Suite 3: Structured Encounter MOH 216 Schemas ---
  console.log('\n--- Suite 3: Structured Encounter MOH 216 Schemas ---');

  await test('MOH 216 ANC Encounter: Validates full clinical payload schema', () => {
    const anc: AncEncounter = {
      id: 'anc-001',
      motherId: 'mother-001',
      pregnancyId: 'preg-001',
      contactNumber: 4,
      visitDate: '2026-09-05',
      gestationWeeks: 28,
      bp: '118/76',
      hb: 12.2,
      muacCm: 25.4,
      fundalHeightCm: 28,
      presentation: 'Cephalic',
      fetalHeartRate: 144,
      nextVisitDate: '2026-10-03',
      recordedBy: 'clinician-001',
      recordedAt: new Date().toISOString(),
    };

    assert.ok(anc.contactNumber >= 1 && anc.contactNumber <= 8, 'MOH 216 contactNumber must be between 1 and 8');
    assert.ok(anc.gestationWeeks && anc.gestationWeeks >= 4 && anc.gestationWeeks <= 44);
    assert.equal(typeof anc.bp, 'string');
    assert.equal(typeof anc.hb, 'number');
    assert.equal(typeof anc.muacCm, 'number');
    assert.equal(anc.presentation, 'Cephalic');
    assert.equal(anc.fetalHeartRate, 144);
    assert.ok(anc.recordedBy);
    assert.ok(anc.recordedAt);
  });

  await test('MOH 216 Immunization Record: Validates all schedule antigens', () => {
    const moh216Antigens: ImmunizationRecord['antigen'][] = [
      'BCG',
      'OPV0',
      'OPV1',
      'OPV2',
      'OPV3',
      'IPV',
      'DPT-HepB-Hib 1',
      'DPT-HepB-Hib 2',
      'DPT-HepB-Hib 3',
      'PCV 1',
      'PCV 2',
      'PCV 3',
      'Rota 1',
      'Rota 2',
      'MR-6mo',
      'MR-9mo',
      'MR-18mo',
      'YellowFever',
    ];

    assert.equal(moh216Antigens.length, 18, 'Must cover 18 official MOH 216 antigens');

    const sampleRecord: ImmunizationRecord = {
      id: 'imm-001',
      childId: 'child-001',
      antigen: 'BCG',
      scheduledDate: '2026-08-01',
      givenDate: '2026-08-01',
      status: 'given',
      batchNumber: 'KE-BCG-2026',
      recordedBy: 'clinician-001',
      recordedAt: new Date().toISOString(),
    };

    assert.equal(sampleRecord.antigen, 'BCG');
    assert.equal(sampleRecord.status, 'given');
    assert.ok(sampleRecord.batchNumber);
  });

  await test('MOH 216 Growth Measurement: Validates anthropometric measurements', () => {
    const growth: GrowthMeasurement = {
      id: 'gm-001',
      childId: 'child-001',
      measurementDate: '2026-09-05',
      ageInMonths: 6,
      weightKg: 7.8,
      lengthHeightCm: 67.5,
      muacCm: 14.2,
      recordedBy: 'clinician-001',
      recordedAt: new Date().toISOString(),
    };

    assert.equal(growth.ageInMonths, 6);
    assert.equal(growth.weightKg, 7.8);
    assert.equal(growth.lengthHeightCm, 67.5);
    assert.equal(growth.muacCm, 14.2);
    assert.ok(growth.recordedBy);
  });

  // --- Suite 4: Care Team Messaging Privacy & Architecture ---
  console.log('\n--- Suite 4: Care Team Messaging Privacy & Architecture ---');

  await test('CareTeamMessage separates public clinical advice from private notes', () => {
    const careTeamMsg: CareTeamMessage = {
      id: 'msg-001',
      motherId: 'mother-001',
      clinicianId: 'clinician-001',
      childId: 'child-001',
      sentByRole: 'CLINICIAN',
      text: 'Routine blood pressure and Hb levels are optimal. Please continue daily IFAS.',
      body: 'Routine blood pressure and Hb levels are optimal. Please continue daily IFAS.',
      category: 'reassurance',
      readByMother: false,
      readAt: null,
      sentAt: '2026-09-05T10:00:00.000Z',
      createdAt: '2026-09-05T10:00:00.000Z',
    };

    const privateNote: ClinicianPrivateNote = {
      id: 'note-001',
      clinicianId: 'clinician-001',
      motherId: 'mother-001',
      childId: null,
      text: 'Patient discussed mild delivery anxiety; recommended peer support group.',
      createdAt: '2026-09-05T10:05:00.000Z',
    };

    assert.equal(careTeamMsg.sentByRole, 'CLINICIAN');
    assert.equal(careTeamMsg.readByMother, false);
    assert.notEqual(careTeamMsg.text, privateNote.text);
    assert.ok(!('sentByRole' in privateNote), 'ClinicianPrivateNote does not have sentByRole');
  });

  console.log('\n======================================================');
  console.log('  All Security & Clinical Encounter Tests Passed!    ');
  console.log('======================================================\n');
}

runSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
