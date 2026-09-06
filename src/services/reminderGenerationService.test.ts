// src/services/reminderGenerationService.test.ts
import assert from 'node:assert';
import {
  computeAncVisitReminders,
  computeChildImmunizationReminders,
  computePncContactReminders,
  computeFamilyPlanningReminders,
  computeHeiFollowupReminders,
  computeCancerScreeningReminders,
  computeMaternalTdReminders,
  filterNewReminders,
  DesiredReminder,
} from './reminderGenerationService';
import { calculateMaternalTdSchedule } from '../utils/maternalTdSchedule';
import { Reminder } from '../types';

console.log('--- Phase 2: Clinical Reminder Auto-Generation Tests ---');

// 1. ANC Visit Schedule (8-contact model)
const motherId = 'user-test-mama';
const pregnancy = {
  id: 'preg-888',
  lmp: '2026-01-01',
  edd: '2026-10-08',
};

const ancReminders = computeAncVisitReminders(motherId, pregnancy);
assert.strictEqual(ancReminders.length, 8, 'Must generate exactly 8 ANC contacts');

// Check first contact (Week 10)
const contact1 = ancReminders.find((r) => r.sourceEventId === 'anc-preg-888-visit-1');
assert.ok(contact1, 'Contact 1 must exist');
assert.strictEqual(contact1.category, 'anc');
assert.strictEqual(contact1.dueDate, '2026-03-12', 'Week 10 from 2026-01-01');
assert.strictEqual(contact1.sharedWithPartner, true, 'Clinical reminders should be shareable with partner');

// Check last contact (Week 40)
const contact8 = ancReminders.find((r) => r.sourceEventId === 'anc-preg-888-visit-8');
assert.ok(contact8, 'Contact 8 must exist');
assert.strictEqual(contact8.dueDate, '2026-10-08', 'Week 40 matches calculated EDD');

// Fallback to EDD if LMP is omitted
const ancFromEdd = computeAncVisitReminders(motherId, { id: 'preg-999', edd: '2026-10-08' });
assert.strictEqual(ancFromEdd.length, 8, 'Must derive 8 ANC visits from EDD alone');
console.log('✓ generates 8 WHO/Kenya MOH ANC contacts deterministically from LMP or EDD');

// 2. KEPI Immunization & Child Schedules
const child = {
  id: 'child-101',
  dateOfBirth: '2026-06-01',
  name: 'Zawadi',
};

const childReminders = computeChildImmunizationReminders(motherId, child);
assert.ok(childReminders.length >= 10, 'Must include birth, 6w, 10w, 14w, 6m, 9m, 18m vaccines and supplements');

const birthBcg = childReminders.find((r) => r.sourceEventId === 'kepi-child-101-BCG');
assert.ok(birthBcg, 'BCG at birth must exist');
assert.strictEqual(birthBcg.dueDate, '2026-06-01', 'Birth vaccine due on DOB');
assert.strictEqual(birthBcg.childId, 'child-101');
assert.strictEqual(birthBcg.category, 'immunization');

const deworming12m = childReminders.find((r) => r.sourceEventId === 'deworming-child-101-12m');
assert.ok(deworming12m, '12-Month Deworming dose must be generated');
assert.strictEqual(deworming12m.dueDate, '2027-05-31', '52 weeks from 2026-06-01');

const vitADeworming24m = childReminders.find((r) => r.sourceEventId === 'vit_a_deworming-child-101-24m');
assert.ok(vitADeworming24m, '24-Month Vitamin A + Deworming reminder must exist');
console.log('✓ generates all KEPI child vaccine doses, Vitamin A, and Deworming dates from DOB');

// 3. Postnatal Care (PNC) Windows
const pncReminders = computePncContactReminders(motherId, {
  eventKey: 'preg-888',
  deliveryDate: '2026-09-01',
  childId: 'child-101',
  pregnancyId: 'preg-888',
});

