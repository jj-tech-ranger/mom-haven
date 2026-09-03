import assert from 'node:assert/strict';
import {
  assembleHealthSummary,
  validateClinicianAccess,
} from './healthSummaryService.js';
import type { ServerHealthContext } from './healthContextService.js';
import type { MomHavenHealthSummary } from '../../src/types/healthSummary.js';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`✓ ${name}`);
}

console.log('\n--- Phase 7: MomHaven Health Summary & Authorization Tests ---\n');

// --------------------------------------------------------------------------
// 1. Authorization Tests
// --------------------------------------------------------------------------

const approvedClinicianUser = { role: 'CLINICIAN' };
const approvedClinicianProfile = { verificationStatus: 'approved', facilityId: 'fac-1', name: 'Dr. Anne' };
const baseTime = new Date('2025-02-15T12:00:00Z');
const futureExpiry = new Date('2025-02-15T12:15:00Z');
const pastExpiry = new Date('2025-02-15T11:59:00Z');

test('authorized clinician: allows approved clinician with active valid session', () => {
  const session = {
    status: 'active',
    clinicianId: 'clinician-123',
    motherId: 'mother-456',
    expiresAt: futureExpiry,
  };

  const result = validateClinicianAccess(
    approvedClinicianUser,
    approvedClinicianProfile,
    session,
    'clinician-123',
    'mother-456',
    baseTime,
  );

  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test('unapproved clinician: rejects clinician whose account is pending verification', () => {
  const pendingProfile = { verificationStatus: 'pending', facilityId: 'fac-1' };
  const session = {
    status: 'active',
    clinicianId: 'clinician-123',
    motherId: 'mother-456',
    expiresAt: futureExpiry,
  };

  const result = validateClinicianAccess(
    approvedClinicianUser,
    pendingProfile,
    session,
    'clinician-123',
    'mother-456',
    baseTime,
  );

  assert.equal(result.valid, false);
  assert.equal(result.error?.status, 403);
  assert.equal(result.error?.message, 'Your clinician account is awaiting verification.');
});

test('unapproved clinician: rejects non-clinician role', () => {
  const motherUser = { role: 'MOTHER' };
  const session = {
    status: 'active',
    clinicianId: 'clinician-123',
    motherId: 'mother-456',
    expiresAt: futureExpiry,
  };

  const result = validateClinicianAccess(
    motherUser,
    approvedClinicianProfile,
    session,
    'clinician-123',
    'mother-456',
    baseTime,
  );

  assert.equal(result.valid, false);
  assert.equal(result.error?.status, 403);
  assert.equal(result.error?.message, 'Clinician access required.');
});

test('expired session: rejects session whose expiresAt timestamp is in the past', () => {
  const session = {
    status: 'active',
    clinicianId: 'clinician-123',
    motherId: 'mother-456',
    expiresAt: pastExpiry,
  };

  const result = validateClinicianAccess(
    approvedClinicianUser,
    approvedClinicianProfile,
    session,
    'clinician-123',
    'mother-456',
    baseTime,
  );

  assert.equal(result.valid, false);
  assert.equal(result.error?.status, 403);
  assert.equal(result.error?.message, 'Access session has expired.');
});

test('revoked session: rejects session with status "revoked" or "expired"', () => {
  const session = {
    status: 'revoked',
    clinicianId: 'clinician-123',
    motherId: 'mother-456',
    expiresAt: futureExpiry,
  };

  const result = validateClinicianAccess(
    approvedClinicianUser,
    approvedClinicianProfile,
    session,
    'clinician-123',
    'mother-456',
    baseTime,
  );

  assert.equal(result.valid, false);
  assert.equal(result.error?.status, 403);
  assert.equal(result.error?.message, 'No active access session for this patient.');
});

test('wrong mother: rejects access when clinician requests a different mother than session bound', () => {
  const session = {
    status: 'active',
    clinicianId: 'clinician-123',
    motherId: 'mother-456',
    expiresAt: futureExpiry,
  };

  const result = validateClinicianAccess(
    approvedClinicianUser,
    approvedClinicianProfile,
    session,
    'clinician-123',
    'different-mother-999',
    baseTime,
  );

  assert.equal(result.valid, false);
  assert.equal(result.error?.status, 403);
  assert.equal(result.error?.message, 'No active access session for this patient.');
});

test('wrong clinician: rejects access when another clinician tries to hijack session', () => {
  const session = {
    status: 'active',
    clinicianId: 'clinician-123',
    motherId: 'mother-456',
    expiresAt: futureExpiry,
  };

  const result = validateClinicianAccess(
    approvedClinicianUser,
    approvedClinicianProfile,
    session,
    'impostor-clinician-888',
    'mother-456',
    baseTime,
  );

  assert.equal(result.valid, false);
  assert.equal(result.error?.status, 403);
  assert.equal(result.error?.message, 'No active access session for this patient.');
});

// --------------------------------------------------------------------------
// 2. Health Summary Aggregation & Edge Cases
// --------------------------------------------------------------------------

test('missing context: builds summary with safe fallback defaults when healthContext is null', () => {
  const emptyRecords = {
    pregnancies: [],
    children: [],
    patientReportedHomeMonitoring: [],
    ancEncounters: [],
    immunizationRecords: [],
    growthMeasurements: [],
  };

  const summary = assembleHealthSummary(
    'mother-test',
    null, // Missing context
    emptyRecords,
    'Sarah',
    'clinician-1',
    {
      sessionId: 'sess-1',
      clinicianId: 'clinician-1',
      facilityId: 'fac-1',
      expiresAt: futureExpiry.toISOString(),
    },
    baseTime,
  );

  assert.equal(summary.mother.id, 'mother-test');
  assert.equal(summary.mother.displayName, 'Sarah');
  assert.equal(summary.patientContext.lifecycleStage, 'pregnancy');
  assert.equal(summary.patientContext.provenance, 'USER_REPORTED');
  assert.deepEqual(summary.patientContext.interests, []);
  assert.deepEqual(summary.patientContext.dietaryPreferences, []);
  assert.equal(summary.pregnancy.hasActivePregnancy, false);
  assert.equal(summary.children.length, 0);
  assert.equal(summary.sessionContext?.sessionId, 'sess-1');
});

test('missing clinical record: gracefully handles mother without pregnancy or children', () => {
  const dummyContext: ServerHealthContext = {
    version: 1,
    schemaVersion: 1,
    userMode: 'authenticated',
    lifecycleStage: 'postpartum',
    preferredName: 'Grace',
    language: 'sw',
    interests: ['Newborn Care'],
    dietaryPreferences: ['Traditional soup'],
    provenance: {
      lifecycleStage: { status: 'REPORTED' },
      userMode: { status: 'REPORTED' },
    },
  };

  const emptyRecords = {
    pregnancies: [],
    children: [],
    patientReportedHomeMonitoring: [],
    ancEncounters: [],
    immunizationRecords: [],
    growthMeasurements: [],
  };

  const summary = assembleHealthSummary(
    'mother-grace',
    dummyContext,
    emptyRecords,
    'Grace',
    'clinician-1',
  );

  assert.equal(summary.pregnancy.hasActivePregnancy, false);
  assert.equal(summary.pregnancy.ancSummary.totalEncounters, 0);
  assert.equal(summary.children.length, 0);
  assert.equal(summary.verifiedHighlights.hasVerifiedPregnancy, false);
});

test('private note exclusion: ensures private clinician notes never leak into summary', () => {
  const dummyContext: ServerHealthContext = {
    version: 1,
    schemaVersion: 1,
    userMode: 'authenticated',
    lifecycleStage: 'pregnancy',
    preferredName: 'Amina',
    interests: ['Nutrition'],
    provenance: {
      lifecycleStage: { status: 'REPORTED' },
      userMode: { status: 'REPORTED' },
    },
  };

  const recordsWithPrivateNotes = {
    pregnancies: [
      {
        id: 'preg-1',
        status: 'active',
        lmp: '2024-07-01',
        edd: '2025-04-07',
        gravida: 1,
        parity: 0,
        clinicalConditions: ['Mild Anemia'],
      },
    ],
    children: [],
    // Simulation of private notes present in database
    clinicianPrivateNotes: [
      { id: 'note-1', text: 'CONFIDENTIAL: Suspected domestic tension', clinicianId: 'clinician-1' },
    ],
    patientReportedHomeMonitoring: [],
    ancEncounters: [
      {
        id: 'anc-1',
        date: '2024-10-15',
        visitNumber: 1,
        bloodPressure: '118/74',
        fetalHeartRate: 144,
        provenance: { status: 'VERIFIED', verifiedBy: 'Nurse Joyce' },
        privateClinicianImpression: 'Patient appeared anxious',
      },
    ],
    immunizationRecords: [],
    growthMeasurements: [],
  };

  const summary = assembleHealthSummary(
    'mother-amina',
    dummyContext,
    recordsWithPrivateNotes,
    'Amina',
  );

  // Assert private note collections and fields do NOT exist in the output summary
  const summaryJson = JSON.stringify(summary);
  assert.equal(summaryJson.includes('CONFIDENTIAL: Suspected domestic tension'), false);
  assert.equal(summaryJson.includes('Patient appeared anxious'), false);
  assert.equal('clinicianPrivateNotes' in summary, false);
});

test('provenance: correctly stamps USER_REPORTED, VERIFIED, and SYSTEM_DERIVED', () => {
  const dummyContext: ServerHealthContext = {
    version: 1,
    schemaVersion: 1,
    userMode: 'authenticated',
    lifecycleStage: 'pregnancy',
    preferredName: 'Mercy',
    language: 'en',
    interests: ['Fitness'],
    dietaryPreferences: ['Iron-rich'],
    questionsForClinician: ['Is light spotting after intercourse normal?'],
    appointmentPreparationNotes: 'Ask doctor about iron supplement side effects',
    provenance: {
      lifecycleStage: { status: 'REPORTED' },
      userMode: { status: 'REPORTED' },
    },
  };

  const records = {
    pregnancies: [
      {
        id: 'preg-1',
        status: 'active',
        lmp: '2024-08-01',
        edd: '2025-05-08',
        gravida: 2,
        parity: 1,
        provenance: { status: 'VERIFIED', verifiedBy: 'Dr. Kip' },
      },
    ],
    children: [
      {
        id: 'child-1',
        name: 'Baraka',
        dateOfBirth: '2024-08-15',
        sex: 'MALE',
        provenance: { status: 'VERIFIED', verifiedBy: 'MOH Nurse' },
      },
    ],
    ancEncounters: [
      {
        id: 'anc-1',
        date: '2024-11-01',
        visitNumber: 1,
        bloodPressure: '120/80',
        provenance: { status: 'VERIFIED', verifiedBy: 'Nurse A' },
      },
      {
        id: 'anc-2',
        date: '2025-01-10',
        visitNumber: 2,
        bloodPressure: '118/76',
        provenance: { status: 'REPORTED', enteredBy: 'Mercy' },
      },
    ],
    immunizationRecords: [
      {
        id: 'vac-1',
        childId: 'child-1',
        vaccineName: 'BCG',
        dateGiven: '2024-08-16',
        provenance: { status: 'VERIFIED', verifiedBy: 'Kariokor HC' },
      },
    ],
    growthMeasurements: [],
    patientReportedHomeMonitoring: [
      {
        id: 'log-1',
        type: 'blood_pressure',
        timestamp: '2025-02-10T08:00:00Z',
        values: { systolic: 122, diastolic: 78 },
        source: 'USER_REPORTED',
        provenance: { status: 'REPORTED' },
      },
    ],
  };

  const summary = assembleHealthSummary(
    'mother-mercy',
    dummyContext,
    records,
    'Mercy',
    'clinician-1',
    undefined,
    baseTime,
  );

  // 1. Patient-reported context provenance
  assert.equal(summary.patientContext.provenance, 'USER_REPORTED');

  // 2. Pregnancy clinical provenance
  assert.equal(summary.pregnancy.provenance, 'VERIFIED');
  assert.equal(summary.pregnancy.currentStage?.isCalculatedFromLmp, true);

  // 3. ANC encounters provenance distinction
  assert.equal(summary.pregnancy.ancSummary.totalEncounters, 2);
  assert.equal(summary.pregnancy.ancSummary.verifiedCount, 1);
  assert.equal(summary.pregnancy.ancSummary.reportedCount, 1);
  assert.equal(summary.pregnancy.ancSummary.encounters[0].provenance.status, 'REPORTED');
  assert.equal(summary.pregnancy.ancSummary.encounters[1].provenance.status, 'VERIFIED');

  // 4. Child record provenance
  assert.equal(summary.children[0].provenance, 'VERIFIED');
  assert.equal(summary.children[0].immunizations.verifiedCount, 1);

  // 5. Home monitoring provenance
  assert.equal(summary.recentHealthLogs[0].provenance.status, 'REPORTED');
  assert.equal(summary.recentHealthLogs[0].source, 'USER_REPORTED');

  // 6. Questions for clinician integration
  assert.ok(summary.questionsForClinician.includes('Is light spotting after intercourse normal?'));
  assert.ok(summary.questionsForClinician.includes('Ask doctor about iron supplement side effects'));

  // 7. Verified Clinical Highlights
  assert.equal(summary.verifiedHighlights.hasVerifiedPregnancy, true);
  assert.equal(summary.verifiedHighlights.verifiedAncContactsCount, 1);
  assert.equal(summary.verifiedHighlights.verifiedVaccinesCount, 1);
});

console.log('\n--- All Phase 7 Health Summary & Clinician Context Tests Passed! ---\n');
