import assert from 'node:assert/strict';
import {
  assembleHealthSummary,
  validateClinicianAccess,
} from './healthSummaryService';
import type { ServerHealthContext } from './healthContextService';

const future = new Date('2030-01-01T00:00:00.000Z');
const past = new Date('2020-01-01T00:00:00.000Z');

console.log('--- Phase 7: MomHaven Health Summary Service Tests ---');

(() => {
  const context: ServerHealthContext = {
    version: 1,
    userMode: 'authenticated',
    lifecycleStage: 'pregnancy',
    preferredName: 'Sarah',
    language: 'en',
    interests: ['Nutrition'],
    dietaryPreferences: [],
  };

  const summary = assembleHealthSummary(
    'mother-test',
    context,
    { pregnancies: [], children: [], ancEncounters: [], immunizationRecords: [], growthMeasurements: [], muacMeasurements: [] },
    'Sarah',
    'clinician-1',
    { sessionId: 'sess-1', clinicianId: 'clinician-1', facilityId: 'fac-1', expiresAt: future.toISOString() },
    new Date('2025-01-01T00:00:00.000Z'),
  );

  assert.equal(summary.mother.id, 'mother-test');
  assert.equal(summary.mother.displayName, 'Sarah');
  assert.equal(summary.patientContext.lifecycleStage, 'pregnancy');
  assert.equal(summary.patientContext.provenance, 'USER_REPORTED');
  assert.equal(summary.pregnancy.hasActivePregnancy, false);
  assert.equal(summary.children.length, 0);
  assert.equal(summary.sessionContext?.sessionId, 'sess-1');
  console.log('✓ empty clinical records are handled safely');
})();

(() => {
  const context: ServerHealthContext = {
    version: 1,
    userMode: 'authenticated',
    lifecycleStage: 'pregnancy',
    preferredName: 'Amina',
    language: 'en',
    interests: ['Nutrition'],
  };

  const records = {
    pregnancies: [{
      id: 'preg-1',
      status: 'active',
      lmp: '2024-07-01',
      edd: '2025-04-07',
      gravida: 1,
      parity: 0,
      clinicalConditions: ['Mild Anemia'],
    }],
    children: [],
    clinicianPrivateNotes: [{ id: 'note-1', text: 'CONFIDENTIAL', clinicianId: 'clinician-1' }],
    ancEncounters: [{
      id: 'anc-1',
      date: '2024-10-15',
      visitNumber: 1,
      bloodPressure: '118/74',
      fetalHeartRate: 144,
      provenance: { status: 'VERIFIED', verifiedBy: 'Nurse Joyce' },
      privateClinicianImpression: 'PRIVATE OBSERVATION',
    }],
    immunizationRecords: [],
    growthMeasurements: [],
    muacMeasurements: [],
  };

  const summary = assembleHealthSummary('mother-amina', context, records, 'Amina');
  const serialized = JSON.stringify(summary);

  assert.equal(summary.pregnancy.hasActivePregnancy, true);
  assert.deepEqual(summary.pregnancy.clinicalConditions, ['Mild Anemia']);
  assert.equal(serialized.includes('CONFIDENTIAL'), false);
  assert.equal(serialized.includes('PRIVATE OBSERVATION'), false);
  assert.equal('clinicianPrivateNotes' in summary, false);
  console.log('✓ private clinician notes and impressions never leak into the summary');
})();

(() => {
  const context: ServerHealthContext = {
    version: 1,
    lifecycleStage: 'postpartum',
    userMode: 'authenticated',
    preferredName: 'Grace',
    language: 'sw',
    interests: ['Newborn Care'],
    dietaryPreferences: ['Traditional soup'],
    supportSystem: 'family',
    havenResponseStyle: 'concise',
  };

  const summary = assembleHealthSummary(
    'mother-grace',
    context,
    { pregnancies: [], children: [], ancEncounters: [], immunizationRecords: [], growthMeasurements: [], muacMeasurements: [] },
    'Grace',
  );

  assert.equal(summary.patientContext.provenance, 'USER_REPORTED');
  assert.equal(summary.patientContext.language, 'sw');
  assert.deepEqual(summary.patientContext.interests, ['Newborn Care']);
  assert.equal(summary.patientContext.supportSystem, 'family');
  console.log('✓ personalization context remains explicitly user-reported');
})();

(() => {
  const allowed = validateClinicianAccess(
    { role: 'CLINICIAN' },
    { verificationStatus: 'approved' },
    { status: 'active', clinicianId: 'c1', motherId: 'm1', expiresAt: future },
    'c1',
    'm1',
    new Date('2025-01-01T00:00:00.000Z'),
  );
  assert.deepEqual(allowed, { valid: true });

  const wrongMother = validateClinicianAccess(
    { role: 'CLINICIAN' },
    { verificationStatus: 'approved' },
    { status: 'active', clinicianId: 'c1', motherId: 'm1', expiresAt: future },
    'c1',
    'm2',
    new Date('2025-01-01T00:00:00.000Z'),
  );
  assert.equal(wrongMother.valid, false);
  assert.equal(wrongMother.error?.status, 403);

  const expired = validateClinicianAccess(
    { role: 'CLINICIAN' },
    { verificationStatus: 'approved' },
    { status: 'active', clinicianId: 'c1', motherId: 'm1', expiresAt: past },
    'c1',
    'm1',
    new Date('2025-01-01T00:00:00.000Z'),
  );
  assert.equal(expired.valid, false);
  assert.equal(expired.error?.message, 'Access session has expired.');
  console.log('✓ clinician access is fail-closed for wrong patient and expired sessions');
})();

console.log('All Phase 7 MomHaven Health Summary tests passed successfully!');