assert.strictEqual(pncReminders.length, 4, 'Must generate 4 postnatal contacts');
const pnc48h = pncReminders.find((r) => r.sourceEventId === 'pnc-preg-888-48h');
assert.ok(pnc48h);
assert.strictEqual(pnc48h.dueDate, '2026-09-03', '48 hours = Day 2 post-delivery');
assert.strictEqual(pnc48h.category, 'pnc');

const pnc6w = pncReminders.find((r) => r.sourceEventId === 'pnc-preg-888-4-6w');
assert.ok(pnc6w);
assert.strictEqual(pnc6w.dueDate, '2026-10-13', '6 weeks (42 days) post-delivery');
console.log('✓ derives the 4 Kenya MOH PNC contact windows (48h, 1-2wk, 4-6wk, 4-6mo) accurately');

// 4. Pure Idempotency and Deduplication
const allDesired: DesiredReminder[] = [...ancReminders, ...childReminders, ...pncReminders];

// First run on clean user (0 existing)
const firstRunNew = filterNewReminders([], allDesired);
assert.strictEqual(firstRunNew.length, allDesired.length, 'First run should mark all desired as new');

// Mock existing state after first run
const existingInDb: Reminder[] = firstRunNew.map((r, i) => ({
  ...r,
  id: `db-rem-${i}`,
  createdAt: new Date().toISOString(),
}));

// Second run with the same source data
const secondRunNew = filterNewReminders(existingInDb, allDesired);
assert.strictEqual(secondRunNew.length, 0, 'Second run must be strictly idempotent (0 duplicates created)');

// Adding a second child should only generate reminders for the second child
const secondChild = {
  id: 'child-102',
  dateOfBirth: '2026-08-15',
  name: 'Baraka',
};
const secondChildReminders = computeChildImmunizationReminders(motherId, secondChild);
const combinedDesired = [...allDesired, ...secondChildReminders];

const incrementalNew = filterNewReminders(existingInDb, combinedDesired);
assert.strictEqual(incrementalNew.length, secondChildReminders.length, 'Only new child reminders should be queued');
assert.ok(incrementalNew.every((r) => r.childId === 'child-102'));

// Completed reminders should also not be recreated
const completedReminders: Reminder[] = existingInDb.map((r, idx) =>
  idx === 0 ? { ...r, completed: true } : r
);
const afterCompletionNew = filterNewReminders(completedReminders, allDesired);
assert.strictEqual(afterCompletionNew.length, 0, 'Completed reminders must not be resurrected or duplicated');

console.log('✓ guarantees strict idempotency, prevents duplicates, and preserves completed reminders');

// 5. Family Planning (MOH Handbook p.22)
const fpRecordInjectable = {
  id: 'fp-001',
  motherId,
  methodChosen: 'Injectables (DMPA)' as const,
  dateStarted: '2026-06-01',
  counselingDate: '2026-06-01',
  provenance: { status: 'VERIFIED' as const, enteredBy: 'Nurse', enteredAt: '2026-06-01', verifiedBy: 'Nurse', verifiedAt: '2026-06-01' },
};
const fpReminders = computeFamilyPlanningReminders(motherId, fpRecordInjectable as any);
assert.strictEqual(fpReminders.length, 1, 'Generates 1 reminder for DMPA');
assert.strictEqual(fpReminders[0].dueDate, '2026-08-24', '12 weeks (84 days) from 2026-06-01');

// Explicit appointment date overrides default intervals
const fpRecordAppt = {
  ...fpRecordInjectable,
  id: 'fp-002',
  nextAppointmentDate: '2026-08-15',
};
const fpRemindersAppt = computeFamilyPlanningReminders(motherId, fpRecordAppt as any);
assert.strictEqual(fpRemindersAppt[0].dueDate, '2026-08-15', 'Explicit next appointment date respected');
console.log('✓ computes family planning reminders adhering to MOH p.22 method intervals');

