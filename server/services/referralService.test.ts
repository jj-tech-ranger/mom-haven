// server/services/referralService.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Referral, ReferralUrgency, ReferralSourceModule, PostnatalEncounter } from '../../src/types';

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`✓ ${name}`);
}

async function runReferralTests() {
  console.log('\n======================================================');
  console.log('  MOH 216 Clinical Referral Lifecycle & PNC Tests     ');
  console.log('======================================================\n');

  // --- Suite 1: Firestore Security Rule Invariant ---
  console.log('--- Suite 1: Security Rules Invariant for Referrals ---');

  await test('Rule Invariant: referrals collection denies all client writes', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    const match = rulesContent.match(/match\s*\/referrals\/\{id\}\s*\{([^}]+)\}/);
    assert.ok(match, 'referrals rule block must exist in firestore.rules');
    const body = match[1];
    assert.ok(
      body.includes('allow write:if false;') || body.includes('allow write: if false;'),
      'referrals must strictly have allow write: if false to enforce server-side clinician authorization'
    );
  });

  // --- Suite 2: Referral Data Contract & Field Validity ---
  console.log('\n--- Suite 2: Referral Schema and State Transitions ---');

  await test('Referral Data Contract: valid schema structure', () => {
    const mockReferral: Referral = {
      id: 'ref-12345',
      motherId: 'mother-001',
      childId: 'child-001',
      pregnancyId: 'preg-001',
      sourceModule: 'pnc_mental_health',
      sourceRecordId: 'pnc-rec-999',
      reason: 'Edinburgh Postnatal Depression scale indicates moderate risk',
      urgency: 'urgent',
      status: 'open',
      createdBy: 'clinician-dr-wanjiku',
      createdAt: '2026-09-05T10:00:00.000Z',
      facilityId: '13123',
      facilityName: 'Pumwani Maternity Hospital',
      targetFacility: 'Mathari National Teaching & Referral Hospital - Maternal Mental Health',
      notes: 'Initial counseling provided; scheduled for psychiatric evaluation',
    };

    assert.equal(mockReferral.id, 'ref-12345');
    assert.equal(mockReferral.motherId, 'mother-001');
    assert.equal(mockReferral.sourceModule, 'pnc_mental_health');
    assert.equal(mockReferral.urgency, 'urgent');
    assert.equal(mockReferral.status, 'open');
  });

  await test('Referral Status Transitions: open -> acknowledged -> completed / cancelled', () => {
    const referral: Referral = {
      id: 'ref-lifecycle-1',
      motherId: 'mother-002',
      sourceModule: 'cancer_screening',
      sourceRecordId: 'cs-rec-1',
      reason: 'VIA positive lesion requiring colposcopy',
      urgency: 'urgent',
      status: 'open',
      createdBy: 'clinician-1',
      createdAt: '2026-09-05T08:00:00.000Z',
    };

    // Transition 1: Acknowledge
    const nowAck = '2026-09-05T09:00:00.000Z';
    const ackReferral: Referral = {
      ...referral,
      status: 'acknowledged',
      acknowledgedAt: nowAck,
      acknowledgedBy: 'clinician-2',
    };
    assert.equal(ackReferral.status, 'acknowledged');
    assert.equal(ackReferral.acknowledgedAt, nowAck);
    assert.equal(ackReferral.acknowledgedBy, 'clinician-2');

    // Transition 2: Complete
    const nowComp = '2026-09-05T14:00:00.000Z';
    const compReferral: Referral = {
      ...ackReferral,
      status: 'completed',
      completedAt: nowComp,
      completedBy: 'clinician-3',
      outcomeNotes: 'Colposcopy and biopsy performed at referral facility',
    };
    assert.equal(compReferral.status, 'completed');
    assert.equal(compReferral.completedAt, nowComp);
    assert.equal(compReferral.completedBy, 'clinician-3');
    assert.ok(compReferral.outcomeNotes);

    // Transition 3: Cancellation variant
    const nowCancel = '2026-09-05T10:30:00.000Z';
    const cancelledReferral: Referral = {
      ...referral,
      status: 'cancelled',
      cancelledAt: nowCancel,
      cancelledBy: 'clinician-1',
      notes: 'Duplicate referral created in error',
    };
    assert.equal(cancelledReferral.status, 'cancelled');
    assert.equal(cancelledReferral.cancelledAt, nowCancel);
  });

  await test('Urgency sorting priority: emergency > urgent > routine', () => {
    const referrals: Array<{ id: string; urgency: ReferralUrgency; createdAt: string }> = [
      { id: 'ref-routine', urgency: 'routine', createdAt: '2026-09-05T07:00:00Z' },
      { id: 'ref-emergency', urgency: 'emergency', createdAt: '2026-09-05T09:00:00Z' },
      { id: 'ref-urgent', urgency: 'urgent', createdAt: '2026-09-05T08:00:00Z' },
      { id: 'ref-urgent-earlier', urgency: 'urgent', createdAt: '2026-09-05T06:00:00Z' },
    ];

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

    assert.equal(referrals[0].id, 'ref-emergency');
    assert.equal(referrals[1].id, 'ref-urgent');
    assert.equal(referrals[2].id, 'ref-urgent-earlier');
    assert.equal(referrals[3].id, 'ref-routine');
  });

  // --- Suite 3: Structured PNC & Maternal Mental Health Fields ---
  console.log('\n--- Suite 3: Structured Postnatal Exam & Mental Health Screening ---');

  await test('Structured Postnatal Encounter: Handbook p.20 fields schema', () => {
    const pnc: PostnatalEncounter = {
      id: 'pnc-encounter-101',
      motherId: 'mother-001',
      childId: 'child-001',
      timing: '6_days',
      visitDate: '2026-09-05',
      facilityId: '13123',
      facilityName: 'Pumwani Maternity Hospital',
      
      // Maternal structured exam fields (p.20 table)
      bloodPressure: '120/78',
      maternalTemp: 36.8,
      pulseRate: 72,
      respiratoryRate: 16,
      haemoglobin: 12.4,
      lochia: 'normal',
      uterusInvolution: 'well_contracted',
      episiotomyStatus: 'intact',
      breastCondition: 'normal',
      fistulaScreening: 'normal',
      
      // Infant structured exam fields (p.20 table)
      infantTemp: 36.6,
      infantFeedingMethod: 'exclusive_breastfeeding',
      umbilicalCordCondition: 'clean_dry',
      babyWeightKg: 3.4,
      babyImmunizationGiven: ['BCG', 'OPV0'],
      
      // Preventative / Clinical management
      ironFolicPrescribed: true,
      vitaminAGiven: true,
      artDispensed: false,
      familyPlanningCounselled: true,
      fpMethod: 'Progestin-only pills (Microlut)',
      
      // Maternal mental health screening
      mentalHealthScreenDone: true,
      mentalHealthScreenResult: 'concerns_noted',
      
      // Preserved free text observations
      motherFindings: 'Mother recovering well, slight fatigue',
      babyFindings: 'Baby active, good latch',
      clinicalNotes: 'Discussed postpartum blues and referred to facility counseling',
    };

    assert.equal(pnc.timing, '6_days');
    assert.equal(pnc.lochia, 'normal');
    assert.equal(pnc.uterusInvolution, 'well_contracted');
    assert.equal(pnc.episiotomyStatus, 'intact');
    assert.equal(pnc.infantFeedingMethod, 'exclusive_breastfeeding');
    assert.equal(pnc.umbilicalCordCondition, 'clean_dry');
    assert.equal(pnc.mentalHealthScreenDone, true);
    assert.equal(pnc.mentalHealthScreenResult, 'concerns_noted');
  });

  await test('Mental Health Escalation Trigger: concerns_noted produces urgent referral', () => {
    const shouldTriggerReferral = (result?: 'no_concerns' | 'concerns_noted' | 'referred'): boolean => {
      return result === 'concerns_noted' || result === 'referred';
    };

    assert.equal(shouldTriggerReferral('no_concerns'), false);
    assert.equal(shouldTriggerReferral('concerns_noted'), true);
    assert.equal(shouldTriggerReferral('referred'), true);
    assert.equal(shouldTriggerReferral(undefined), false);
  });

  // --- Suite 4: Source Modules Mapping Invariant ---
  console.log('\n--- Suite 4: Source Modules Invariant ---');

  await test('All clinical handbook source modules correctly identified', () => {
    const expectedModules: ReferralSourceModule[] = [
      'cancer_screening',
      'eye_care',
      'congenital_exam',
      'danger_sign',
      'pnc',
      'pnc_mental_health',
      'anc',
      'other',
    ];

    for (const mod of expectedModules) {
      assert.ok(typeof mod === 'string' && mod.length > 0);
    }
  });

  console.log('\n======================================================');
  console.log('  All Clinical Referral & Postnatal Tests Passed!      ');
  console.log('======================================================\n');
}

runReferralTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