// 6. PMTCT / HEI Infant Diagnostic Schedule (MOH Handbook p.36)
const pmtctRecord = {
  id: 'pmtct-001',
  motherId,
  childId: 'child-101',
  isHivExposed: true,
  infantDbsTests: [
    { milestone: '1st_dna_pcr_6wk' as const, result: 'negative' as const },
  ],
};
const heiReminders = computeHeiFollowupReminders(motherId, pmtctRecord as any, '2026-06-01');
assert.strictEqual(heiReminders.length, 1, 'Generates next scheduled test');
assert.strictEqual(heiReminders[0].sourceEventId, 'hei-child-101-2nd_dna_pcr_6mo', 'Advances to 2nd PCR at 6 months');
assert.strictEqual(heiReminders[0].dueDate, '2026-11-30', '6 months (182 days) from 2026-06-01');
console.log('✓ advances HEI infant testing schedule per MOH p.36 four-test protocol');

// 7. Reproductive Organ Cancer Screening (MOH Handbook p.22)
const cancerAbnormal = {
  id: 'cs-001',
  motherId,
  date: '2026-06-01',
  cervicalDone: true,
  cervicalResult: 'positive' as const,
  cervicalTreatment: 'referral' as const,
  breastDone: true,
  breastResult: 'normal' as const,
  provenance: { status: 'VERIFIED' as const, enteredBy: 'Clinician', enteredAt: '2026-06-01', verifiedBy: 'Clinician', verifiedAt: '2026-06-01' },
};
const cancerReminders = computeCancerScreeningReminders(motherId, cancerAbnormal as any);
assert.strictEqual(cancerReminders.length, 1, 'Urgent follow-up generated for abnormal cervical screening');
assert.strictEqual(cancerReminders[0].dueDate, '2026-06-15', '14-day urgent follow-up window');

const cancerNormal = {
  ...cancerAbnormal,
  id: 'cs-002',
  cervicalResult: 'negative' as const,
};
const cancerNormalReminders = computeCancerScreeningReminders(motherId, cancerNormal as any);
assert.strictEqual(cancerNormalReminders.length, 0, 'Normal screening produces no urgent follow-up reminder');
console.log('✓ schedules 14-day urgent follow-up for abnormal cancer screening results per MOH p.22');

// 8. Maternal Td Immunization 5-Dose Schedule & 10-Year Gap Restart (MOH Handbook pp.10-11)
const tdDosesNormal = [
  { doseNumber: 1 as const, dateGiven: '2026-01-01' },
];
const tdSched1 = calculateMaternalTdSchedule(tdDosesNormal as any);
const tdReminders1 = computeMaternalTdReminders(motherId, 'preg-888', tdSched1);
assert.strictEqual(tdReminders1.length, 1, 'Generates next dose reminder (TD-2)');
assert.strictEqual(tdReminders1[0].dueDate, '2026-01-29', 'TD-2 due 4 weeks (28 days) after TD-1');

// Test 10-Year Gap Restart Rule
const tdDosesRestart = [
  { doseNumber: 1 as const, dateGiven: '2010-01-01' },
  { doseNumber: 2 as const, dateGiven: '2026-01-01' },
];
const tdSchedRestart = calculateMaternalTdSchedule(tdDosesRestart as any);
assert.strictEqual(tdSchedRestart.restartedDueTo10YearGap, true, '10-year gap restart flag set');
const tdRemindersRestart = computeMaternalTdReminders(motherId, 'preg-888', tdSchedRestart);
assert.strictEqual(tdRemindersRestart.length, 1);
assert.strictEqual(tdRemindersRestart[0].sourceEventId, 'td-preg-preg-888-dose-2', 'Restarted schedule requires TD-2 next');
assert.strictEqual(tdRemindersRestart[0].dueDate, '2026-01-29', '4 weeks from most recent dose after restart');
console.log('✓ verifies maternal TD 5-dose engine and MOH p.10 10-year gap restart rule');

console.log('All Phase 2 Clinical Reminder Auto-Generation tests passed successfully!');
